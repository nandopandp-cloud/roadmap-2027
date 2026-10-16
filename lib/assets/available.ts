import "server-only";
import { readdirSync } from "node:fs";
import path from "node:path";

/**
 * Lista os arquivos presentes em public/illustrations. Usado para que a interface
 * só requisite artes que existem (as enviadas pelo time ou os fallbacks).
 */
export function listIllustrationFiles(): string[] {
  try {
    return readdirSync(path.join(process.cwd(), "public", "illustrations")).map((f) => `/illustrations/${f}`);
  } catch {
    return [];
  }
}
