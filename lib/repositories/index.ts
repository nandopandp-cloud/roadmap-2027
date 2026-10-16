import "server-only";
import path from "node:path";
import { JsonFileRepository } from "@/lib/repositories/json-file-repository";
import type { RoadmapRepository } from "@/lib/repositories/types";

/** Raiz do projeto, usada para resolver dados locais e artefatos das iniciativas. */
export const PROJECT_ROOT = process.cwd();

let instance: RoadmapRepository | null = null;

/**
 * Seleciona a implementação de persistência.
 * Hoje existe apenas o arquivo JSON local. Para migrar para Supabase, crie
 * `SupabaseRepository` implementando `RoadmapRepository` e selecione-o aqui
 * a partir das variáveis de ambiente (ver README).
 */
export function getRepository(): RoadmapRepository {
  if (!instance) {
    const file = process.env.ROADMAP_DATA_FILE
      ? path.resolve(/* turbopackIgnore: true */ PROJECT_ROOT, process.env.ROADMAP_DATA_FILE)
      : path.join(PROJECT_ROOT, "data", "local", "db.json");
    instance = new JsonFileRepository(file);
  }
  return instance;
}
