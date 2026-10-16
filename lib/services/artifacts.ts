import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "@/lib/repositories";
import { READ_ONLY_MESSAGE } from "@/lib/repositories/json-file-repository";
import { DomainError } from "@/lib/services/errors";
import { DOCUMENT_EXTENSIONS, isSafeRepoPath } from "@/lib/validation/paths";

/**
 * Acesso aos artefatos versionados em `initiatives/` (PRDs, decisões, protótipos).
 * Os caminhos são validados (sem "..", confinados à pasta) e resolvidos no
 * servidor — nunca expostos como URLs públicas de arquivo.
 */
function resolveSafe(relPath: string, extensions: string[]): string {
  if (!isSafeRepoPath(relPath, extensions)) throw new DomainError(400, "Caminho de arquivo inválido.");
  const root = path.join(PROJECT_ROOT, "initiatives");
  const absolute = path.resolve(PROJECT_ROOT, relPath);
  if (!absolute.startsWith(root + path.sep)) throw new DomainError(400, "Caminho de arquivo inválido.");
  return absolute;
}

export async function artifactExists(relPath: string, extensions: string[]): Promise<boolean> {
  try {
    const stat = await fs.stat(resolveSafe(relPath, extensions));
    return stat.isFile();
  } catch {
    return false;
  }
}

export async function readDocument(relPath: string): Promise<{ content: string; modifiedAt: string } | null> {
  const file = resolveSafe(relPath, DOCUMENT_EXTENSIONS);
  try {
    const [content, stat] = await Promise.all([fs.readFile(file, "utf8"), fs.stat(file)]);
    return { content, modifiedAt: stat.mtime.toISOString() };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

export async function writeDocument(relPath: string, content: string): Promise<{ modifiedAt: string }> {
  const file = resolveSafe(relPath, DOCUMENT_EXTENSIONS);
  try {
    await fs.mkdir(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, content.endsWith("\n") ? content : `${content}\n`, "utf8");
    await fs.rename(tmp, file);
  } catch (error) {
    if (["EROFS", "EACCES", "EPERM"].includes((error as NodeJS.ErrnoException).code ?? "")) throw new DomainError(503, READ_ONLY_MESSAGE);
    throw error;
  }
  const stat = await fs.stat(file);
  return { modifiedAt: stat.mtime.toISOString() };
}

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".htm": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

/** Lê um arquivo de protótipo (HTML e seus assets) para servir de forma isolada. */
export async function readPrototypeFile(relPath: string): Promise<{ body: Buffer; type: string } | null> {
  const ext = path.extname(relPath).toLowerCase();
  if (!MIME[ext]) return null;
  // Protótipos só podem ser servidos de dentro de uma pasta `prototype/`.
  if (!relPath.split("/").includes("prototype")) return null;
  let file: string;
  try {
    file = resolveSafe(relPath, Object.keys(MIME));
  } catch {
    return null;
  }
  try {
    return { body: await fs.readFile(file), type: MIME[ext] };
  } catch {
    return null;
  }
}
