import { FOUNDING_ADMIN_EMAILS } from "@/lib/auth/config";
import type { AccessLevel, Person } from "@/lib/domain/types";

/**
 * Permissão na plataforma. Cada colaborador de Times & Squads tem um nível, ligado ao e-mail
 * da conta Google; só administradores alteram. Quem entra sem cadastro é somente consulta,
 * exceto os administradores de origem (FOUNDING_ADMIN_EMAILS), que valem enquanto não estão
 * cadastrados — e sempre que não houver nenhum administrador cadastrado (ninguém fica trancado
 * do lado de fora). Permissões pelo cargo (esforço, Roadmap 2026) continuam à parte.
 */

export const ACCESS_LABEL: Record<AccessLevel, string> = {
  admin: "Administração",
  editor: "Edição",
  consulta: "Consulta",
};

export const ACCESS_SUMMARY: Record<AccessLevel, string> = {
  admin: "Tudo da Edição e também define a permissão de cada pessoa.",
  editor: "Cria e altera iniciativas, PRDs, documentos, contexto, roadmap e Times & Squads.",
  consulta: "Vê tudo, sem alterar. Ações liberadas pelo cargo continuam valendo.",
};

const normalize = (email: string) => email.trim().toLowerCase();

export const isFoundingAdmin = (email: string) => FOUNDING_ADMIN_EMAILS.includes(normalize(email));

/** Nível inicial de quem ainda não tem permissão gravada (migração v21): mantém o acesso de antes. */
export const defaultAccess = (email: string): AccessLevel => (email && isFoundingAdmin(email) ? "admin" : "consulta");

/** Administradores cadastrados (com e-mail, que é o que liga a permissão ao login). */
export const registeredAdmins = (people: Pick<Person, "email" | "access">[]) => people.filter((p) => p.access === "admin" && p.email.trim());

/** Colaborador ligado ao login. */
export const personForEmail = <P extends Pick<Person, "email">>(people: P[], email: string): P | undefined => {
  const target = normalize(email);
  return target ? people.find((p) => p.email && normalize(p.email) === target) : undefined;
};

/** Nível de quem está conectado. */
export function accessFor(email: string, people: Pick<Person, "email" | "access">[]): AccessLevel {
  if (isFoundingAdmin(email) && registeredAdmins(people).length === 0) return "admin";
  const person = personForEmail(people, email);
  if (person) return person.access;
  return isFoundingAdmin(email) ? "admin" : "consulta";
}
