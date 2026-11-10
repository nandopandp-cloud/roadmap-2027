import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pool } from "pg";
import { ensureSchema } from "@/lib/repositories/postgres";

export interface StoredAttachment {
  name: string;
  contentType: string;
  data: Buffer;
}

/**
 * Arquivos da justificativa do esforço. Chegam em partes (limite de corpo das funções
 * da Vercel), são montados ao concluir o envio e então ficam imutáveis até a remoção.
 */
export interface AttachmentStore {
  savePart(uploadId: string, part: number, data: Buffer): Promise<void>;
  /** Junta as partes 0..parts-1 (null se faltar alguma) e apaga as partes. */
  takeParts(uploadId: string, parts: number): Promise<Buffer | null>;
  save(id: string, file: StoredAttachment): Promise<void>;
  read(id: string): Promise<StoredAttachment | null>;
  remove(id: string): Promise<void>;
}

/** Envios abandonados (partes que nunca foram concluídas) somem depois de um dia. */
const STALE_PARTS = "1 day";

export class PostgresAttachmentStore implements AttachmentStore {
  constructor(private readonly pool: Pool) {}

  async savePart(uploadId: string, part: number, data: Buffer) {
    await ensureSchema(this.pool);
    await this.pool.query(
      "INSERT INTO effort_attachment_parts (upload_id, part, data) VALUES ($1, $2, $3) ON CONFLICT (upload_id, part) DO UPDATE SET data = EXCLUDED.data",
      [uploadId, part, data],
    );
  }

  async takeParts(uploadId: string, parts: number) {
    await ensureSchema(this.pool);
    const { rows } = await this.pool.query<{ part: number; data: Buffer }>(
      "SELECT part, data FROM effort_attachment_parts WHERE upload_id = $1 ORDER BY part",
      [uploadId],
    );
    await this.pool.query(`DELETE FROM effort_attachment_parts WHERE upload_id = $1 OR created_at < now() - interval '${STALE_PARTS}'`, [uploadId]);
    if (rows.length !== parts || rows.some((r, i) => r.part !== i)) return null;
    return Buffer.concat(rows.map((r) => r.data));
  }

  async save(id: string, file: StoredAttachment) {
    await ensureSchema(this.pool);
    await this.pool.query("INSERT INTO effort_attachments (id, name, content_type, data) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING", [
      id,
      file.name,
      file.contentType,
      file.data,
    ]);
  }

  async read(id: string) {
    await ensureSchema(this.pool);
    const { rows } = await this.pool.query<{ name: string; content_type: string; data: Buffer }>(
      "SELECT name, content_type, data FROM effort_attachments WHERE id = $1",
      [id],
    );
    const row = rows[0];
    return row ? { name: row.name, contentType: row.content_type, data: row.data } : null;
  }

  async remove(id: string) {
    await ensureSchema(this.pool);
    await this.pool.query("DELETE FROM effort_attachments WHERE id = $1", [id]);
  }
}

const missing = (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT";

/** Desenvolvimento sem banco: arquivos em data/local/attachments (gitignored). */
export class FileAttachmentStore implements AttachmentStore {
  constructor(private readonly dir: string) {}

  private partsDir(uploadId: string) {
    return path.join(this.dir, "parts", uploadId);
  }

  async savePart(uploadId: string, part: number, data: Buffer) {
    await fs.mkdir(this.partsDir(uploadId), { recursive: true });
    await fs.writeFile(path.join(this.partsDir(uploadId), String(part)), data);
  }

  async takeParts(uploadId: string, parts: number) {
    const dir = this.partsDir(uploadId);
    try {
      const chunks: Buffer[] = [];
      for (let i = 0; i < parts; i++) chunks.push(await fs.readFile(path.join(dir, String(i))));
      const extra = (await fs.readdir(dir)).length !== parts;
      return extra ? null : Buffer.concat(chunks);
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  }

  async save(id: string, file: StoredAttachment) {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(path.join(this.dir, `${id}.bin`), file.data);
    await fs.writeFile(path.join(this.dir, `${id}.json`), JSON.stringify({ name: file.name, contentType: file.contentType }));
  }

  async read(id: string) {
    try {
      const meta = JSON.parse(await fs.readFile(path.join(this.dir, `${id}.json`), "utf8")) as { name: string; contentType: string };
      return { ...meta, data: await fs.readFile(path.join(this.dir, `${id}.bin`)) };
    } catch (error) {
      if (missing(error)) return null;
      throw error;
    }
  }

  async remove(id: string) {
    await fs.rm(path.join(this.dir, `${id}.bin`), { force: true });
    await fs.rm(path.join(this.dir, `${id}.json`), { force: true });
  }
}
