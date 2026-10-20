import "server-only";
import { Pool } from "pg";

/**
 * Conexão com o Postgres (Neon). A integração Neon ↔ Vercel cria variáveis como
 * DATABASE_URL / POSTGRES_URL (ou com prefixo personalizado, ex.: ROADMAP_DATABASE_URL).
 * Damos preferência à URL com pool de conexões, adequada a funções serverless.
 */
export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const direct = env.DATABASE_URL || env.POSTGRES_URL;
  if (direct) return direct;
  const key = Object.keys(env)
    .filter((k) => /(^|_)(DATABASE_URL|POSTGRES_URL)$/.test(k) && !/UNPOOLED|NON_POOLING/.test(k))
    .sort()[0];
  return key ? env[key] : undefined;
}

type GlobalWithPool = typeof globalThis & { __roadmapPgPool?: Pool; __roadmapPgSchema?: Promise<void> };
const g = globalThis as GlobalWithPool;

export function getPool(url: string): Pool {
  if (!g.__roadmapPgPool) {
    g.__roadmapPgPool = new Pool({
      connectionString: url,
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      // A Neon exige TLS com certificado válido; conexões locais de desenvolvimento dispensam.
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: true },
    });
  }
  return g.__roadmapPgPool;
}

/**
 * Esquema: um registro JSONB por entidade (iniciativas, plataformas, colaboradores, squads), um registro
 * para o contexto estratégico e o conteúdo dos documentos Markdown. O formato de cada
 * JSON é validado pelos schemas Zod da aplicação.
 */
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS roadmap_meta (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS initiatives (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS people (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS squads (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL DEFAULT 0,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS strategy_context (
  id SMALLINT PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  data BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS documents (
  path TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

/** Cria as tabelas (idempotente), uma vez por processo. */
export function ensureSchema(pool: Pool): Promise<void> {
  if (!g.__roadmapPgSchema) {
    g.__roadmapPgSchema = pool.query(SCHEMA_SQL).then(() => undefined);
    g.__roadmapPgSchema.catch(() => {
      g.__roadmapPgSchema = undefined; // permite nova tentativa após falha de conexão
    });
  }
  return g.__roadmapPgSchema;
}

/** Chave do lock consultivo usado para serializar alterações (equivalente à fila do repositório em arquivo). */
export const ROADMAP_LOCK_KEY = 2027_0001;
