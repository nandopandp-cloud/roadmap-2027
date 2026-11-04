import type { StrategyContext } from "@/lib/domain/types";

/** Contexto estratégico sem conteúdo (banco novo ou registro ausente). */
export const emptyContext = (): StrategyContext => ({
  intro: "",
  proposal: [],
  platformsIntro: "",
  platformStrategies: [],
  measurement: "",
  problems: [],
});
