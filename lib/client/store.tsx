"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, type Snapshot } from "@/lib/client/api";
import type { Initiative, Platform, StrategyContext } from "@/lib/domain/types";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

interface FormRequest {
  /** null = nova iniciativa */
  initiativeId: string | null;
  step?: number;
}

interface RoadmapStore {
  load: LoadState;
  data: Snapshot;
  reload: () => Promise<void>;
  initiativeById: (id: string) => Initiative | undefined;
  platformById: (id: string) => Platform | undefined;
  upsertInitiative: (initiative: Initiative) => void;
  removeInitiative: (id: string) => Promise<void>;
  patchPlanning: (id: string, patch: Partial<Pick<Initiative, "quarter" | "priority" | "status" | "planningValidated">>) => Promise<Initiative>;
  savePlatform: (id: string | null, data: unknown) => Promise<Platform>;
  removePlatform: (id: string) => Promise<void>;
  saveContext: (context: StrategyContext) => Promise<StrategyContext>;
  form: FormRequest | null;
  openForm: (initiativeId: string | null, step?: number) => void;
  closeForm: () => void;
}

const EMPTY: Snapshot = {
  initiatives: [],
  platforms: [],
  context: { intro: "", drivers: [], principles: [], problems: [] },
};

const StoreContext = createContext<RoadmapStore | null>(null);

/**
 * Estado compartilhado da aplicação. Carrega o snapshot uma vez e aplica as
 * respostas do servidor após cada alteração (o servidor é a fonte da verdade).
 */
export function RoadmapProvider({ children }: { children: ReactNode }) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [data, setData] = useState<Snapshot>(EMPTY);
  const [form, setForm] = useState<FormRequest | null>(null);

  const reload = useCallback(async () => {
    setLoad((prev) => (prev.status === "ready" ? prev : { status: "loading" }));
    try {
      setData(await api.snapshot());
      setLoad({ status: "ready" });
    } catch (error) {
      setLoad({ status: "error", message: error instanceof ApiError ? error.message : "Não foi possível carregar os dados." });
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const upsertInitiative = useCallback((initiative: Initiative) => {
    setData((prev) => {
      const exists = prev.initiatives.some((i) => i.id === initiative.id);
      return {
        ...prev,
        initiatives: exists
          ? prev.initiatives.map((i) => (i.id === initiative.id ? initiative : i))
          : [...prev.initiatives, initiative],
      };
    });
  }, []);

  const removeInitiative = useCallback(
    async (id: string) => {
      await api.deleteInitiative(id);
      // Exclusão afeta referências em outras iniciativas e problemas: recarrega o estado consistente.
      await reload();
    },
    [reload],
  );

  const patchPlanning = useCallback<RoadmapStore["patchPlanning"]>(
    async (id, patch) => {
      const updated = await api.patchPlanning(id, patch);
      upsertInitiative(updated);
      return updated;
    },
    [upsertInitiative],
  );

  const savePlatform = useCallback(async (id: string | null, payload: unknown) => {
    const platform = id ? await api.updatePlatform(id, payload) : await api.createPlatform(payload);
    setData((prev) => ({
      ...prev,
      platforms: id ? prev.platforms.map((p) => (p.id === id ? platform : p)) : [...prev.platforms, platform],
    }));
    return platform;
  }, []);

  const removePlatform = useCallback(async (id: string) => {
    await api.deletePlatform(id);
    setData((prev) => ({ ...prev, platforms: prev.platforms.filter((p) => p.id !== id) }));
  }, []);

  const saveContext = useCallback(async (context: StrategyContext) => {
    const saved = await api.updateContext(context);
    setData((prev) => ({ ...prev, context: saved }));
    return saved;
  }, []);

  const value = useMemo<RoadmapStore>(
    () => ({
      load,
      data,
      reload,
      initiativeById: (id) => data.initiatives.find((i) => i.id === id),
      platformById: (id) => data.platforms.find((p) => p.id === id),
      upsertInitiative,
      removeInitiative,
      patchPlanning,
      savePlatform,
      removePlatform,
      saveContext,
      form,
      openForm: (initiativeId, step) => setForm({ initiativeId, step }),
      closeForm: () => setForm(null),
    }),
    [load, data, reload, upsertInitiative, removeInitiative, patchPlanning, savePlatform, removePlatform, saveContext, form],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRoadmap(): RoadmapStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useRoadmap deve ser usado dentro de <RoadmapProvider>.");
  return ctx;
}
