"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/client/api";
import { useRoadmap } from "@/lib/client/store";
import { canPlanRoadmap2026For } from "@/lib/domain/effort-access";
import type { Roadmap2026, Roadmap2026Item } from "@/lib/domain/types";

export type Roadmap2026Load =
  | { status: "idle" | "loading" }
  | { status: "ready"; data: Roadmap2026 }
  | { status: "error"; message: string };

// Reaproveitado ao trocar de ano (e atualizado a cada alteração salva).
let cache: Roadmap2026 | null = null;

const message = (error: unknown, fallback: string) => (error instanceof ApiError ? error.message : fallback);

/** Carrega o Roadmap 2026 quando o ano é aberto e aplica as alterações (otimistas, com desfazer em caso de erro). */
export function useRoadmap2026(enabled: boolean) {
  const [load, setLoad] = useState<Roadmap2026Load>(cache ? { status: "ready", data: cache } : { status: "idle" });

  const fetchData = useCallback(async () => {
    setLoad({ status: "loading" });
    try {
      cache = await api.roadmap2026();
      setLoad({ status: "ready", data: cache });
    } catch (error) {
      setLoad({ status: "error", message: message(error, "Não foi possível carregar o Roadmap 2026.") });
    }
  }, []);

  useEffect(() => {
    // Carregamento sob demanda: dispara a busca quando o ano é aberto pela primeira vez.
    if (enabled && load.status === "idle") void fetchData();
  }, [enabled, load.status, fetchData]);

  const apply = useCallback((mutate: (items: Roadmap2026Item[]) => Roadmap2026Item[]) => {
    if (!cache) return;
    cache = { ...cache, items: mutate(cache.items) };
    setLoad({ status: "ready", data: cache });
  }, []);

  /** Salva as mudanças (só os campos enviados) e devolve a versão gravada, com o histórico. */
  const update = useCallback(
    async (id: string, patch: Partial<Roadmap2026Item>) => {
      const previous = cache?.items.find((i) => i.id === id);
      if (!previous) return;
      apply((items) => items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      try {
        const saved = await api.patchRoadmap2026Item(id, patch);
        apply((items) => items.map((i) => (i.id === id ? saved : i)));
        return saved;
      } catch (error) {
        apply((items) => items.map((i) => (i.id === id ? previous : i)));
        throw new ApiError(message(error, "Não foi possível salvar a alteração."), error instanceof ApiError ? error.status : 0, error instanceof ApiError ? error.fields : {});
      }
    },
    [apply],
  );

  const remove = useCallback(
    async (id: string) => {
      const index = cache?.items.findIndex((i) => i.id === id) ?? -1;
      const previous = index >= 0 ? cache!.items[index] : undefined;
      if (!previous) return;
      apply((items) => items.filter((i) => i.id !== id));
      try {
        await api.removeRoadmap2026Item(id);
      } catch (error) {
        apply((items) => [...items.slice(0, index), previous, ...items.slice(index)]);
        throw new ApiError(message(error, "Não foi possível remover a iniciativa."), error instanceof ApiError ? error.status : 0);
      }
    },
    [apply],
  );

  /** Nova posição no Gantt (otimista); o histórico do item é atualizado na próxima carga. */
  const move = useCallback(
    async (id: string, beforeId: string | null, afterId: string | null) => {
      const previous = cache?.items;
      const item = previous?.find((i) => i.id === id);
      if (!previous || !item) return;
      apply((items) => {
        const rest = items.filter((i) => i.id !== id);
        const neighbor = rest.findIndex((i) => i.id === (beforeId ?? afterId));
        if (neighbor < 0) return items;
        rest.splice(neighbor + (beforeId ? 0 : 1), 0, item);
        return rest;
      });
      try {
        await api.moveRoadmap2026Item(id, { beforeId, afterId });
      } catch (error) {
        apply(() => previous);
        throw new ApiError(message(error, "Não foi possível mudar a ordem."), error instanceof ApiError ? error.status : 0);
      }
    },
    [apply],
  );

  return { load, retry: fetchData, update, remove, move };
}

/**
 * Quem planeja o Roadmap 2026: Head de Produto, Head de Engenharia, tech leads e coordenação
 * de design (cargo em Times & Squads, pelo e-mail do login). Sem gravação disponível, ninguém.
 */
export function useCanPlan2026(): boolean {
  const { data } = useRoadmap();
  if (!data.viewer || data.readOnlyReason === "armazenamento") return false;
  return canPlanRoadmap2026For(data.viewer, data.people);
}
