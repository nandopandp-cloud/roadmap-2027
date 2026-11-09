/**
 * Leitura de links do GitHub usados na aba Repositório da iniciativa.
 * Aceita apenas https://github.com/<organização>/<repositório>[/tree/<branch>].
 */

const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO = /^[A-Za-z0-9._-]{1,100}$/;

export interface GithubRepo {
  owner: string;
  repo: string;
  /** Endereço canônico do repositório (sem barra final nem .git). */
  url: string;
}

export interface GithubBranch extends GithubRepo {
  branch: string;
  /** Endereço canônico da branch. */
  branchUrl: string;
}

function segments(value: string): string[] | null {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !["github.com", "www.github.com"].includes(url.hostname.toLowerCase())) return null;
  return url.pathname.split("/").filter(Boolean);
}

function repoFrom(parts: string[]): GithubRepo | null {
  const [owner, rawRepo] = parts;
  const repo = rawRepo?.replace(/\.git$/i, "");
  if (!owner || !repo || !OWNER.test(owner) || !REPO.test(repo) || repo === "." || repo === "..") return null;
  return { owner, repo, url: `https://github.com/${owner}/${repo}` };
}

/** Repositório a partir do link dele (ou de qualquer página dentro dele, como a de uma branch). */
export function parseGithubRepo(value: string): GithubRepo | null {
  const parts = segments(value);
  return parts ? repoFrom(parts) : null;
}

/** Branch a partir de um link https://github.com/<org>/<repo>/tree/<branch>. */
export function parseGithubBranch(value: string): GithubBranch | null {
  const parts = segments(value);
  if (!parts || parts.length < 4 || parts[2] !== "tree") return null;
  const repo = repoFrom(parts);
  if (!repo) return null;
  let branch: string;
  try {
    branch = parts.slice(3).map(decodeURIComponent).join("/");
  } catch {
    return null;
  }
  if (!branch.trim()) return null;
  return { ...repo, branch, branchUrl: `${repo.url}/tree/${parts.slice(3).join("/")}` };
}

export const sameGithubRepo = (a: GithubRepo, b: GithubRepo) =>
  a.owner.toLowerCase() === b.owner.toLowerCase() && a.repo.toLowerCase() === b.repo.toLowerCase();
