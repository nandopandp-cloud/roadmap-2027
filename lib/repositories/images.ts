import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import { ensureSchema } from "@/lib/repositories/postgres";

/** Armazenamento das imagens enviadas (JPEG), identificadas por UUID. */
export interface ImageStore {
  save(id: string, data: Buffer): Promise<void>;
  read(id: string): Promise<Buffer | null>;
}

export class PostgresImageStore implements ImageStore {
  constructor(private readonly pool: Pool) {}

  async save(id: string, data: Buffer) {
    await ensureSchema(this.pool);
    await this.pool.query("INSERT INTO images (id, data) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING", [id, data]);
  }

  async read(id: string) {
    await ensureSchema(this.pool);
    const { rows } = await this.pool.query<{ data: Buffer }>("SELECT data FROM images WHERE id = $1", [id]);
    return rows[0]?.data ?? null;
  }
}

/** Desenvolvimento sem banco: arquivos em data/local/images (gitignored). */
export class FileImageStore implements ImageStore {
  constructor(private readonly dir: string) {}

  async save(id: string, data: Buffer) {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(path.join(this.dir, `${id}.jpg`), data);
  }

  async read(id: string) {
    try {
      return await fs.readFile(path.join(this.dir, `${id}.jpg`));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code) return null;
      throw error;
    }
  }
}
