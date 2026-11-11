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

/** Ilustrações da tela Contexto (seções da proposta e plataformas). */
export const CONTEXT_ARTS = ["alvo", "notebook", "calendario", "documento", "astronauta", "nexo", "educadora"] as const;

export const PLATFORM_ICONS = ["settings", "explorer", "teacher", "family", "book", "literacy", "sparkles", "layers"] as const;

export const ILLUSTRATIONS = ["nexo", "login-qr", "astronauta", "ilha", "foguete", "satelite", "planeta", "tecnologia"] as const;

/** Estado de cada etapa de progresso. O percentual é derivado das etapas concluídas. */
export const PHASE_STATES = ["pendente", "em_andamento", "concluida"] as const;

/** Etapas sugeridas para novas iniciativas (editáveis). */
export const DEFAULT_PHASES = ["Discovery e levantamento", "Design e protótipo", "Desenvolvimento", "Homologação", "Lançamento"] as const;

/** Diretório (relativo à raiz do projeto) onde ficam os artefatos versionáveis das iniciativas. */
export const INITIATIVES_DIR = "initiatives";

/** Função do colaborador no squad (resumo de composição dos squads). */
export const DISCIPLINES = ["produto", "design", "engenharia", "qa"] as const;

/** Frentes de esforço estimadas no roadmap (cada uma pelo seu responsável). */
export const EFFORT_TRACKS = ["design", "engineering"] as const;
/** Início da frente: automático (design no início do quarter, engenharia após o design), em paralelo ao design ou em data informada. */
export const EFFORT_START_MODES = ["auto", "parallel", "date"] as const;

export const PLATFORM_ACCENTS = ["blue", "purple", "teal", "orange", "pink", "indigo", "green", "red", "yellow", "cyan", "brown", "slate"] as const;

/** Anos do roadmap disponíveis na tela Roadmap (2026: projeção importada da planilha do time). */
export const ROADMAP_YEARS = [2026, 2027] as const;

/**
 * Fases das semanas do Roadmap 2026, como a legenda de cores da planilha:
 * Design, Projetado & Engenharia, Em progresso, Concluído, Revisão de prazo e
 * células cinza (sem legenda na planilha).
 */
export const ROADMAP_2026_PHASES = ["design", "engenharia", "andamento", "concluido", "revisao", "indefinido"] as const;
/** Semanas da projeção 2026: julho/2026 a abril/2027, quatro por mês (S1 a S4). */
export const ROADMAP_2026_WEEK_COUNT = 40;
/** Ondas de priorização da planilha do Roadmap 2026. */
export const ROADMAP_2026_WAVES = ["primeira", "segunda", "terceira"] as const;
/** Status editável de cada item do Roadmap 2026. */
export const ROADMAP_2026_STATUSES = ["planejada", "andamento", "qa", "atrasada", "concluida"] as const;
/** Andamento de cada frente (Design e Engenharia) de uma iniciativa do Roadmap 2026. */
export const ROADMAP_2026_TRACK_STATUSES = ["nao_iniciado", "andamento", "concluido"] as const;
/** Frentes que podem ser retiradas de uma iniciativa do Roadmap 2026 (Engenharia é obrigatória). */
export const ROADMAP_2026_OPTIONAL_TRACKS = ["design", "qa"] as const;
/** Tipo de trabalho de cada sequência de semanas do Roadmap 2026 (editável). */
export const ROADMAP_2026_WORK = ["design", "engenharia", "qa", "indefinido"] as const;
