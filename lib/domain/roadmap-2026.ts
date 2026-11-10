/**
 * Regras de leitura do Roadmap 2026 (projeção importada da planilha do time): calendário de
 * semanas S1–S4 de julho/2026 a abril/2027, períodos, situação e trimestre de entrega.
 */
import { ROADMAP_2026_WEEK_COUNT } from "@/lib/domain/constants";
import type { Roadmap2026Item, Roadmap2026Phase, Roadmap2026Segment, Roadmap2026Wave } from "@/lib/domain/types";

/** Meses da planilha, na ordem das colunas (quatro semanas cada). */
export const CYCLE_2026_MONTHS = [
  { short: "Jul", name: "julho", year: 2026, month: 7 },
  { short: "Ago", name: "agosto", year: 2026, month: 8 },
  { short: "Set", name: "setembro", year: 2026, month: 9 },
  { short: "Out", name: "outubro", year: 2026, month: 10 },
  { short: "Nov", name: "novembro", year: 2026, month: 11 },
  { short: "Dez", name: "dezembro", year: 2026, month: 12 },
  { short: "Jan", name: "janeiro", year: 2027, month: 1 },
  { short: "Fev", name: "fevereiro", year: 2027, month: 2 },
  { short: "Mar", name: "março", year: 2027, month: 3 },
  { short: "Abr", name: "abril", year: 2027, month: 4 },
] as const;

export const WEEKS_PER_MONTH = 4;

/** Trimestres cobertos pela projeção (o último só tem abril). */
export const CYCLE_2026_QUARTERS = [
  { key: "2026-Q3", label: "Q3 2026", months: "Julho a setembro", firstWeek: 0, weeks: 12 },
  { key: "2026-Q4", label: "Q4 2026", months: "Outubro a dezembro", firstWeek: 12, weeks: 12 },
  { key: "2027-Q1", label: "Q1 2027", months: "Janeiro a março", firstWeek: 24, weeks: 12 },
  { key: "2027-Q2", label: "Q2 2027", months: "Abril (fim da projeção)", firstWeek: 36, weeks: 4 },
] as const;
export type Cycle2026QuarterKey = (typeof CYCLE_2026_QUARTERS)[number]["key"];

export const PHASE_2026_LABEL: Record<Roadmap2026Phase, string> = {
  design: "Design",
  engenharia: "Projetado e engenharia",
  andamento: "Em progresso",
  concluido: "Concluído",
  revisao: "Revisão de prazo",
  indefinido: "Sem legenda",
};

/** Rótulo curto dentro das barras do Gantt. */
export const PHASE_2026_SHORT: Record<Roadmap2026Phase, string> = {
  design: "Design",
  engenharia: "Engenharia",
  andamento: "Em progresso",
  concluido: "Concluído",
  revisao: "Revisão de prazo",
  indefinido: "Sem legenda",
};

export const WAVE_2026_LABEL: Record<Roadmap2026Wave, string> = {
  primeira: "Primeira onda",
  segunda: "Segunda onda",
  terceira: "Terceira onda",
};

/** Semana como na planilha: "S3 de jul/26". */
export function weekLabel(index: number): string {
  const month = CYCLE_2026_MONTHS[Math.floor(index / WEEKS_PER_MONTH)];
  return `S${(index % WEEKS_PER_MONTH) + 1} de ${month.short.toLowerCase()}/${String(month.year).slice(2)}`;
}

/** Período de uma fase: "S3 de jul/26 a S1 de ago/26 (3 semanas)" ou "S2 a S4 de jul/26 (3 semanas)". */
export function segmentPeriod(s: Roadmap2026Segment): string {
  const last = s.start + s.weeks - 1;
  const sameMonth = Math.floor(s.start / WEEKS_PER_MONTH) === Math.floor(last / WEEKS_PER_MONTH);
  const range =
    s.weeks === 1
      ? weekLabel(s.start)
      : sameMonth
        ? `S${(s.start % WEEKS_PER_MONTH) + 1} a ${weekLabel(last)}`
        : `${weekLabel(s.start)} a ${weekLabel(last)}`;
  return `${range} (${s.weeks} ${s.weeks === 1 ? "semana" : "semanas"})`;
}

/** Posição (0–100) de uma semana na linha do tempo. */
export const weekPosition = (index: number) => (index / ROADMAP_2026_WEEK_COUNT) * 100;

/** Posição (0–100) de uma data na linha do tempo; null fora de julho/2026–abril/2027. */
export function cycle2026DatePosition(date: Date): number | null {
  const idx = CYCLE_2026_MONTHS.findIndex((m) => m.year === date.getFullYear() && m.month === date.getMonth() + 1);
  if (idx < 0) return null;
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return ((idx + (date.getDate() - 1) / days) / CYCLE_2026_MONTHS.length) * 100;
}

/** Última semana projetada (exclusiva); null quando a linha não tem semanas coloridas. */
export const projectedEnd = (item: Roadmap2026Item) =>
  item.segments.length ? Math.max(...item.segments.map((s) => s.start + s.weeks)) : null;

/** Trimestre em que termina a última semana projetada (coluna do card). */
export function deliveryQuarter(item: Roadmap2026Item): Cycle2026QuarterKey | null {
  const end = projectedEnd(item);
  if (end === null) return null;
  const last = end - 1;
  return CYCLE_2026_QUARTERS.find((q) => last >= q.firstWeek && last < q.firstWeek + q.weeks)?.key ?? null;
}

export type Situation2026 = "concluido" | "revisao" | "andamento" | "projetado" | "sem_semanas";

export const SITUATION_2026_LABEL: Record<Situation2026, string> = {
  concluido: "Concluído",
  revisao: "Revisão de prazo",
  andamento: "Em progresso",
  projetado: "Projetado",
  sem_semanas: "Sem semanas projetadas",
};

/** Situação lida das cores da linha: tudo verde = concluído; vermelho = revisão; azul = em progresso. */
export function situationOf(item: Roadmap2026Item): Situation2026 {
  const phases = item.segments.map((s) => s.phase);
  if (!phases.length) return "sem_semanas";
  if (phases.every((p) => p === "concluido")) return "concluido";
  if (phases.includes("revisao")) return "revisao";
  if (phases.includes("andamento")) return "andamento";
  return "projetado";
}

/** Filtro de plataforma: id da plataforma ou "transversais" (linhas sem plataforma). */
export const TRANSVERSAL_2026 = "transversais";
export const platformKey2026 = (item: Roadmap2026Item) => item.platformId ?? TRANSVERSAL_2026;
