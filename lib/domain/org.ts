import { DISCIPLINES } from "@/lib/domain/constants";
import type { Discipline, Initiative, OrgZone, Person, PersonMove, Squad } from "@/lib/domain/types";

/**
 * Regras do organograma (Times & Squads), usadas no servidor (ao gravar) e no cliente
 * (atualização otimista ao arrastar e relações exibidas no painel).
 */

type Member = Pick<Person, "id" | "memberships" | "name">;

/** Posição da pessoa no squad (undefined = não participa). */
export const orderIn = (person: Member, squadId: string) => person.memberships.find((m) => m.squadId === squadId)?.order;

export const squadIdsOf = (person: Pick<Person, "memberships">) => person.memberships.map((m) => m.squadId);

const byName = (a: Member, b: Member) => a.name.localeCompare(b.name, "pt-BR");

/** Integrantes de um squad na ordem do organograma; null = quem não participa de nenhum squad (por nome). */
export function squadMembers<T extends Member>(people: T[], squadId: string | null, exceptId?: string): T[] {
  if (!squadId) return people.filter((p) => !p.memberships.length && p.id !== exceptId).sort(byName);
  return people
    .filter((p) => p.id !== exceptId && orderIn(p, squadId) !== undefined)
    .sort((a, b) => orderIn(a, squadId)! - orderIn(b, squadId)! || byName(a, b));
}

/** Posição ao final do squad (novos integrantes pelo formulário). */
export function nextSquadOrder(people: Member[], squadId: string, exceptId?: string): number {
  return squadMembers(people, squadId, exceptId).reduce((max, p) => Math.max(max, orderIn(p, squadId)! + 1), 0);
}

/** Inclui (ou mantém) a participação no squad, preservando a ordem das demais. */
export function withMembership<T extends Member>(person: T, squadId: string, order: number): T {
  const exists = person.memberships.some((m) => m.squadId === squadId);
  const memberships = exists
    ? person.memberships.map((m) => (m.squadId === squadId ? { squadId, order } : m))
    : [...person.memberships, { squadId, order }];
  return { ...person, memberships };
}

/** Insere `id` em `ids` antes/depois do vizinho; null se o vizinho não estiver na lista. */
function insertAt(ids: string[], id: string, beforeId?: string | null, afterId?: string | null): string[] | null {
  const rest = ids.filter((x) => x !== id);
  let index = rest.length;
  const anchor = afterId ?? beforeId;
  if (anchor) {
    const at = rest.indexOf(anchor);
    if (at < 0) return null;
    index = afterId ? at + 1 : at;
  }
  rest.splice(index, 0, id);
  return rest;
}

/** Chave do grupo de squads com as mesmas lideranças (na mesma ordem). */
export const leadersKey = (squad: Pick<Squad, "leaderIds">) => squad.leaderIds.join(",");

export const sameZone = (a: OrgZone, b: OrgZone) =>
  a.kind === "squad" && b.kind === "squad"
    ? a.squadId === b.squadId
    : a.kind === "leaders" && b.kind === "leaders" && a.squadIds.length === b.squadIds.length && a.squadIds.every((id) => b.squadIds.includes(id));

/**
 * Aplica uma realocação: tira a pessoa da origem (salvo `keep`) e a coloca no destino, na
 * posição indicada. Devolve null quando o organograma mudou (squad ou vizinho inexistente).
 */
export function applyMove<P extends Member, S extends Pick<Squad, "id" | "leaderIds">>(
  org: { people: P[]; squads: S[] },
  id: string,
  move: PersonMove,
): { people: P[]; squads: S[] } | null {
  let { people, squads } = org;
  const { from = null, to, beforeId = null, afterId = null, keep = false } = move;
  if (!people.some((p) => p.id === id)) return null;
  const exists = (squadId: string) => squads.some((s) => s.id === squadId);
  if (to.kind === "squad" ? to.squadId && !exists(to.squadId) : !to.squadIds.every(exists)) return null;

  if (from && !(keep && (to.kind === "leaders" || to.squadId)) && !sameZone(from, to)) {
    if (from.kind === "squad" && from.squadId) {
      people = people.map((p) => (p.id === id ? { ...p, memberships: p.memberships.filter((m) => m.squadId !== from.squadId) } : p));
    } else if (from.kind === "leaders") {
      squads = squads.map((s) => (from.squadIds.includes(s.id) ? { ...s, leaderIds: s.leaderIds.filter((x) => x !== id) } : s));
    }
  }

  if (to.kind === "squad") {
    const squadId = to.squadId;
    if (!squadId) {
      // "Sem squad" tira a pessoa da origem; sem origem, de todos os squads.
      if (!from) people = people.map((p) => (p.id === id ? { ...p, memberships: [] } : p));
      return { people, squads };
    }
    const ids = insertAt(squadMembers(people, squadId, id).map((p) => p.id), id, beforeId, afterId);
    if (!ids) return null;
    const orders = new Map(ids.map((x, n) => [x, n]));
    people = people.map((p) => {
      const order = orders.get(p.id);
      return order === undefined || orderIn(p, squadId) === order ? p : withMembership(p, squadId, order);
    });
    return { people, squads };
  }

  const group = squads.filter((s) => to.squadIds.includes(s.id));
  const current = group[0].leaderIds.filter((x) => x !== id);
  // Os squads do grupo precisam ter as mesmas lideranças exibidas no topo.
  if (group.some((s) => s.leaderIds.filter((x) => x !== id).join(",") !== current.join(","))) return null;
  const leaderIds = insertAt(current, id, beforeId, afterId);
  if (!leaderIds) return null;
  squads = squads.map((s) => (to.squadIds.includes(s.id) ? { ...s, leaderIds } : s));
  return { people, squads };
}

/** Squads liderados pela pessoa (aparecem abaixo dela no organograma). */
export const squadsLedBy = (squads: Squad[], personId: string) => squads.filter((s) => s.leaderIds.includes(personId));

/** Liderados diretos (managerId). */
export const directReports = (people: Person[], personId: string) => people.filter((p) => p.managerId === personId);

/** Lidera ao menos um squad ou tem liderados diretos. */
export const isLeader = (person: Person, people: Person[], squads: Squad[]) =>
  squads.some((s) => s.leaderIds.includes(person.id)) || people.some((p) => p.managerId === person.id);

/** Squads relacionados: os squads da pessoa e os que ela lidera. */
export function relatedSquads(person: Person, squads: Squad[]): Squad[] {
  return squads.filter((s) => orderIn(person, s.id) !== undefined || s.leaderIds.includes(person.id));
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

/** Sugere a função no squad a partir do cargo (usado na migração e como sugestão no formulário). */
export function inferDiscipline(role: string): Discipline | null {
  const r = role.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(qa|quality|qualidade|tester|testes?)\b/.test(r)) return "qa";
  if (/design|ux|ui\b/.test(r)) return "design";
  if (/\b(product|produto|pm|po|cpo)\b/.test(r)) return "produto";
  if (/engenh|engineer|desenvolv|developer|dev\b|devops|tech lead|cto|arquitet|frontend|front-end|backend|back-end|fullstack|mobile|dados|data/.test(r)) return "engenharia";
  return null;
}

/** Quantidade de integrantes por função, na ordem de DISCIPLINES. */
export function disciplineCounts(people: Pick<Person, "discipline">[]) {
  return DISCIPLINES.map((d) => ({ discipline: d, count: people.filter((p) => p.discipline === d).length }));
}
