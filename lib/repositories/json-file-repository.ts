import { constants as fsConstants, promises as fs } from "node:fs";
import path from "node:path";
import { seedContext } from "@/data/seed/context";
import { seedInitiatives } from "@/data/seed/initiatives";
import { seedPlatforms } from "@/data/seed/platforms";
import type { Database } from "@/lib/domain/types";
import { migrateDatabase, SCHEMA_VERSION } from "@/lib/repositories/migrations";
import type { RoadmapRepository } from "@/lib/repositories/types";
import { DomainError } from "@/lib/services/errors";

/** Sistemas de arquivos somente leitura (ex.: funções serverless da Vercel). */
const READ_ONLY_CODES = new Set(["EROFS", "EACCES", "EPERM"]);

export const READ_ONLY_MESSAGE =
  "Esta implantação é somente leitura: as alterações não podem ser salvas aqui. Edite no ambiente local (npm run dev) ou configure um banco de dados persistente (ver README → Persistência).";

export function buildSeedDatabase(): Database {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    initiatives: seedInitiatives,
    platforms: seedPlatforms,
    context: seedContext,
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

  async isWritable(): Promise<boolean> {
    let dir = path.dirname(this.filePath);
    // Sobe até a primeira pasta existente e verifica permissão de escrita.
    for (;;) {
      try {
        await fs.access(dir, fsConstants.W_OK);
        return true;
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== "ENOENT" || path.dirname(dir) === dir) return false;
        dir = path.dirname(dir);
      }
    }
  }

  private async load(): Promise<Database> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const { db, changed } = migrateDatabase(JSON.parse(raw) as Database);
      if (changed) await this.write(db);
      return db;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const seeded = buildSeedDatabase();
      try {
        await this.write(seeded);
      } catch (writeError) {
        // Sem disco gravável: serve os dados iniciais apenas para leitura.
        if (!(writeError instanceof DomainError)) throw writeError;
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
      if (READ_ONLY_CODES.has((error as NodeJS.ErrnoException).code ?? "")) throw new DomainError(503, READ_ONLY_MESSAGE);
      throw error;
    }
  }
}
