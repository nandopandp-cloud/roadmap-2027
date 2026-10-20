import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pool, PoolClient } from "pg";
import type { Database, Initiative, Person, Platform, Squad } from "@/lib/domain/types";
import { buildSeedDatabase } from "@/lib/repositories/json-file-repository";
import { migrateDatabase, SCHEMA_VERSION } from "@/lib/repositories/migrations";
import { ensureSchema, ROADMAP_LOCK_KEY } from "@/lib/repositories/postgres";
import type { RoadmapRepository } from "@/lib/repositories/types";

type Queryable = Pool | PoolClient;

/**
 * Persistência em Postgres (Neon). Cada alteração roda em uma transação com lock
 * consultivo — equivalente à fila serializada do repositório em arquivo — e grava
 * apenas os registros que mudaram.
 */
export class PostgresRepository implements RoadmapRepository {
  constructor(
    private readonly pool: Pool,
    /** Pasta do projeto, usada na importação inicial (banco local e documentos Markdown). */
    private readonly projectRoot: string,
  ) {}

  async read(): Promise<Database> {
    await this.ready();
    return this.load(this.pool);
  }

  async transaction<T>(mutate: (db: Database) => T | Promise<T>): Promise<T> {
    await this.ready();
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [ROADMAP_LOCK_KEY]);
      const db = await this.load(client);
      const before = structuredClone(db);
      const result = await mutate(db);
      await this.persistChanges(client, before, db);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async isWritable(): Promise<boolean> {
    try {
      await this.ready();
      return true;
    } catch {
      return false;
    }
  }

  /** Garante tabelas e importação inicial (uma vez por processo). */
  private readyPromise: Promise<void> | undefined;
  private ready(): Promise<void> {
    if (!this.readyPromise) {
      this.readyPromise = ensureSchema(this.pool).then(() => this.bootstrap());
      this.readyPromise.catch(() => {
        this.readyPromise = undefined;
      });
    }
    return this.readyPromise;
  }

  /**
   * Importação inicial, executada só quando o banco está vazio: traz os dados já
   * existentes (banco local data/local/db.json, se houver, ou os dados iniciais do
   * repositório) e o conteúdo dos documentos Markdown de initiatives/.
   */
  private async bootstrap(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [ROADMAP_LOCK_KEY]);
      const { rows } = await client.query("SELECT value FROM roadmap_meta WHERE key = 'schema_version'");
      if (rows.length === 0) {
        const source = await this.initialData();
        const empty: Database = {
          schemaVersion: SCHEMA_VERSION,
          initiatives: [],
          platforms: [],
          context: { intro: "", drivers: [], principles: [], problems: [] },
          people: [],
          squads: [],
        };
        await this.persistChanges(client, empty, source);
        await this.importDocuments(client);
        await client.query(
          "INSERT INTO roadmap_meta (key, value) VALUES ('schema_version', $1), ('imported_at', $2)",
          [JSON.stringify(SCHEMA_VERSION), JSON.stringify(new Date().toISOString())],
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  private async initialData(): Promise<Database> {
    try {
      const raw = await fs.readFile(path.join(this.projectRoot, "data", "local", "db.json"), "utf8");
      return migrateDatabase(JSON.parse(raw) as Database).db;
    } catch {
      return buildSeedDatabase();
    }
  }

  private async importDocuments(client: PoolClient): Promise<void> {
    const root = path.join(this.projectRoot, "initiatives");
    const files = await listMarkdown(root).catch(() => [] as string[]);
    for (const absolute of files) {
      const rel = path.relative(this.projectRoot, absolute).split(path.sep).join("/");
      const content = await fs.readFile(absolute, "utf8");
      await client.query("INSERT INTO documents (path, content) VALUES ($1, $2) ON CONFLICT (path) DO NOTHING", [rel, content]);
    }
  }

  private async load(q: Queryable): Promise<Database> {
    const [initiatives, platforms, context, people, squads] = await Promise.all([
      q.query<{ data: Initiative }>("SELECT data FROM initiatives ORDER BY id"),
      q.query<{ data: Platform }>("SELECT data FROM platforms ORDER BY position, id"),
      q.query<{ data: Database["context"] }>("SELECT data FROM strategy_context WHERE id = 1"),
      q.query<{ data: Person }>("SELECT data FROM people ORDER BY id"),
      q.query<{ data: Squad }>("SELECT data FROM squads ORDER BY position, id"),
    ]);
    const db: Database = {
      schemaVersion: SCHEMA_VERSION,
      initiatives: initiatives.rows.map((r) => r.data),
      platforms: platforms.rows.map((r) => r.data),
      context: context.rows[0]?.data ?? { intro: "", drivers: [], principles: [], problems: [] },
      people: people.rows.map((r) => r.data),
      squads: squads.rows.map((r) => r.data),
    };
    // Registros gravados em versões anteriores do esquema são normalizados em memória.
    return migrateDatabase({ ...db, schemaVersion: 1 }).db;
  }

  /** Grava somente o que mudou entre `before` e `after`. */
  private async persistChanges(client: PoolClient, before: Database, after: Database): Promise<void> {
    await persistCollection(client, "initiatives", before.initiatives, after.initiatives, false);
    await persistCollection(client, "platforms", before.platforms, after.platforms, true);
    await persistCollection(client, "people", before.people, after.people, false);
    await persistCollection(client, "squads", before.squads, after.squads, true);

    if (JSON.stringify(before.context) !== JSON.stringify(after.context)) {
      await client.query(
        `INSERT INTO strategy_context (id, data, updated_at) VALUES (1, $1, now())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [JSON.stringify(after.context)],
      );
    }
  }
}

/**
 * Grava os registros alterados de uma coleção (um JSONB por id) e remove os excluídos.
 * `ordered`: a tabela guarda a posição do registro na lista (plataformas, squads).
 */
async function persistCollection<T extends { id: string }>(
  client: PoolClient,
  table: "initiatives" | "platforms" | "people" | "squads",
  before: T[],
  after: T[],
  ordered: boolean,
): Promise<void> {
  const key = (item: T, idx: number) => (ordered ? `${idx}:${JSON.stringify(item)}` : JSON.stringify(item));
  const previous = new Map(before.map((item, idx) => [item.id, key(item, idx)]));
  for (const [idx, item] of after.entries()) {
    if (previous.get(item.id) === key(item, idx)) continue;
    if (ordered) {
      await client.query(
        `INSERT INTO ${table} (id, position, data, updated_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, data = EXCLUDED.data, updated_at = now()`,
        [item.id, idx, JSON.stringify(item)],
      );
    } else {
      await client.query(
        `INSERT INTO ${table} (id, data, updated_at) VALUES ($1, $2, now())
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`,
        [item.id, JSON.stringify(item)],
      );
    }
  }
  const removed = before.filter((b) => !after.some((a) => a.id === b.id)).map((b) => b.id);
  if (removed.length) await client.query(`DELETE FROM ${table} WHERE id = ANY($1)`, [removed]);
}

async function listMarkdown(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((e) => {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) return listMarkdown(full);
      return Promise.resolve(e.name.toLowerCase().endsWith(".md") ? [full] : []);
    }),
  );
  return nested.flat();
}
