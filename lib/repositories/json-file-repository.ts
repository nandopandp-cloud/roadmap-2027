import { promises as fs } from "node:fs";
import path from "node:path";
import { seedContext } from "@/data/seed/context";
import { seedInitiatives } from "@/data/seed/initiatives";
import { seedPlatforms } from "@/data/seed/platforms";
import type { Database } from "@/lib/domain/types";
import { migrateDatabase, SCHEMA_VERSION } from "@/lib/repositories/migrations";
import type { RoadmapRepository } from "@/lib/repositories/types";
import { DomainError } from "@/lib/services/errors";

export const READ_ONLY_MESSAGE =
  "Esta implantação é somente leitura: as alterações não podem ser salvas aqui. Edite no ambiente local (npm run dev) ou configure um banco de dados persistente (ver README → Persistência).";

export function buildSeedDatabase(): Database {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    initiatives: seedInitiatives,
    platforms: seedPlatforms,
    context: seedContext,
    // Sem colaboradores fictícios: o organograma é montado pelo time.
    people: [],
    squads: [],
  });
}

/**
 * Persistência em arquivo JSON local (desenvolvimento e demonstração).
 * As escritas são serializadas em fila e gravadas de forma atômica (arquivo
 * temporário + rename), evitando corrupção em salvamentos concorrentes.
 *
 * Limitação: não é adequada a ambientes serverless com sistema de arquivos
 * efêmero/somente leitura. Ver README → "Persistência".
 */
export class JsonFileRepository implements RoadmapRepository {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async read(): Promise<Database> {
    await this.queue.catch(() => undefined);
    return this.load();
  }

  transaction<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
    const run = this.queue.catch(() => undefined).then(async () => {
      const db = await this.load();
      const result = await mutate(db);
      await this.write(db);
      return result;
    });
    this.queue = run;
    return run;
  }

  /** Resultado do teste de escrita (undefined = ainda não testado). */
  private writable: boolean | undefined;

  async isWritable(): Promise<boolean> {
    if (this.writable !== undefined) return this.writable;
    const probe = path.join(path.dirname(this.filePath), `.teste-escrita-${process.pid}`);
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(probe, "ok", "utf8");
      await fs.unlink(probe);
      this.writable = true;
    } catch {
      this.writable = false;
    }
    return this.writable;
  }

  private async load(): Promise<Database> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const { db, changed } = migrateDatabase(JSON.parse(raw) as Database);
      // A migração é aplicada em memória; gravá-la é opcional (ambientes somente leitura).
      if (changed) await this.write(db).catch(() => undefined);
      return db;
    } catch (error) {
      // Erros de sistema de arquivos (arquivo ausente, pasta inexistente, sem permissão…)
      // levam aos dados iniciais; JSON corrompido (sem `code`) continua sendo erro.
      if (!(error as NodeJS.ErrnoException).code) throw error;
      const seeded = buildSeedDatabase();
      try {
        await this.write(seeded);
      } catch (writeError) {
        // Sem disco gravável (qualquer que seja o código de erro do ambiente):
        // serve os dados iniciais apenas para leitura.
        this.writable = false;
        console.warn("[roadmap] armazenamento somente leitura:", (writeError as NodeJS.ErrnoException).code ?? writeError);
      }
      return seeded;
    }
  }

  private async write(db: Database): Promise<void> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
      await fs.rename(tmp, this.filePath);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code) {
        this.writable = false;
        console.warn("[roadmap] falha ao gravar:", code);
        throw new DomainError(503, READ_ONLY_MESSAGE);
      }
      throw error;
    }
  }
}
