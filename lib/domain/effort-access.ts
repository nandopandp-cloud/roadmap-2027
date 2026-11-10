import { EFFORT_TRACKS, type EffortTrack } from "@/lib/domain/effort";
import type { Person } from "@/lib/domain/types";

/**
 * Quem estima o esforço no roadmap, além dos editores (que preenchem as duas frentes):
 * - Engenharia: tech leads;
 * - Design: a coordenação de design.
 * A permissão vem do organograma (Times & Squads): o colaborador cujo e-mail é o do login
 * e cujo cargo é de tech lead ou de coordenação de design. Mudou o cargo ou saiu do
 * organograma, a permissão acompanha — sem lista de e-mails para manter.
 */

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Tech lead: "Tech Lead", "TechLead", "Tech-lead", "Líder técnico(a)". */
export function isTechLead(person: Pick<Person, "role">): boolean {
  return /\btech\s*-?\s*lead\b|\blider(?:anca)?\s+tecnic[oa]\b/.test(normalize(person.role));
}

/** Coordenação de design: cargo de coordenador(a)/coordenação de design (ou na função Design). */
export function isDesignCoordinator(person: Pick<Person, "role" | "discipline">): boolean {
  const role = normalize(person.role);
  return /\bcoordena(?:dor|dora|cao)\b/.test(role) && (role.includes("design") || person.discipline === "design");
}

/** Frentes que o cargo da pessoa permite estimar (sem considerar o perfil de editor). */
export function effortTracksByRole(person: Pick<Person, "role" | "discipline">): EffortTrack[] {
  return EFFORT_TRACKS.filter((track) => (track === "design" ? isDesignCoordinator(person) : isTechLead(person)));
}

/** Frentes que a pessoa conectada pode estimar: as duas para editores; pelo cargo para os demais. */
export function effortTracksFor(viewer: { email: string; role: "editor" | "leitor" }, people: Person[]): EffortTrack[] {
  if (viewer.role === "editor") return [...EFFORT_TRACKS];
  const email = viewer.email.trim().toLowerCase();
  const matches = people.filter((p) => p.email && p.email.trim().toLowerCase() === email);
  return EFFORT_TRACKS.filter((track) => matches.some((p) => effortTracksByRole(p).includes(track)));
}

/**
 * Justificativa do esforço (anexos): cada time cuida da sua frente. Quem tem a função
 * Design no organograma anexa e remove os documentos de Design; a função Engenharia, os
 * de Engenharia. Tech leads e a coordenação de design também, pelo cargo. Todos veem tudo.
 */
export function evidenceTracksByRole(person: Pick<Person, "role" | "discipline">): EffortTrack[] {
  const byRole = effortTracksByRole(person);
  return EFFORT_TRACKS.filter(
    (track) => byRole.includes(track) || (track === "design" ? person.discipline === "design" : person.discipline === "engenharia"),
  );
}

/** Frentes cuja justificativa a pessoa conectada pode alterar: as duas para editores; pelo time para os demais. */
export function evidenceTracksFor(viewer: { email: string; role: "editor" | "leitor" }, people: Person[]): EffortTrack[] {
  if (viewer.role === "editor") return [...EFFORT_TRACKS];
  const email = viewer.email.trim().toLowerCase();
  const matches = people.filter((p) => p.email && p.email.trim().toLowerCase() === email);
  return EFFORT_TRACKS.filter((track) => matches.some((p) => evidenceTracksByRole(p).includes(track)));
}
