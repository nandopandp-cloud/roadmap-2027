import { DEFAULT_PHASES } from "@/lib/domain/constants";
import type { Phase } from "@/lib/domain/types";

/** Percentual de progresso = etapas concluídas ÷ total de etapas. Sem etapas, não há progresso. */
export function progressOf(phases: Phase[]): number | null {
  if (!phases.length) return null;
  const done = phases.filter((p) => p.state === "concluida").length;
  return Math.round((done / phases.length) * 100);
}

export function defaultPhases(): Phase[] {
  return DEFAULT_PHASES.map((title, idx) => ({ id: `fase-${idx + 1}`, title, state: "pendente" }));
}
