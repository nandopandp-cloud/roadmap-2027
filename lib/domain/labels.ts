import type {
  DocumentKind,
  DocumentStatus,
  IllustrationKey,
  InitiativeStatus,
  MetricTargetState,
  MetricValueState,
  Priority,
  ProblemValidation,
  PrototypeStatus,
  Quarter,
} from "@/lib/domain/types";

export const STATUS_LABEL: Record<InitiativeStatus, string> = {
  ideia: "Ideia",
  discovery: "Em discovery",
  definicao: "Em definição",
  planejada: "Planejada",
  andamento: "Em andamento",
  validacao: "Em validação",
  concluida: "Concluída",
  pausada: "Pausada",
  cancelada: "Cancelada",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

/** Ordem usada na ordenação por prioridade (sem prioridade vai ao final). */
export const PRIORITY_RANK: Record<Priority, number> = { alta: 0, media: 1, baixa: 2 };

export const QUARTER_LABEL: Record<Quarter, string> = {
  Q1: "Q1 2027",
  Q2: "Q2 2027",
  Q3: "Q3 2027",
  Q4: "Q4 2027",
};

export const QUARTER_MONTHS: Record<Quarter, string> = {
  Q1: "Janeiro a março",
  Q2: "Abril a junho",
  Q3: "Julho a setembro",
  Q4: "Outubro a dezembro",
};

export const DOCUMENT_KIND_LABEL: Record<DocumentKind, string> = {
  prd: "PRD",
  decisoes: "Decisões",
  contexto: "Contexto da iniciativa",
  outro: "Outro documento",
};

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  rascunho: "Rascunho",
  em_revisao: "Em revisão",
  aprovado: "Aprovado",
  obsoleto: "Obsoleto",
};

export const PROTOTYPE_STATUS_LABEL: Record<PrototypeStatus, string> = {
  conceito: "Conceito",
  em_construcao: "Em construção",
  em_validacao: "Em validação",
  validado: "Validado",
  obsoleto: "Obsoleto",
};

export const METRIC_VALUE_STATE_LABEL: Record<MetricValueState, string> = {
  definido: "Definido",
  estimado: "Estimado",
  pendente: "Pendente",
};

export const METRIC_TARGET_STATE_LABEL: Record<MetricTargetState, string> = {
  aprovada: "Aprovada",
  proposta: "Proposta",
  pendente: "Pendente",
};

export const PROBLEM_VALIDATION_LABEL: Record<ProblemValidation, string> = {
  confirmado: "Confirmado",
  em_validacao: "Em validação",
  hipotese: "Hipótese",
};

export const ILLUSTRATION_LABEL: Record<IllustrationKey, string> = {
  astronauta: "Astronauta",
  planeta: "Planeta",
  foguete: "Foguete",
  satelite: "Satélite",
  cometa: "Cometa",
  lua: "Lua",
};
