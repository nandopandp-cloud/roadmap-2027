import "server-only";
import { parseGithubRepo } from "@/lib/domain/github";
import { DomainError } from "@/lib/services/errors";

const API = "https://api.github.com";
const TIMEOUT_MS = 8000;
const PER_PAGE = 100;
/** Limite de páginas consultadas (até 1.000 branches por repositório). */
const MAX_PAGES = 10;

export interface GithubBranchList {
  owner: string;
  repo: string;
  url: string;
  defaultBranch: string | null;
  branches: string[];
  /** true quando o repositório tem mais branches do que o limite consultado. */
  truncated: boolean;
}

const TOKEN_HINT = "Para repositórios privados, configure a variável GITHUB_TOKEN com acesso de leitura (ver README).";

function headers(): HeadersInit {
  const token = process.env.GITHUB_TOKEN?.trim();
  return {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "roadmap-2027",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function github(path: string): Promise<Response> {
  const response = await fetch(`${API}${path}`, { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) }).catch(() => {
    throw new DomainError(502, "Não foi possível consultar o GitHub agora. Tente novamente ou informe os links das branches manualmente.");
  });
  if (response.ok) return response;
  if (response.status === 404)
    throw new DomainError(404, `Repositório não encontrado no GitHub ou sem acesso. ${process.env.GITHUB_TOKEN ? "Verifique se o token configurado tem acesso a ele." : TOKEN_HINT}`);
  if (response.status === 401) throw new DomainError(502, "O token do GitHub configurado (GITHUB_TOKEN) é inválido ou expirou.");
  if (response.status === 403 || response.status === 429)
    throw new DomainError(503, `Limite de consultas ao GitHub atingido. Tente novamente em alguns minutos.${process.env.GITHUB_TOKEN ? "" : " Configurar GITHUB_TOKEN aumenta esse limite."}`);
  throw new DomainError(502, "O GitHub não respondeu como esperado. Tente novamente ou informe os links das branches manualmente.");
}

/** Lista as branches de um repositório do GitHub a partir do link dele (somente leitura). */
export async function listGithubBranches(link: string): Promise<GithubBranchList> {
  const parsed = parseGithubRepo(link);
  if (!parsed) throw new DomainError(400, "Informe o link de um repositório do GitHub (https://github.com/organização/repositório).");
  const base = `/repos/${encodeURIComponent(parsed.owner)}/${encodeURIComponent(parsed.repo)}`;

  const info = (await (await github(base)).json()) as { default_branch?: string; name?: string; owner?: { login?: string } };
  const branches: string[] = [];
  let truncated = false;
  for (let page = 1; page <= MAX_PAGES; page++) {
    const rows = (await (await github(`${base}/branches?per_page=${PER_PAGE}&page=${page}`)).json()) as { name?: string }[];
    branches.push(...rows.map((r) => r.name).filter((n): n is string => typeof n === "string"));
    if (rows.length < PER_PAGE) break;
    if (page === MAX_PAGES) truncated = true;
  }

  // Nome oficial (o GitHub corrige maiúsculas/minúsculas e repositórios renomeados).
  const owner = info.owner?.login ?? parsed.owner;
  const repo = info.name ?? parsed.repo;
  const defaultBranch = info.default_branch ?? null;
  branches.sort((a, b) => (a === defaultBranch ? -1 : b === defaultBranch ? 1 : a.localeCompare(b)));
  return { owner, repo, url: `https://github.com/${owner}/${repo}`, defaultBranch, branches, truncated };
}
