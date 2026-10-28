import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { getDocumentStore, PROJECT_ROOT, storageKind } from "@/lib/repositories";
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

const isDocument = (relPath: string) => DOCUMENT_EXTENSIONS.some((ext) => relPath.toLowerCase().endsWith(ext));
const documentStore = () => getDocumentStore((relPath) => resolveSafe(relPath, DOCUMENT_EXTENSIONS));

export async function artifactExists(relPath: string, extensions: string[]): Promise<boolean> {
  try {
    const absolute = resolveSafe(relPath, extensions);
    // Documentos podem existir no banco mesmo sem arquivo correspondente no repositório.
    if (isDocument(relPath)) return await documentStore().exists(relPath);
    return (await fs.stat(absolute)).isFile();
  } catch {
    return false;
  }
}

export async function readDocument(relPath: string): Promise<{ content: string; modifiedAt: string } | null> {
  resolveSafe(relPath, DOCUMENT_EXTENSIONS);
  return documentStore().read(relPath);
}

export async function writeDocument(relPath: string, content: string): Promise<{ modifiedAt: string }> {
  resolveSafe(relPath, DOCUMENT_EXTENSIONS);
  try {
    return await documentStore().write(relPath, content.endsWith("\n") ? content : `${content}\n`);
  } catch (error) {
    // Erro de sistema de arquivos ao gravar (sem banco configurado) indica ambiente sem escrita.
    if ((error as NodeJS.ErrnoException).code && storageKind() === "arquivo") throw new DomainError(503, READ_ONLY_MESSAGE);
    throw error;
  }
}

/** Leitura/gravação de documentos usada pelos serviços ao salvar textos do formulário. */
export const documentFiles = {
  write: writeDocument,
  exists: (relPath: string) => artifactExists(relPath, DOCUMENT_EXTENSIONS),
};

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
