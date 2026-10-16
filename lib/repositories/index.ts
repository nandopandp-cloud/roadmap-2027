import "server-only";
import path from "node:path";
import { FileDocumentStore, PostgresDocumentStore, type DocumentStore } from "@/lib/repositories/documents";
import { FileImageStore, PostgresImageStore, type ImageStore } from "@/lib/repositories/images";
import { JsonFileRepository } from "@/lib/repositories/json-file-repository";
import { getPool, resolveDatabaseUrl } from "@/lib/repositories/postgres";
import { PostgresRepository } from "@/lib/repositories/postgres-repository";
import type { RoadmapRepository } from "@/lib/repositories/types";

/** Raiz do projeto, usada para resolver dados locais e artefatos das iniciativas. */
export const PROJECT_ROOT = process.cwd();

export type StorageKind = "postgres" | "arquivo";

let instance: RoadmapRepository | null = null;
let documents: DocumentStore | null = null;

/** Banco Postgres (Neon) quando há conexão configurada; senão, arquivo JSON local. */
export function storageKind(): StorageKind {
  return resolveDatabaseUrl() ? "postgres" : "arquivo";
}

export function getRepository(): RoadmapRepository {
  if (!instance) {
    const url = resolveDatabaseUrl();
    if (url) {
      instance = new PostgresRepository(getPool(url), PROJECT_ROOT);
    } else {
      const file = process.env.ROADMAP_DATA_FILE
        ? path.resolve(/* turbopackIgnore: true */ PROJECT_ROOT, process.env.ROADMAP_DATA_FILE)
        : path.join(PROJECT_ROOT, "data", "local", "db.json");
      instance = new JsonFileRepository(file);
    }
  }
  return instance;
}

/**
 * Armazenamento do conteúdo dos documentos Markdown. `resolve` converte o caminho
 * relativo (já validado) no arquivo do repositório.
 */
export function getDocumentStore(resolve: (relPath: string) => string): DocumentStore {
  if (!documents) {
    const url = resolveDatabaseUrl();
    documents = url ? new PostgresDocumentStore(getPool(url), resolve) : new FileDocumentStore(resolve);
  }
  return documents;
}

let images: ImageStore | null = null;

export function getImageStore(): ImageStore {
  if (!images) {
    const url = resolveDatabaseUrl();
    images = url ? new PostgresImageStore(getPool(url)) : new FileImageStore(path.join(PROJECT_ROOT, "data", "local", "images"));
  }
  return images;
}
