"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import type { Roadmap2026 } from "@/lib/domain/types";

export type Roadmap2026Load =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: Roadmap2026 }
  | { status: "error"; message: string };

// A projeção não muda durante a sessão: carrega uma vez e reaproveita ao trocar de ano.
let cache: Roadmap2026 | null = null;

/** Carrega o Roadmap 2026 só quando o ano é selecionado. */
export function useRoadmap2026(enabled: boolean) {
  const [load, setLoad] = useState<Roadmap2026Load>(cache ? { status: "ready", data: cache } : { status: "idle" });

  const fetchData = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      cache = await api.roadmap2026();
      setLoad({ status: "ready", data: cache });
    } catch (error) {
      setLoad({ status: "error", message: error instanceof ApiError ? error.message : "Não foi possível carregar o Roadmap 2026." });
    }
  }, []);

  useEffect(() => {
    // Carregamento sob demanda: dispara a busca quando o ano é aberto pela primeira vez.
    if (enabled && load.status === "idle") void fetchData();
  }, [enabled, load.status, fetchData]);

  return { load, retry: fetchData };
}
