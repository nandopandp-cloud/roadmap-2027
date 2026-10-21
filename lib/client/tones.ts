import type { Discipline, InitiativeStatus, PlatformAccent, Priority, ProblemValidation } from "@/lib/domain/types";

/** Tons discretos (fundo suave, texto com contraste AA, ponto de cor). */
export interface Tone {
  bg: string;
  fg: string;
  dot: string;
}

export const STATUS_TONE: Record<InitiativeStatus, Tone> = {
  ideia: { bg: "#F1F3F8", fg: "#4B5577", dot: "#8792B0" },
  discovery: { bg: "#EAF1FE", fg: "#1F55C4", dot: "#2868E8" },
  definicao: { bg: "#E3F6F3", fg: "#00665E", dot: "#00A99D" },
  planejada: { bg: "#F1ECFB", fg: "#4A2D91", dot: "#6045D8" },
  andamento: { bg: "#FFF2E5", fg: "#934400", dot: "#F28A1F" },
  validacao: { bg: "#FFF8DB", fg: "#735600", dot: "#E0A800" },
  concluida: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "#22A05A" },
  pausada: { bg: "#F3F1EE", fg: "#665947", dot: "#A8987F" },
  cancelada: { bg: "#FDECEC", fg: "#A1262B", dot: "#E25858" },
};

export const PRIORITY_TONE: Record<Priority, Tone> = {
  alta: { bg: "#FDEDEF", fg: "#A1262B", dot: "#E25858" },
  media: { bg: "#FFF4E3", fg: "#8A4B00", dot: "#F2A23A" },
  baixa: { bg: "#EEF2F8", fg: "#4B5577", dot: "#8792B0" },
};

export const VALIDATION_TONE: Record<ProblemValidation, Tone> = {
  confirmado: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "#22A05A" },
  em_validacao: { bg: "#EAF1FE", fg: "#1F55C4", dot: "#2868E8" },
  hipotese: { bg: "#FFF8DB", fg: "#735600", dot: "#E0A800" },
};

export interface AccentTone {
  soft: string;
  fg: string;
  solid: string;
}

export const ACCENT_TONE: Record<PlatformAccent, AccentTone> = {
  blue: { soft: "#EAF1FE", fg: "#1F55C4", solid: "#2868E8" },
  purple: { soft: "#F1ECFB", fg: "#5938A6", solid: "#7B4FE3" },
  teal: { soft: "#E3F6F3", fg: "#00665E", solid: "#00A99D" },
  orange: { soft: "#FFF1E6", fg: "#934400", solid: "#F28A1F" },
  pink: { soft: "#FDEBF3", fg: "#A3245F", solid: "#E0508F" },
  indigo: { soft: "#ECEEFD", fg: "#3B3FB0", solid: "#5B5FE0" },
};

export const TRANSVERSAL_TONE: Tone = { bg: "#E3F6F3", fg: "#00665E", dot: "#00A99D" };
export const QUARTER_TONE: Tone = { bg: "#EFEBFC", fg: "#4A2D91", dot: "#6045D8" };

/** Funções no squad: tons suaves distintos entre si. */
export const DISCIPLINE_TONE: Record<Discipline, Tone> = {
  produto: { bg: "#EFEBFC", fg: "#4A2D91", dot: "#6045D8" },
  design: { bg: "#FCE9F3", fg: "#9B1F5F", dot: "#D63B8A" },
  engenharia: { bg: "#E6EEFD", fg: "#1D4FB8", dot: "#2868E8" },
  qa: { bg: "#E3F6F3", fg: "#00665E", dot: "#00A99D" },
};
