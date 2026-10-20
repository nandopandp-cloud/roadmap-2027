import type { Initiative, Person, Squad } from "@/lib/domain/types";

/**
 * Regras do organograma (Times & Squads), usadas no servidor (ao gravar) e no cliente
 * (atualização otimista ao arrastar e relações exibidas no painel).
 */

type Member = Pick<Person, "id" | "squadId" | "squadOrder" | "name">;

/** Destino de um colaborador: squad (null = sem squad) e vizinho visível. */
export interface PersonTarget {
  squadId: string | null;
  beforeId?: string | null;
  afterId?: string | null;
}

export const compareMembers = (a: Member, b: Member) => a.squadOrder - b.squadOrder || a.name.localeCompare(b.name, "pt-BR");

export function squadMembers<T extends Member>(people: T[], squadId: string | null, exceptId?: string): T[] {
  return people.filter((p) => p.squadId === squadId && p.id !== exceptId).sort(compareMembers);
}

/** Posição ao final do squad (novos colaboradores e mudanças de squad pelo formulário). */
export function nextSquadOrder(people: Member[], squadId: string | null, exceptId?: string): number {
  return squadMembers(people, squadId, exceptId).reduce((max, p) => Math.max(max, p.squadOrder + 1), 0);
}

/** Nova ordem do squad de destino com o colaborador inserido; null se o vizinho não estiver no squad. */
export function placeInSquad(people: Member[], id: string, target: PersonTarget): Map<string, number> | null {
  const members = squadMembers(people, target.squadId, id);
  let index = members.length;
  const anchor = target.afterId ?? target.beforeId;
  if (anchor) {
    const at = members.findIndex((p) => p.id === anchor);
    if (at < 0) return null;
    index = target.afterId ? at + 1 : at;
  }
  const ids = members.map((p) => p.id);
  ids.splice(index, 0, id);
  return new Map(ids.map((x, n) => [x, n]));
}

/** Squads liderados pela pessoa (aparecem abaixo dela no organograma). */
export const squadsLedBy = (squads: Squad[], personId: string) => squads.filter((s) => s.leaderId === personId);

/** Liderados diretos (managerId). */
export const directReports = (people: Person[], personId: string) => people.filter((p) => p.managerId === personId);

/** Lidera ao menos um squad ou tem liderados diretos. */
export const isLeader = (person: Person, people: Person[], squads: Squad[]) =>
  squads.some((s) => s.leaderId === person.id) || people.some((p) => p.managerId === person.id);

/** Squads relacionados: o squad da pessoa e os que ela lidera. */
export function relatedSquads(person: Person, squads: Squad[]): Squad[] {
  return squads.filter((s) => s.id === person.squadId || s.leaderId === person.id);
}

const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

/**
 * Iniciativas relacionadas, sempre derivadas dos dados: as que impactam plataformas dos
 * squads relacionados e as que têm a pessoa como responsável (campo "owner").
 */
export function relatedInitiatives(person: Person, squads: Squad[], initiatives: Initiative[]): Initiative[] {
  const platforms = new Set(relatedSquads(person, squads).flatMap((s) => s.platformIds));
  const name = normalize(person.name);
  return initiatives
    .filter((i) => i.platformIds.some((p) => platforms.has(p)) || (name && normalize(i.owner) === name))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function squadInitiatives(squad: Squad, initiatives: Initiative[]): Initiative[] {
  return initiatives.filter((i) => i.platformIds.some((p) => squad.platformIds.includes(p))).sort((a, b) => a.id.localeCompare(b.id));
}

/** A cadeia de lideranças de `managerId` chega de volta à própria pessoa? */
export function createsCycle(people: Pick<Person, "id" | "managerId">[], personId: string, managerId: string | null): boolean {
  const seen = new Set<string>();
  for (let current = managerId; current; current = people.find((p) => p.id === current)?.managerId ?? null) {
    if (current === personId) return true;
    if (seen.has(current)) return false;
    seen.add(current);
  }
  return false;
}

/** Iniciais para o avatar quando não há foto. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
