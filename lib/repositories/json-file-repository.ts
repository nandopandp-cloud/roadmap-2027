import { promises as fs } from "node:fs";
import path from "node:path";
import { seedContext } from "@/data/seed/context";
import { seedInitiatives } from "@/data/seed/initiatives";
import { seedPlatforms } from "@/data/seed/platforms";
import type { Database } from "@/lib/domain/types";
import { migrateDatabase, SCHEMA_VERSION } from "@/lib/repositories/migrations";
import type { RoadmapRepository } from "@/lib/repositories/types";

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

  private async load(): Promise<Database> {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      const { db, changed } = migrateDatabase(JSON.parse(raw) as Database);
      if (changed) await this.write(db);
      return db;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const seeded = buildSeedDatabase();
      await this.write(seeded);
      return seeded;
    }
  }

  private async write(db: Database): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const tmp = `${this.filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.rename(tmp, this.filePath);
  }
}
