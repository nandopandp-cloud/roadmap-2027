/**
 * Vocabulário controlado do domínio. Os valores são estáveis (persistidos);
 * os rótulos em pt-BR ficam em lib/domain/labels.ts.
 */

export const ROADMAP_YEAR = 2027;

export const QUARTERS = ["Q1", "Q2", "Q3", "Q4"] as const;

export const INITIATIVE_STATUSES = [
  "ideia",
  "discovery",
  "definicao",
  "planejada",
  "andamento",
  "validacao",
  "concluida",
  "pausada",
  "cancelada",
] as const;

export const PRIORITIES = ["alta", "media", "baixa"] as const;

export const DOCUMENT_KINDS = ["prd", "decisoes", "contexto", "outro"] as const;
export const DOCUMENT_STATUSES = ["rascunho", "em_revisao", "aprovado", "obsoleto"] as const;

export const PROTOTYPE_STATUSES = ["conceito", "em_construcao", "em_validacao", "validado", "obsoleto"] as const;

/** Origem de um artefato: arquivo versionado no repositório ou link externo. */
export const SOURCE_KINDS = ["repo", "externo"] as const;

/** Grau de definição de um valor de métrica (baseline / resultado). */
export const METRIC_VALUE_STATES = ["definido", "estimado", "pendente"] as const;
/** Estado da meta: só é "aprovada" quando validada formalmente. */
export const METRIC_TARGET_STATES = ["aprovada", "proposta", "pendente"] as const;

export const PROBLEM_VALIDATION = ["confirmado", "em_validacao", "hipotese"] as const;

export const PLATFORM_ICONS = ["settings", "explorer", "teacher", "family", "book", "sparkles", "layers"] as const;

export const ILLUSTRATIONS = ["nexo", "login-qr", "astronauta", "ilha", "foguete", "satelite", "planeta", "tecnologia"] as const;

/** Estado de cada etapa de progresso. O percentual é derivado das etapas concluídas. */
export const PHASE_STATES = ["pendente", "em_andamento", "concluida"] as const;

/** Etapas sugeridas para novas iniciativas (editáveis). */
export const DEFAULT_PHASES = ["Discovery e levantamento", "Design e protótipo", "Desenvolvimento", "Homologação", "Lançamento"] as const;

/** Diretório (relativo à raiz do projeto) onde ficam os artefatos versionáveis das iniciativas. */
export const INITIATIVES_DIR = "initiatives";

export const PLATFORM_ACCENTS = ["blue", "purple", "teal", "orange", "pink", "indigo"] as const;
