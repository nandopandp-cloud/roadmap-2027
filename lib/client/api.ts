import type { Initiative, Platform, StrategyContext } from "@/lib/domain/types";

export interface Snapshot {
  initiatives: Initiative[];
  platforms: Platform[];
  context: StrategyContext;
  /** false quando a implantação não consegue gravar alterações (ex.: Vercel). */
  writable: boolean;
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
  if (!response.ok) {
    throw new ApiError(body?.error ?? "Erro inesperado.", response.status, body?.fields ?? {});
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  snapshot: () => request<Snapshot>("/api/snapshot"),

  createInitiative: (data: unknown) => request<Initiative>("/api/initiatives", { method: "POST", body: json(data) }),
  updateInitiative: (id: string, data: unknown) =>
    request<Initiative>(`/api/initiatives/${id}`, { method: "PUT", body: json(data) }),
  patchPlanning: (id: string, data: unknown) =>
    request<Initiative>(`/api/initiatives/${id}`, { method: "PATCH", body: json(data) }),
  deleteInitiative: (id: string) => request<{ ok: true }>(`/api/initiatives/${id}`, { method: "DELETE" }),
  createDocument: (id: string, kind: "prd" | "decisoes") =>
    request<Initiative>(`/api/initiatives/${id}/documents`, { method: "POST", body: json({ kind }) }),

  createPlatform: (data: unknown) => request<Platform>("/api/platforms", { method: "POST", body: json(data) }),
  updatePlatform: (id: string, data: unknown) =>
    request<Platform>(`/api/platforms/${id}`, { method: "PUT", body: json(data) }),
  deletePlatform: (id: string) => request<{ ok: true }>(`/api/platforms/${id}`, { method: "DELETE" }),

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
