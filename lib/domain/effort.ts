import { EFFORT_TRACKS, QUARTERS, ROADMAP_YEAR } from "@/lib/domain/constants";
import type { EffortEstimate, InitiativeEffort, Quarter } from "@/lib/domain/types";

export { EFFORT_TRACKS };
export type EffortTrack = (typeof EFFORT_TRACKS)[number];

export const EFFORT_TRACK_LABEL: Record<EffortTrack, string> = { design: "Design", engineering: "Engenharia" };
/** Função no organograma de quem responde por cada frente. */
export const EFFORT_TRACK_DISCIPLINE = { design: "design", engineering: "engenharia" } as const;

export const EMPTY_EFFORT: InitiativeEffort = { design: null, engineering: null };

const DAY = 86_400_000;
const toUtc = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
};
const toIso = (time: number) => new Date(time).toISOString().slice(0, 10);

export const quarterStartDate = (q: Quarter) => toIso(Date.UTC(ROADMAP_YEAR, QUARTERS.indexOf(q) * 3, 1));
/** Primeiro dia após o quarter (exclusivo). */
export const quarterEndDate = (q: Quarter) => toIso(Date.UTC(ROADMAP_YEAR, QUARTERS.indexOf(q) * 3 + 3, 1));

export interface PlacedEffort {
  track: EffortTrack;
  estimate: EffortEstimate;
  /** Início (inclusivo) e fim (exclusivo), AAAA-MM-DD. */
  start: string;
  end: string;
}

export interface EffortPlan {
  tracks: PlacedEffort[];
  /** Início da primeira frente e fim (exclusivo) da última. */
  start: string | null;
  end: string | null;
  /** Do início da primeira frente ao fim da última (frentes em paralelo não somam). */
  spanWeeks: number;
  /** Semanas além do fim do quarter planejado (0 = cabe no quarter ou não há quarter). */
  overflowWeeks: number;
}

/**
 * Posiciona as frentes no calendário. Automático: design no início do quarter e engenharia
 * logo após o design (ou no início do quarter, sem design). Frentes com data própria ficam
 * na data; sem quarter nem data, a frente não é posicionada.
 */
export function planEffort(effort: InitiativeEffort, quarter: Quarter | null): EffortPlan {
  const anchor = quarter ? quarterStartDate(quarter) : null;
  const tracks: PlacedEffort[] = [];
  let designEnd: string | null = null;
  for (const track of EFFORT_TRACKS) {
    const estimate = effort[track];
    if (!estimate) continue;
    const start =
      estimate.startMode === "date" && estimate.startDate
        ? estimate.startDate
        : track === "engineering" && estimate.startMode === "auto"
          ? (designEnd ?? anchor)
          : anchor;
    if (!start) continue;
    const end = toIso(toUtc(start) + Math.round(estimate.weeks * 7) * DAY);
    if (track === "design") designEnd = end;
    tracks.push({ track, estimate, start, end });
  }
  const start = tracks.reduce<string | null>((acc, t) => (!acc || t.start < acc ? t.start : acc), null);
  const end = tracks.reduce<string | null>((acc, t) => (!acc || t.end > acc ? t.end : acc), null);
  const spanWeeks = start && end ? Math.round(((toUtc(end) - toUtc(start)) / (7 * DAY)) * 10) / 10 : 0;
  const limit = quarter ? quarterEndDate(quarter) : null;
  const overflowWeeks = end && limit && end > limit ? Math.ceil((toUtc(end) - toUtc(limit)) / (7 * DAY)) : 0;
  return { tracks, start, end, spanWeeks, overflowWeeks };
}

/** Último dia da frente (o fim é exclusivo). */
export const lastDay = (end: string) => toIso(toUtc(end) - DAY);

const number = (weeks: number) => String(weeks).replace(".", ",");
export const formatWeeks = (weeks: number) => `${number(weeks)} ${weeks === 1 ? "semana" : "semanas"}`;
export const formatWeeksShort = (weeks: number) => `${number(weeks)} sem`;

export const hasEffort = (effort: InitiativeEffort) => !!(effort.design || effort.engineering);

/** Como o início da frente é definido, em texto (histórico e resumo). */
export function describeEffortStart(track: EffortTrack, estimate: EffortEstimate): string {
  if (estimate.startMode === "date" && estimate.startDate) return `em ${estimate.startDate.split("-").reverse().join("/")}`;
  if (track === "engineering") return estimate.startMode === "parallel" ? "junto com o design" : "logo após o design";
  return "no início do quarter";
}
