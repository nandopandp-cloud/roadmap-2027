/**
 * Modelo de domínio do Roadmap 2027.
 *
 * Os tipos são derivados dos schemas de validação (lib/validation/schemas.ts),
 * que são a fonte única de verdade para formato e regras dos dados.
 */
import type { z } from "zod";
import type {
  customImageSchema,
  documentDraftSchema,
  documentRefSchema,
  effortAttachmentSchema,
  effortEstimateSchema,
  effortEvidenceSchema,
  initiativeEffortSchema,
  historyEntrySchema,
  initiativeInputSchema,
  initiativeSchema,
  metricSchema,
  milestoneSchema,
  orgZoneSchema,
  personInputSchema,
  personMoveSchema,
  personSchema,
  phaseSchema,
  platformInputSchema,
  platformSchema,
  platformGoalSchema,
  platformIndicatorSchema,
  platformStrategySchema,
  proposalSectionSchema,
  proposalStepSchema,
  commitmentSchema,
  prototypeRefSchema,
  repositoryBranchSchema,
  repositoryLinkSchema,
  roadmap2026ImportItemSchema,
  roadmap2026ImportSchema,
  roadmap2026ItemSchema,
  roadmap2026OwnersSchema,
  roadmap2026SegmentSchema,
  roadmap2026SourceSchema,
  roadmap2026WorkSchema,
  squadInputSchema,
  squadSchema,
  strategyContextSchema,
  structuralProblemSchema,
} from "@/lib/validation/schemas";
import type {
  CONTEXT_ARTS,
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  ILLUSTRATIONS,
  INITIATIVE_STATUSES,
  METRIC_TARGET_STATES,
  METRIC_VALUE_STATES,
  PHASE_STATES,
  DISCIPLINES,
  PLATFORM_ACCENTS,
  PLATFORM_ICONS,
  PRIORITIES,
  PROBLEM_VALIDATION,
  PROTOTYPE_STATUSES,
  QUARTERS,
  ROADMAP_YEARS,
  ROADMAP_2026_PHASES,
  ROADMAP_2026_WAVES,
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
export type ContextArt = (typeof CONTEXT_ARTS)[number];
export type PlatformIcon = (typeof PLATFORM_ICONS)[number];
export type Discipline = (typeof DISCIPLINES)[number];
export type PlatformAccent = (typeof PLATFORM_ACCENTS)[number];
export type IllustrationKey = (typeof ILLUSTRATIONS)[number];
export type PhaseState = (typeof PHASE_STATES)[number];
export type Phase = z.infer<typeof phaseSchema>;

export type CustomImage = z.infer<typeof customImageSchema>;
export type Milestone = z.infer<typeof milestoneSchema>;
export type DocumentRef = z.infer<typeof documentRefSchema>;
/** Documento no formulário: referência e, opcionalmente, o texto a gravar. */
export type DocumentDraft = z.infer<typeof documentDraftSchema>;
export type PrototypeRef = z.infer<typeof prototypeRefSchema>;
export type Metric = z.infer<typeof metricSchema>;
export type HistoryEntry = z.infer<typeof historyEntrySchema>;
export type RepositoryLink = z.infer<typeof repositoryLinkSchema>;
export type EffortEstimate = z.infer<typeof effortEstimateSchema>;
export type InitiativeEffort = z.infer<typeof initiativeEffortSchema>;
export type EffortAttachment = z.infer<typeof effortAttachmentSchema>;
export type EffortEvidence = z.infer<typeof effortEvidenceSchema>;
export type RepositoryBranch = z.infer<typeof repositoryBranchSchema>;
export type Initiative = z.infer<typeof initiativeSchema>;
export type InitiativeInput = z.infer<typeof initiativeInputSchema>;

export type Platform = z.infer<typeof platformSchema>;
export type PlatformInput = z.infer<typeof platformInputSchema>;

export type Person = z.infer<typeof personSchema>;
export type PersonInput = z.infer<typeof personInputSchema>;
export type Squad = z.infer<typeof squadSchema>;
export type SquadInput = z.infer<typeof squadInputSchema>;
export type OrgZone = z.infer<typeof orgZoneSchema>;
export type PersonMove = z.input<typeof personMoveSchema>;

export type ProposalSection = z.infer<typeof proposalSectionSchema>;
export type ProposalStep = z.infer<typeof proposalStepSchema>;
export type Commitment = z.infer<typeof commitmentSchema>;
export type PlatformIndicator = z.infer<typeof platformIndicatorSchema>;
export type PlatformGoal = z.infer<typeof platformGoalSchema>;
export type PlatformStrategy = z.infer<typeof platformStrategySchema>;
export type StructuralProblem = z.infer<typeof structuralProblemSchema>;
export type StrategyContext = z.infer<typeof strategyContextSchema>;

export type RoadmapYear = (typeof ROADMAP_YEARS)[number];
export type Roadmap2026Phase = (typeof ROADMAP_2026_PHASES)[number];
export type Roadmap2026Wave = (typeof ROADMAP_2026_WAVES)[number];
export type Roadmap2026Segment = z.infer<typeof roadmap2026SegmentSchema>;
export type Roadmap2026ImportItem = z.infer<typeof roadmap2026ImportItemSchema>;
export type Roadmap2026Import = z.infer<typeof roadmap2026ImportSchema>;
export type Roadmap2026Source = z.infer<typeof roadmap2026SourceSchema>;
export type Roadmap2026Work = z.infer<typeof roadmap2026WorkSchema>;
export type Roadmap2026Owners = z.infer<typeof roadmap2026OwnersSchema>;
/** Iniciativa do Roadmap 2026 (editável, gravada no banco). */
export type Roadmap2026Item = z.infer<typeof roadmap2026ItemSchema>;
/** Resposta de GET /api/roadmap/2026. */
export interface Roadmap2026 {
  source: Roadmap2026Source;
  items: Roadmap2026Item[];
}

export interface Database {
  schemaVersion: number;
  initiatives: Initiative[];
  platforms: Platform[];
  context: StrategyContext;
  people: Person[];
  squads: Squad[];
  /** Roadmap 2026: iniciativas importadas da planilha do time e editadas no app. */
  roadmap2026: Roadmap2026Item[];
}
