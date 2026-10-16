import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import { ensureSchema } from "@/lib/repositories/postgres";

/** Conteúdo dos documentos Markdown (PRDs, decisões, contexto) identificados pelo caminho no repositório. */
export interface DocumentStore {
  read(relPath: string): Promise<{ content: string; modifiedAt: string } | null>;
  write(relPath: string, content: string): Promise<{ modifiedAt: string }>;
  exists(relPath: string): Promise<boolean>;
}

/** Lê o arquivo versionado do repositório (fonte inicial dos documentos). */
async function readRepoFile(absolute: string) {
  try {
    const [content, stat] = await Promise.all([fs.readFile(absolute, "utf8"), fs.stat(absolute)]);
    return { content, modifiedAt: stat.mtime.toISOString() };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code) return null;
    throw error;
  }
}

/** Documentos gravados como arquivos em initiatives/ (desenvolvimento sem banco). */
export class FileDocumentStore implements DocumentStore {
  constructor(private readonly resolve: (relPath: string) => string) {}

  read(relPath: string) {
    return readRepoFile(this.resolve(relPath));
  }

  async write(relPath: string, content: string) {
    const file = this.resolve(relPath);
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, file);
    const stat = await fs.stat(file);
    return { modifiedAt: stat.mtime.toISOString() };
  }

  async exists(relPath: string) {
    try {
      return (await fs.stat(this.resolve(relPath))).isFile();
    } catch {
      return false;
    }
  }
}

/**
 * Documentos gravados no Postgres. Enquanto um documento não tiver sido salvo no
 * banco, o arquivo versionado do repositório é usado como conteúdo inicial.
 */
export class PostgresDocumentStore implements DocumentStore {
  constructor(
    private readonly pool: Pool,
    private readonly resolve: (relPath: string) => string,
  ) {}

  async read(relPath: string) {
    await ensureSchema(this.pool);
    const { rows } = await this.pool.query<{ content: string; updated_at: Date }>(
      "SELECT content, updated_at FROM documents WHERE path = $1",
      [relPath],
    );
    if (rows[0]) return { content: rows[0].content, modifiedAt: rows[0].updated_at.toISOString() };
    return readRepoFile(this.resolve(relPath));
  }

  async write(relPath: string, content: string) {
    await ensureSchema(this.pool);
    const { rows } = await this.pool.query<{ updated_at: Date }>(
      `INSERT INTO documents (path, content, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (path) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
       RETURNING updated_at`,
      [relPath, content],
    );
    return { modifiedAt: rows[0].updated_at.toISOString() };
  }

  async exists(relPath: string) {
    await ensureSchema(this.pool);
    const { rowCount } = await this.pool.query("SELECT 1 FROM documents WHERE path = $1", [relPath]);
    if (rowCount) return true;
    return (await readRepoFile(this.resolve(relPath))) !== null;
  }
}
