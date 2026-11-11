/**
 * Regras de leitura do Roadmap 2026 (projeção importada da planilha do time): calendário de
 * semanas S1–S4 de julho/2026 a abril/2027, períodos, situação e trimestre de entrega.
 */
import { ROADMAP_2026_STATUSES, ROADMAP_2026_TRACK_STATUSES, ROADMAP_2026_WEEK_COUNT, ROADMAP_2026_WORK } from "@/lib/domain/constants";
import type {
  Person,
  Roadmap2026ImportItem,
  Roadmap2026Item,
  Roadmap2026Owners,
  Roadmap2026Phase,
  Roadmap2026Segment,
  Roadmap2026TrackStatus,
  Roadmap2026Wave,
  Roadmap2026Work,
} from "@/lib/domain/types";

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
    trackStatus: trackStatusesFromSheet(item),
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

/** Semanas desde o fim projetado (0 quando ainda não passou ou a iniciativa está concluída). */
export function overdueWeeks(item: Item2026Status, today = new Date()): number {
  const end = editableEnd(item);
  const now = weekIndexOf(today);
  if (end === null || now === null || isDone(item)) return 0;
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

/* ------------------------------ Status calculado ------------------------------ */

/** O que as regras de status precisam de uma iniciativa. */
type Item2026Status = Pick<Roadmap2026Item, "segments" | "status"> & { trackStatus?: Roadmap2026TrackStatus; owners?: Roadmap2026Owners };

/** Frentes envolvidas: as que têm responsável ou que já começaram. */
export function involvedTracks(item: Item2026Status): TrackStatusTrack[] {
  const statuses = item.trackStatus;
  if (!statuses) return [];
  return TRACK_STATUS_TRACKS.filter((t) => (item.owners?.[t]?.length ?? 0) > 0 || statuses[t] !== "nao_iniciado");
}

/**
 * Concluída só quando todas as frentes envolvidas (com responsável ou já começadas) estão
 * concluídas. Sem nenhuma frente envolvida, vale a situação lida da planilha na importação.
 */
export function isDone(item: Item2026Status): boolean {
  const tracks = involvedTracks(item);
  if (!tracks.length) return item.status === "concluida";
  return tracks.every((t) => item.trackStatus![t] === "concluido");
}

/**
 * Status exibido, sempre calculado: Concluída (todas as frentes envolvidas concluídas); senão
 * Atrasada se o fim projetado já passou; Em andamento se alguma frente já começou; Planejada.
 */
export function effectiveStatus(item: Item2026Status, today = new Date()): Status2026 {
  if (isDone(item)) return "concluida";
  if (overdueWeeks(item, today) > 0) return "atrasada";
  const started = item.trackStatus ? TRACK_STATUS_TRACKS.some((t) => item.trackStatus![t] !== "nao_iniciado") : false;
  return started ? "andamento" : "planejada";
}

/** Atrasada sempre pelo prazo (fim projetado vencido sem conclusão). */
export function lateReason(item: Item2026Status, today = new Date()): "prazo" | null {
  return !isDone(item) && overdueWeeks(item, today) > 0 ? "prazo" : null;
}

/** Explicação do status calculado (dica no Gantt e janela de edição). */
export function statusReason(item: Item2026Status, today = new Date()): string {
  const status = effectiveStatus(item, today);
  const tracks = involvedTracks(item);
  const label = (t: TrackStatusTrack) => ({ design: "Design", engineering: "Engenharia", qa: "QA" })[t];
  const pending = tracks.filter((t) => item.trackStatus![t] !== "concluido").map(label);
  const list = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}` : names[0]);
  if (status === "concluida")
    return tracks.length ? `Concluída: ${list(tracks.map(label))} ${tracks.length > 1 ? "concluíram" : "concluiu"}.` : "Concluída na planilha (sem responsáveis nem andamento por frente).";
  const end = editableEnd(item);
  const waiting = pending.length ? ` Falta concluir: ${list(pending)}.` : "";
  if (status === "atrasada") return `Atrasada: o fim projetado (${weekLabel(end! - 1)}) já passou.${waiting}`;
  if (status === "andamento") return `Em andamento: alguma frente já começou e o prazo ainda não venceu.${waiting}`;
  return "Planejada: nenhuma frente começou ainda.";
}

/* ------------------------------ Status por frente ------------------------------ */

/** Andamento de cada frente (Design, Engenharia e QA), separado do status geral da iniciativa. */
export const TRACK_STATUSES_2026 = ROADMAP_2026_TRACK_STATUSES;
export type TrackStatus2026 = (typeof TRACK_STATUSES_2026)[number];
export const TRACK_STATUS_TRACKS = ["design", "engineering", "qa"] as const;
export type TrackStatusTrack = (typeof TRACK_STATUS_TRACKS)[number];
export type TrackStatuses2026 = Roadmap2026TrackStatus;

/** Andamento das frentes lido dos textos de Design, Engenheiro e QA da planilha. */
export function trackStatusesFromSheet(item: Pick<Roadmap2026Item, "design" | "engineering" | "qa">): TrackStatuses2026 {
  return { design: trackStatusFromSheet(item.design), engineering: trackStatusFromSheet(item.engineering), qa: trackStatusFromSheet(item.qa) };
}

export const TRACK_STATUS_LABEL: Record<TrackStatus2026, string> = { nao_iniciado: "Não iniciado", andamento: "Em andamento", concluido: "Concluído" };
/** Rótulo curto (chips do Gantt). */
export const TRACK_STATUS_SHORT: Record<TrackStatus2026, string> = { nao_iniciado: "A iniciar", andamento: "Andamento", concluido: "Concluído" };

/** Texto da planilha → andamento da frente: "Concluído", "Andamento…"; nomes e o resto = não iniciado. */
export function trackStatusFromSheet(text: string): TrackStatus2026 {
  const t = norm(text);
  if (/^concluid[oa]$/.test(t)) return "concluido";
  if (t.startsWith("andamento")) return "andamento";
  return "nao_iniciado";
}
