import { INITIATIVES_DIR } from "@/lib/domain/constants";

/**
 * Caminhos de artefatos são sempre relativos à raiz do projeto e confinados
 * ao diretório `initiatives/`. Nunca são tratados como URLs públicas: são
 * resolvidos pelo servidor (rotas /api/documents e /prototipos).
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/;

export function isSafeRepoPath(path: string, extensions: string[]): boolean {
  if (!path || path.length > 300) return false;
  if (path.startsWith("/") || path.includes("\\")) return false;
  const segments = path.split("/");
  if (segments[0] !== INITIATIVES_DIR || segments.length < 3) return false;
  if (segments.some((s) => s === "" || s === "." || s === ".." || !SAFE_SEGMENT.test(s))) return false;
  const lower = path.toLowerCase();
  return extensions.some((ext) => lower.endsWith(ext));
}

export const DOCUMENT_EXTENSIONS = [".md"];
export const PROTOTYPE_EXTENSIONS = [".html", ".htm"];

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/** Gera um "slug" estável e seguro para nomes de pastas e IDs internos. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Pasta padrão de uma iniciativa no repositório, ex.: initiatives/JG-2027-001-autenticacao-estudante */
export function initiativeFolder(id: string, title: string): string {
  const slug = slugify(title);
  return `${INITIATIVES_DIR}/${id}${slug ? `-${slug}` : ""}`;
}
