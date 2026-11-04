import type { StrategyContext } from "@/lib/domain/types";

/** Contexto estratégico sem conteúdo (banco novo ou registro ausente). */
export const emptyContext = (): StrategyContext => ({
  introTitle: "",
  introSummary: "",
  intro: "",
  proposal: [],
  commitment: { title: "", summary: "", body: "" },
  platformsSummary: "",
  platformsIntro: "",
  platformStrategies: [],
  measurement: "",
  problems: [],
});
