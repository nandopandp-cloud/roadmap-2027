import type { RoadmapTarget } from "@/lib/domain/roadmap-order";
import type { Initiative, InitiativeEffort, Person, PersonMove, Platform, Roadmap2026, Roadmap2026Item, Squad, StrategyContext } from "@/lib/domain/types";
import type { Viewer } from "@/lib/auth/session";
import type { GithubBranchList } from "@/lib/services/github-service";
import type { PrdImportResult } from "@/lib/services/prd-import";

export interface Snapshot {
  initiatives: Initiative[];
  platforms: Platform[];
  context: StrategyContext;
  people: Person[];
  squads: Squad[];
  /**
   * true quando a pessoa conectada pode alterar conteúdo: o armazenamento grava
   * e o perfil dela é de edição (ver lib/auth/config.ts).
   */
  writable: boolean;
  /** Por que a interface está em modo consulta (null quando `writable`). */
  readOnlyReason: "armazenamento" | "perfil" | null;
  /** Pessoa conectada (conta Google) e seu perfil. */
  viewer: Viewer | null;
  /** Onde os dados estão sendo gravados. */
  storage: "postgres" | "arquivo";
}

/** Erro retornado pela API, com mensagens por campo quando houver validação. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      cache: "no-store",
    });
  } catch {
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", 0);
  }
  const body = await response.json().catch(() => null);
  if (response.status === 401 && typeof window !== "undefined") {
    // Sessão expirou: volta ao login e retorna para a mesma página depois.
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/login?erro=sessao&next=${encodeURIComponent(next)}`);
  }
  if (!response.ok) {
    throw new ApiError(body?.error ?? "Erro inesperado.", response.status, body?.fields ?? {});
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  snapshot: () => request<Snapshot>("/api/snapshot"),
  /** Roadmap 2026: iniciativas importadas da planilha do time e planejadas no app. */
  roadmap2026: () => request<Roadmap2026>("/api/roadmap/2026"),
  /** Head de Produto, Head de Engenharia, tech leads e coordenação de design (checado no servidor). */
  patchRoadmap2026Item: (id: string, data: Partial<Roadmap2026Item>) =>
    request<Roadmap2026Item>(`/api/roadmap/2026/${id}`, { method: "PATCH", body: json(data) }),
  removeRoadmap2026Item: (id: string) => request<{ ok: true }>(`/api/roadmap/2026/${id}`, { method: "DELETE" }),
  githubBranches: (repositoryUrl: string) =>
    request<GithubBranchList>(`/api/github/branches?repositorio=${encodeURIComponent(repositoryUrl)}`),
  fetchRemoteImage: (url: string) => request<{ dataUrl: string }>("/api/images/remote", { method: "POST", body: json({ url }) }),

  createInitiative: (data: unknown) => request<Initiative>("/api/initiatives", { method: "POST", body: json(data) }),
  createUpcomingInitiative: (data: { title: string; summary: string }) =>
    request<Initiative>("/api/initiatives/em-breve", { method: "POST", body: json(data) }),
  updateInitiative: (id: string, data: unknown) =>
    request<Initiative>(`/api/initiatives/${id}`, { method: "PUT", body: json(data) }),
  patchPlanning: (id: string, data: unknown) =>
    request<Initiative>(`/api/initiatives/${id}`, { method: "PATCH", body: json(data) }),
  /** Esforço estimado: editores, tech leads (Engenharia) e coordenação de design (Design). */
  patchEffort: (id: string, effort: InitiativeEffort) =>
    request<Initiative>(`/api/initiatives/${id}/esforco`, { method: "PATCH", body: json(effort) }),
  /** Justificativa do esforço: partes binárias de um arquivo, depois o anexo (arquivo ou link). */
  uploadEffortPart: (uploadId: string, part: number, chunk: Blob) =>
    request<{ ok: true }>(`/api/esforco/partes/${uploadId}/${part}`, {
      method: "PUT",
      body: chunk,
      headers: { "Content-Type": "application/octet-stream" },
    }),
  addEffortAttachment: (id: string, input: unknown) =>
    request<Initiative>(`/api/initiatives/${id}/esforco/anexos`, { method: "POST", body: json(input) }),
  removeEffortAttachment: (id: string, attachmentId: string) =>
    request<Initiative>(`/api/initiatives/${id}/esforco/anexos/${attachmentId}`, { method: "DELETE" }),
  moveInitiative: (id: string, target: RoadmapTarget) =>
    request<Initiative[]>(`/api/initiatives/${id}/move`, { method: "POST", body: json(target) }),
  deleteInitiative: (id: string) => request<{ ok: true }>(`/api/initiatives/${id}`, { method: "DELETE" }),
  analyzePrd: (content: string) =>
    request<PrdImportResult>("/api/initiatives/prd/analyze", { method: "POST", body: json({ content }) }),
  createInitiativeFromPrd: (initiative: unknown, prd: string) =>
    request<Initiative>("/api/initiatives/prd", { method: "POST", body: json({ initiative, prd }) }),
  createDocument: (id: string, kind: "prd" | "decisoes") =>
    request<Initiative>(`/api/initiatives/${id}/documents`, { method: "POST", body: json({ kind }) }),

  createPlatform: (data: unknown) => request<Platform>("/api/platforms", { method: "POST", body: json(data) }),
  updatePlatform: (id: string, data: unknown) =>
    request<Platform>(`/api/platforms/${id}`, { method: "PUT", body: json(data) }),
  deletePlatform: (id: string) => request<{ ok: true }>(`/api/platforms/${id}`, { method: "DELETE" }),

  createPerson: (data: unknown) => request<Person>("/api/people", { method: "POST", body: json(data) }),
  updatePerson: (id: string, data: unknown) => request<Person>(`/api/people/${id}`, { method: "PUT", body: json(data) }),
  deletePerson: (id: string) => request<{ ok: true }>(`/api/people/${id}`, { method: "DELETE" }),
  movePerson: (id: string, move: PersonMove) =>
    request<{ people: Person[]; squads: Squad[] }>(`/api/people/${id}/move`, { method: "POST", body: json(move) }),
  replacePerson: (id: string, data: unknown) =>
    request<Person>(`/api/people/${id}/replace`, { method: "POST", body: json(data) }),

  createSquad: (data: unknown) => request<Squad>("/api/squads", { method: "POST", body: json(data) }),
  updateSquad: (id: string, data: unknown) => request<Squad>(`/api/squads/${id}`, { method: "PUT", body: json(data) }),
  deleteSquad: (id: string) => request<{ ok: true }>(`/api/squads/${id}`, { method: "DELETE" }),

  updateContext: (data: StrategyContext) =>
    request<StrategyContext>("/api/context", { method: "PUT", body: json(data) }),

  readDocument: (path: string) =>
    request<{ path: string; content: string; modifiedAt: string }>(`/api/documents?path=${encodeURIComponent(path)}`),
  saveDocument: (data: {
    path: string;
    content: string;
    initiativeId?: string;
    documentId?: string;
    version?: string;
    note?: string;
  }) =>
    request<{ path: string; modifiedAt: string; initiative: Initiative | null }>("/api/documents", {
      method: "PUT",
      body: json(data),
    }),

  artifactStatus: (paths: string[]) =>
    request<Record<string, boolean>>(
      `/api/artifacts/status?${paths.map((p) => `path=${encodeURIComponent(p)}`).join("&")}`,
    ),
};
