/**
 * Modelo de domínio do Roadmap 2027.
 *
 * Os tipos são derivados dos schemas de validação (lib/validation/schemas.ts),
 * que são a fonte única de verdade para formato e regras dos dados.
 */
import type { z } from "zod";
import type {
  driverSchema,
  documentRefSchema,
  historyEntrySchema,
  initiativeInputSchema,
  initiativeSchema,
  metricSchema,
  milestoneSchema,
  phaseSchema,
  platformInputSchema,
  platformSchema,
  principleSchema,
  prototypeRefSchema,
  strategyContextSchema,
  structuralProblemSchema,
} from "@/lib/validation/schemas";
import type {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  ILLUSTRATIONS,
  INITIATIVE_STATUSES,
  METRIC_TARGET_STATES,
  METRIC_VALUE_STATES,
  PHASE_STATES,
  PLATFORM_ACCENTS,
  PLATFORM_ICONS,
  PRIORITIES,
  PROBLEM_VALIDATION,
  PROTOTYPE_STATUSES,
  QUARTERS,
  SOURCE_KINDS,
} from "@/lib/domain/constants";

export type Quarter = (typeof QUARTERS)[number];
export type InitiativeStatus = (typeof INITIATIVE_STATUSES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type DocumentKind = (typeof DOCUMENT_KINDS)[number];
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
export type PrototypeStatus = (typeof PROTOTYPE_STATUSES)[number];
export type SourceKind = (typeof SOURCE_KINDS)[number];
export type MetricValueState = (typeof METRIC_VALUE_STATES)[number];
export type MetricTargetState = (typeof METRIC_TARGET_STATES)[number];
export type ProblemValidation = (typeof PROBLEM_VALIDATION)[number];
export type PlatformIcon = (typeof PLATFORM_ICONS)[number];
export type PlatformAccent = (typeof PLATFORM_ACCENTS)[number];
export type IllustrationKey = (typeof ILLUSTRATIONS)[number];
export type PhaseState = (typeof PHASE_STATES)[number];
export type Phase = z.infer<typeof phaseSchema>;

export type Milestone = z.infer<typeof milestoneSchema>;
export type DocumentRef = z.infer<typeof documentRefSchema>;
export type PrototypeRef = z.infer<typeof prototypeRefSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type Initiative = z.infer<typeof initiativeSchema>;
export type InitiativeInput = z.infer<typeof initiativeInputSchema>;

export type Platform = z.infer<typeof platformSchema>;
export type PlatformInput = z.infer<typeof platformInputSchema>;

export type Driver = z.infer<typeof driverSchema>;
export type Principle = z.infer<typeof principleSchema>;
export type StructuralProblem = z.infer<typeof structuralProblemSchema>;
export type StrategyContext = z.infer<typeof strategyContextSchema>;

export interface Database {
  schemaVersion: number;
  initiatives: Initiative[];
  platforms: Platform[];
  context: StrategyContext;
}
