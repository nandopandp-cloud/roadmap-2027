import type {
  DocumentKind,
  DocumentStatus,
  IllustrationKey,
  InitiativeStatus,
  MetricTargetState,
  MetricValueState,
  PhaseState,
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
  "login-qr": "Astronauta com QR Code",
  astronauta: "Astronauta",
  ilha: "Ilha flutuante",
  foguete: "Foguete",
  satelite: "Satélite",
  planeta: "Planeta",
  tecnologia: "Planeta da Tecnologia",
};

/**
 * Biblioteca de ilustrações (public/illustrations).
 * - `src`: arquivo principal. Arte enviada pelo time (PNG com fundo branco) ou recorte da arte oficial.
 * - `fallback`: usado enquanto o arquivo principal não existir.
 * - `focus`: ponto focal (object-position) quando a arte é recortada no card.
 * - `header`: arte opcional específica para o cabeçalho do drawer.
 * - `fit`: "contain" para artes com fundo claro (exibidas sobre fundo lilás), "cover" para artes com fundo escuro.
 */
export const ILLUSTRATION_ASSET: Record<
  IllustrationKey,
  { src: string; fallback?: string; fit: "cover" | "contain"; header?: string; focus?: string }
> = {
  "login-qr": {
    src: "/illustrations/login-astronauta-qr.jpg",
    fallback: "/illustrations/astronauta.svg",
    fit: "cover",
    focus: "52% 62%",
    header: "/illustrations/login-astronauta-celular.jpg",
  },
  astronauta: { src: "/illustrations/astronauta-acenando.jpg", fallback: "/illustrations/astronauta.svg", fit: "contain" },
  ilha: { src: "/illustrations/ilha.jpg", fit: "cover" },
  foguete: { src: "/illustrations/foguete.jpg", fit: "cover" },
  satelite: { src: "/illustrations/satelite.jpg", fit: "cover" },
  planeta: { src: "/illustrations/planeta.jpg", fit: "cover" },
  tecnologia: { src: "/illustrations/tecnologia.jpg", fit: "cover" },
};

/** Fundo da sidebar (arte vertical enviada pelo time). Sem ele, a sidebar usa o gradiente + cena em SVG. */
export const SIDEBAR_ART = "/illustrations/sidebar-espaco.jpg";

/** Banner do topo das páginas: arte enviada pelo time, com cenário em SVG como fallback. */
export const HERO_BANNER = { src: "/illustrations/hero-banner.jpg", fallback: "/illustrations/hero-ceu.svg" };

export const PHASE_STATE_LABEL: Record<PhaseState, string> = {
  pendente: "Pendente",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};
