"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, ApiError, type Snapshot } from "@/lib/client/api";
import { applyMove } from "@/lib/domain/org";
import { placeInColumn, type RoadmapTarget } from "@/lib/domain/roadmap-order";
import type { Initiative, Person, PersonMove, Platform, Squad, StrategyContext } from "@/lib/domain/types";

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
  patchPlanning: (id: string, patch: Partial<Pick<Initiative, "quarter" | "priority" | "status" | "planningValidated" | "phases">>) => Promise<Initiative>;
  /** Move um card no roadmap (quarter e posição), com atualização imediata da tela. */
  moveInitiative: (id: string, target: RoadmapTarget) => Promise<void>;
  savePlatform: (id: string | null, data: unknown) => Promise<Platform>;
  removePlatform: (id: string) => Promise<void>;
  saveContext: (context: StrategyContext) => Promise<StrategyContext>;
  savePerson: (id: string | null, data: unknown) => Promise<Person>;
  /** Exclusão e substituição alteram outros registros (lideranças, squads): recarregam o estado. */
  removePerson: (id: string) => Promise<void>;
  replacePerson: (id: string, data: unknown) => Promise<Person>;
  /** Realoca um colaborador (squads, lideranças e posição), com atualização imediata da tela. */
  movePerson: (id: string, move: PersonMove) => Promise<void>;
  saveSquad: (id: string | null, data: unknown) => Promise<Squad>;
  removeSquad: (id: string) => Promise<void>;
  form: FormRequest | null;
  openForm: (initiativeId: string | null, step?: number) => void;
  closeForm: () => void;
}

const EMPTY: Snapshot = {
  initiatives: [],
  platforms: [],
  context: { intro: "", drivers: [], principles: [], problems: [] },
  people: [],
  squads: [],
  writable: true,
  storage: "arquivo",
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

  const moveInitiative = useCallback<RoadmapStore["moveInitiative"]>(async (id, target) => {
    // Valores anteriores das iniciativas afetadas, para desfazer se o servidor recusar.
    const previous = new Map<string, Initiative>();
    setData((prev) => {
      const placement = placeInColumn(prev.initiatives, id, target);
      if (!placement) return prev;
      return {
        ...prev,
        initiatives: prev.initiatives.map((i) => {
          const order = placement.orders.get(i.id);
          if (order === undefined) return i;
          previous.set(i.id, i);
          return { ...i, quarter: i.id === id ? target.quarter : i.quarter, roadmapOrder: order };
        }),
      };
    });
    try {
      const changed = await api.moveInitiative(id, target);
      setData((prev) => ({
        ...prev,
        initiatives: prev.initiatives.map((i) => changed.find((c) => c.id === i.id) ?? i),
      }));
    } catch (error) {
      setData((prev) => ({ ...prev, initiatives: prev.initiatives.map((i) => previous.get(i.id) ?? i) }));
      throw error;
    }
  }, []);

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

  const savePerson = useCallback(async (id: string | null, payload: unknown) => {
    const person = id ? await api.updatePerson(id, payload) : await api.createPerson(payload);
    setData((prev) => ({
      ...prev,
      people: id ? prev.people.map((p) => (p.id === id ? person : p)) : [...prev.people, person],
    }));
    return person;
  }, []);

  const removePerson = useCallback(
    async (id: string) => {
      await api.deletePerson(id);
      await reload();
    },
    [reload],
  );

  const replacePerson = useCallback(
    async (id: string, payload: unknown) => {
      const substitute = await api.replacePerson(id, payload);
      await reload();
      return substitute;
    },
    [reload],
  );

  const movePerson = useCallback<RoadmapStore["movePerson"]>(async (id, move) => {
    const previous: { org?: Pick<Snapshot, "people" | "squads"> } = {};
    setData((prev) => {
      const next = applyMove(prev, id, move);
      if (!next) return prev;
      previous.org = { people: prev.people, squads: prev.squads };
      return { ...prev, ...next };
    });
    try {
      const saved = await api.movePerson(id, move);
      setData((prev) => ({ ...prev, ...saved }));
    } catch (error) {
      const restore = previous.org;
      if (restore) setData((prev) => ({ ...prev, ...restore }));
      throw error;
    }
  }, []);

  const saveSquad = useCallback(async (id: string | null, payload: unknown) => {
    const squad = id ? await api.updateSquad(id, payload) : await api.createSquad(payload);
    setData((prev) => ({
      ...prev,
      squads: id ? prev.squads.map((s) => (s.id === id ? squad : s)) : [...prev.squads, squad],
    }));
    return squad;
  }, []);

  const removeSquad = useCallback(
    async (id: string) => {
      await api.deleteSquad(id);
      await reload();
    },
    [reload],
  );

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
      moveInitiative,
      savePlatform,
      removePlatform,
      saveContext,
      savePerson,
      removePerson,
      replacePerson,
      movePerson,
      saveSquad,
      removeSquad,
      form,
      openForm: (initiativeId, step) => setForm({ initiativeId, step }),
      closeForm: () => setForm(null),
    }),
    [load, data, reload, upsertInitiative, removeInitiative, patchPlanning, moveInitiative, savePlatform, removePlatform, saveContext, savePerson, removePerson, replacePerson, movePerson, saveSquad, removeSquad, form],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useRoadmap(): RoadmapStore {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useRoadmap deve ser usado dentro de <RoadmapProvider>.");
  return ctx;
}
