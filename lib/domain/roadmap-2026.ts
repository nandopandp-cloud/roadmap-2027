/**
 * Regras de leitura do Roadmap 2026 (projeção importada da planilha do time): calendário de
 * semanas S1–S4 de julho/2026 a abril/2027, períodos, situação e trimestre de entrega.
 */
import { ROADMAP_2026_STATUSES, ROADMAP_2026_WEEK_COUNT, ROADMAP_2026_WORK } from "@/lib/domain/constants";
import type { Person, Roadmap2026ImportItem, Roadmap2026Item, Roadmap2026Owners, Roadmap2026Phase, Roadmap2026Segment, Roadmap2026Wave, Roadmap2026Work } from "@/lib/domain/types";

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
export const projectedEnd = (item: Roadmap2026ImportItem) =>
  item.segments.length ? Math.max(...item.segments.map((s) => s.start + s.weeks)) : null;

/** Trimestre em que termina a última semana projetada (coluna do card). */
export function deliveryQuarter(item: Roadmap2026ImportItem): Cycle2026QuarterKey | null {
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
export function situationOf(item: Roadmap2026ImportItem): Situation2026 {
  const phases = item.segments.map((s) => s.phase);
  if (!phases.length) return "sem_semanas";
  if (phases.every((p) => p === "concluido")) return "concluido";
  if (phases.includes("revisao")) return "revisao";
  if (phases.includes("andamento")) return "andamento";
  return "projetado";
}

/** Filtro de plataforma: id da plataforma ou "transversais" (linhas sem plataforma). */
export const TRANSVERSAL_2026 = "transversais";
export const platformKey2026 = (item: Pick<Roadmap2026Item, "platformId">) => item.platformId ?? TRANSVERSAL_2026;

/* ------------------------- Edição (status, fases e prazos) ------------------------- */


export type Status2026 = (typeof ROADMAP_2026_STATUSES)[number];
export type Work2026 = (typeof ROADMAP_2026_WORK)[number];

export const STATUS_2026_LABEL: Record<Status2026, string> = {
  planejada: "Planejada",
  andamento: "Em andamento",
  qa: "Em QA",
  atrasada: "Atrasada",
  concluida: "Concluída",
};

export const WORK_2026_LABEL: Record<Work2026, string> = {
  design: "Design",
  engenharia: "Engenharia",
  qa: "QA",
  indefinido: "Fase não informada",
};

/**
 * Status inicial lido das cores da planilha: tudo verde = Concluída; vermelho (ou "Atrasado"
 * escrito na linha) = Atrasada; azul = Em andamento; o resto = Planejada.
 */
export function initialStatus(item: Roadmap2026ImportItem): Status2026 {
  if ([item.design, item.engineering, item.qa].some((v) => /^atrasad/i.test(v))) return "atrasada";
  const situation = situationOf(item);
  return situation === "concluido" ? "concluida" : situation === "revisao" ? "atrasada" : situation === "andamento" ? "andamento" : "planejada";
}

/**
 * Linha importada da planilha → iniciativa editável. Cores de Design e "Projetado & Engenharia"
 * viram o tipo de trabalho; verde, azul, vermelho e cinza diziam a situação (agora no status),
 * não o tipo — ficam como "Fase não informada".
 */
export function importedItem(item: Roadmap2026ImportItem, people: Pick<Person, "id" | "name">[] = []): Roadmap2026Item {
  return {
    id: item.id,
    title: item.title,
    subtitle: "",
    squad: item.squad,
    platformId: item.platformId,
    owners: ownersFromSheet(item, people),
    weeks: item.weeks,
    design: item.design,
    engineering: item.engineering,
    qa: item.qa,
    backlog: item.backlog,
    pricing: item.pricing,
    status: initialStatus(item),
    segments: item.segments.map((s, idx) => ({
      id: `${item.id}-${idx + 1}`,
      work: s.phase === "design" ? "design" : s.phase === "engenharia" ? "engenharia" : "indefinido",
      start: s.start,
      weeks: s.weeks,
    })),
    history: [],
  };
}

/** Semana da projeção (0–39) em que está uma data; S1 = dias 1–7, S4 = dia 22 em diante. */
export function weekIndexOf(date: Date): number | null {
  const idx = CYCLE_2026_MONTHS.findIndex((m) => m.year === date.getFullYear() && m.month === date.getMonth() + 1);
  if (idx < 0) return date < new Date(2026, 6, 1) ? -1 : null;
  return idx * WEEKS_PER_MONTH + Math.min(3, Math.floor((date.getDate() - 1) / 7));
}

export const editableEnd = (item: Pick<Roadmap2026Item, "segments">) => (item.segments.length ? Math.max(...item.segments.map((s) => s.start + s.weeks)) : null);

/** Fim projetado já passou (semanas inteiras antes da atual) e o item não está concluído nem marcado como atrasado. */
export function overdueWeeks(item: Pick<Roadmap2026Item, "segments" | "status">, today = new Date()): number {
  const end = editableEnd(item);
  const now = weekIndexOf(today);
  if (end === null || now === null || item.status === "concluida") return 0;
  return Math.max(0, now - end + 1);
}

export function editableQuarter(item: Pick<Roadmap2026Item, "segments">): Cycle2026QuarterKey | null {
  const end = editableEnd(item);
  if (end === null) return null;
  return CYCLE_2026_QUARTERS.find((q) => end - 1 >= q.firstWeek && end - 1 < q.firstWeek + q.weeks)?.key ?? null;
}

/** "S3 de ago/26 a S1 de set/26 (3 semanas)" para uma fase editável. */
export const workPeriod = (s: Pick<Roadmap2026Work, "start" | "weeks">) => segmentPeriod({ phase: "indefinido", start: s.start, weeks: s.weeks });

/* ------------------------------ Responsáveis ------------------------------ */

/** Frentes com responsáveis declarados em cada iniciativa do 2026. */
export const OWNER_TRACKS_2026 = ["design", "engineering", "qa"] as const;
export type OwnerTrack2026 = (typeof OWNER_TRACKS_2026)[number];
export const OWNER_TRACK_LABEL: Record<OwnerTrack2026, string> = { design: "Design", engineering: "Engenharia", qa: "QA" };
/** Função no organograma sugerida para cada frente (ordena a lista de pessoas). */
export const OWNER_TRACK_DISCIPLINE = { design: "design", engineering: "engenharia", qa: "qa" } as const;
export type Owners2026 = Roadmap2026Owners;
export const EMPTY_OWNERS_2026: Owners2026 = { design: [], engineering: [], qa: [] };

const norm = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/** Textos da planilha que descrevem situação, não pessoa. */
const NOT_A_PERSON = /^(concluid[oa]|andamento|atrasad[oa]|sem designer|lead novo|despriorizad[oa]|nao iniciad[oa])$/;

/**
 * Pessoa escrita na planilha ("Renan", "Andamento - Renan") → colaborador de Times & Squads
 * com esse primeiro nome (ou nome completo). Só associa quando há exatamente uma pessoa.
 */
export function matchSheetPerson(text: string, people: Pick<Person, "id" | "name">[]): string | null {
  const name = norm(text.replace(/^andamento\s*-\s*/i, ""));
  if (!name || NOT_A_PERSON.test(name)) return null;
  const found = people.filter((p) => {
    const full = norm(p.name);
    return full === name || full.split(/\s+/)[0] === name;
  });
  return found.length === 1 ? found[0].id : null;
}

/** Responsáveis lidos dos textos da planilha (Design, Engenharia, QA). */
export function ownersFromSheet(item: Pick<Roadmap2026Item, "design" | "engineering" | "qa">, people: Pick<Person, "id" | "name">[]): Owners2026 {
  const pick = (text: string) => {
    const id = matchSheetPerson(text, people);
    return id ? [id] : [];
  };
  return { design: pick(item.design), engineering: pick(item.engineering), qa: pick(item.qa) };
}

/* ------------------------------ Atraso automático ------------------------------ */

/**
 * Status exibido: a iniciativa cujo fim projetado já passou (e que não está concluída) aparece
 * como Atrasada automaticamente, até ser concluída ou ter as semanas estendidas. O status
 * gravado continua o escolhido pelo time.
 */
export function effectiveStatus(item: Pick<Roadmap2026Item, "segments" | "status">, today = new Date()): Status2026 {
  if (item.status === "concluida") return "concluida";
  return overdueWeeks(item, today) > 0 ? "atrasada" : item.status;
}

/** Por que a iniciativa está atrasada: prazo vencido (automático) ou status escolhido pelo time. */
export function lateReason(item: Pick<Roadmap2026Item, "segments" | "status">, today = new Date()): "prazo" | "manual" | null {
  if (item.status === "concluida") return null;
  if (overdueWeeks(item, today) > 0) return "prazo";
  return item.status === "atrasada" ? "manual" : null;
}
