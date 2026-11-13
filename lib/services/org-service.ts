import "server-only";
import type { z } from "zod";
import type { Viewer } from "@/lib/auth/session";
import { ACCESS_LABEL, registeredAdmins } from "@/lib/domain/access";
import { EFFORT_TRACKS } from "@/lib/domain/constants";
import { applyMove, createsCycle, nextSquadOrder, orderIn } from "@/lib/domain/org";
import { OWNER_TRACKS_2026 } from "@/lib/domain/roadmap-2026";
import type { AccessLevel, Database, Person, PersonInput, Squad, SquadInput } from "@/lib/domain/types";
import { getRepository } from "@/lib/repositories";
import { DomainError, notFound } from "@/lib/services/errors";
import { slugify } from "@/lib/validation/paths";
import {
  fieldErrors,
  personAccessInputSchema,
  personInputSchema,
  personMoveSchema,
  personReplaceSchema,
  squadInputSchema,
} from "@/lib/validation/schemas";

/** Times & Squads: colaboradores, squads, realocação e substituição. */

function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new DomainError(422, "Revise os campos destacados.", fieldErrors(result.error));
  return result.data;
}

/** Id estável derivado do nome na criação (não muda se o nome mudar). */
function uniqueId(base: string, taken: { id: string }[], fallback: string): string {
  const root = slugify(base) || fallback;
  let id = root;
  for (let n = 2; taken.some((t) => t.id === id); n++) id = `${root}-${n}`;
  return id;
}

function assertPersonReferences(db: Database, input: PersonInput, selfId?: string) {
  const fields: Record<string, string> = {};
  if (input.managerId) {
    if (input.managerId === selfId) fields.managerId = "Uma pessoa não pode liderar a si mesma.";
    else if (!db.people.some((p) => p.id === input.managerId)) fields.managerId = "A liderança escolhida não existe mais.";
    else if (selfId && createsCycle(db.people, selfId, input.managerId))
      fields.managerId = "Essa liderança criaria um ciclo (a pessoa escolhida responde, direta ou indiretamente, a este colaborador).";
  }
  if (input.squadIds.some((id) => !db.squads.some((s) => s.id === id))) fields.squadIds = "Um dos squads escolhidos não existe mais.";
  if (input.email && db.people.some((p) => p.id !== selfId && p.email.toLowerCase() === input.email.toLowerCase())) {
    fields.email = "Já existe um colaborador com este e-mail.";
  }
  if (Object.keys(fields).length) throw new DomainError(422, "Revise os campos destacados.", fields);
}

function assertSquadReferences(db: Database, input: SquadInput, selfId?: string) {
  const fields: Record<string, string> = {};
  if (input.leaderIds.some((id) => !db.people.some((p) => p.id === id))) fields.leaderIds = "Uma das lideranças escolhidas não existe mais.";
  const badPlatform = input.platformIds.find((id) => !db.platforms.some((p) => p.id === id));
  if (badPlatform) fields.platformIds = `Plataforma ${badPlatform} não existe.`;
  if (db.squads.some((s) => s.id !== selfId && slugify(s.name) === slugify(input.name))) fields.name = "Já existe um squad com este nome.";
  if (Object.keys(fields).length) throw new DomainError(422, "Revise os campos destacados.", fields);
}

/** A liderança externa só vale quando não há liderança cadastrada. */
const cleanPerson = (input: PersonInput): PersonInput => ({
  ...input,
  externalManager: input.managerId ? "" : input.externalManager,
  squadIds: [...new Set(input.squadIds)],
});

/** Participações do formulário: mantém a posição nos squads que continuam e entra no fim dos novos. */
function membershipsFor(db: Database, input: PersonInput, before?: Person): Person["memberships"] {
  return input.squadIds.map((squadId) => {
    const order = before ? orderIn(before, squadId) : undefined;
    return { squadId, order: order ?? nextSquadOrder(db.people, squadId, before?.id) };
  });
}

const toPerson = (
  { squadIds: _squadIds, ...input }: PersonInput,
  id: string,
  memberships: Person["memberships"],
  access: Pick<Person, "access" | "accessChange">,
): Person => ({ ...input, id, memberships, ...access });

/* ---------- Permissão na plataforma ---------- */

const ADMIN_ONLY = "Só administradores alteram permissões. Peça a um administrador em Times & Squads.";

function assertAdmin(viewer: Viewer, message = ADMIN_ONLY) {
  if (viewer.access !== "admin") throw new DomainError(403, message);
}

/** A plataforma nunca fica sem administrador cadastrado (quem define as permissões). */
function assertKeepsAdmin(before: Person[], after: Person[]) {
  if (registeredAdmins(before).length > 0 && registeredAdmins(after).length === 0) {
    throw new DomainError(422, "É preciso manter pelo menos um administrador com e-mail cadastrado. Defina outra pessoa como Administração antes.", {
      access: "Mantenha pelo menos um administrador.",
    });
  }
}

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Permissão pedida no formulário (só administradores enviam algo diferente do atual). */
function requestedAccess(data: unknown): AccessLevel | undefined {
  return parse(personAccessInputSchema, data && typeof data === "object" ? { access: (data as { access?: unknown }).access } : {}).access;
}

const accessStamp = (viewer: Viewer): Person["accessChange"] => ({ by: viewer.name, at: new Date().toISOString() });

export async function createPerson(viewer: Viewer, data: unknown): Promise<Person> {
  const input = cleanPerson(parse(personInputSchema, data));
  const access = requestedAccess(data) ?? "consulta";
  if (access !== "consulta") assertAdmin(viewer);
  return getRepository().transaction((db) => {
    assertPersonReferences(db, input);
    const person = toPerson(input, uniqueId(input.name, db.people, "colaborador"), membershipsFor(db, input), {
      access,
      accessChange: access !== "consulta" ? accessStamp(viewer) : null,
    });
    db.people.push(person);
    return person;
  });
}

export async function updatePerson(viewer: Viewer, id: string, data: unknown): Promise<Person> {
  const input = cleanPerson(parse(personInputSchema, data));
  const requested = requestedAccess(data);
  return getRepository().transaction((db) => {
    const index = db.people.findIndex((p) => p.id === id);
    if (index < 0) throw notFound("Colaborador");
    const before = db.people[index];
    assertPersonReferences(db, input, id);
    const access = requested ?? before.access;
    const accessChanged = access !== before.access;
    if (accessChanged) assertAdmin(viewer);
    // O e-mail é o que liga a permissão ao login: trocá-lo em quem altera conteúdo é trocar o acesso.
    if (before.access !== "consulta" && !sameEmail(before.email, input.email)) {
      assertAdmin(viewer, `Só administradores alteram o e-mail de quem tem permissão de ${ACCESS_LABEL[before.access]}.`);
    }
    const next = toPerson(input, id, membershipsFor(db, input, before), {
      access,
      accessChange: accessChanged ? accessStamp(viewer) : before.accessChange,
    });
    const people = db.people.map((p, i) => (i === index ? next : p));
    assertKeepsAdmin(db.people, people);
    db.people = people;
    return next;
  });
}

/** Remove o colaborador e desfaz as referências (liderados e squads liderados ficam sem liderança). */
function detach(db: Database, id: string) {
  db.people = db.people.filter((p) => p.id !== id).map((p) => (p.managerId === id ? { ...p, managerId: null } : p));
  db.squads = db.squads.map((s) => (s.leaderIds.includes(id) ? { ...s, leaderIds: s.leaderIds.filter((x) => x !== id) } : s));
  reassignEffortOwner(db, id, null);
}

/**
 * Responsável pelo esforço (Design/Engenharia) e pelas iniciativas do Roadmap 2026 que sai do
 * organograma: passa ao substituto ou fica "a definir".
 */
function reassignEffortOwner(db: Database, from: string, to: string | null) {
  db.initiatives = db.initiatives.map((i) => {
    const effort = { ...i.effort };
    let changed = false;
    for (const track of EFFORT_TRACKS) {
      const estimate = effort[track];
      if (estimate?.ownerId === from) {
        effort[track] = { ...estimate, ownerId: to };
        changed = true;
      }
    }
    return changed ? { ...i, effort } : i;
  });
  // Responsáveis do Roadmap 2026: o substituto assume a frente; sem substituto, a pessoa sai da lista.
  db.roadmap2026 = db.roadmap2026.map((item) => {
    if (!OWNER_TRACKS_2026.some((t) => item.owners[t].includes(from))) return item;
    const swap = (ids: string[]) => [...new Set(ids.flatMap((x) => (x === from ? (to ? [to] : []) : [x])))];
    return { ...item, owners: { design: swap(item.owners.design), engineering: swap(item.owners.engineering), qa: swap(item.owners.qa) } };
  });
}

/** Remover quem altera conteúdo é tirar um acesso: só administradores (e nunca o último). */
function assertCanRemove(viewer: Viewer, db: Database, person: Person) {
  if (person.access !== "consulta") {
    assertAdmin(viewer, `Só administradores removem quem tem permissão de ${ACCESS_LABEL[person.access]}.`);
  }
  assertKeepsAdmin(
    db.people,
    db.people.filter((p) => p.id !== person.id),
  );
}

export async function deletePerson(viewer: Viewer, id: string): Promise<void> {
  await getRepository().transaction((db) => {
    const person = db.people.find((p) => p.id === id);
    if (!person) throw notFound("Colaborador");
    assertCanRemove(viewer, db, person);
    detach(db, id);
  });
}

/**
 * Realoca um colaborador entre squads e o topo (lideranças), ou o inclui em mais um lugar
 * (`keep`). Devolve colaboradores e squads atualizados.
 */
export async function movePerson(id: string, data: unknown): Promise<{ people: Person[]; squads: Squad[] }> {
  const move = parse(personMoveSchema, data);
  return getRepository().transaction((db) => {
    if (!db.people.some((p) => p.id === id)) throw notFound("Colaborador");
    const ids = move.to.kind === "squad" ? (move.to.squadId ? [move.to.squadId] : []) : move.to.squadIds;
    if (ids.some((squadId) => !db.squads.some((s) => s.id === squadId))) throw new DomainError(422, "O squad de destino não existe mais.");
    const result = applyMove(db, id, move);
    if (!result) throw new DomainError(409, "O organograma mudou desde que a página foi carregada. Atualize e tente novamente.");
    db.people = result.people;
    db.squads = result.squads;
    return result;
  });
}

/**
 * Substitui um colaborador: o substituto assume os squads e as posições, os squads liderados,
 * os liderados diretos e a liderança de quem sai (e, opcionalmente, cargo e responsabilidades).
 */
export async function replacePerson(viewer: Viewer, id: string, data: unknown): Promise<Person> {
  const options = parse(personReplaceSchema, data);
  return getRepository().transaction((db) => {
    const outgoing = db.people.find((p) => p.id === id);
    if (!outgoing) throw notFound("Colaborador");
    if (options.substituteId === id) throw new DomainError(422, "Escolha outra pessoa para a substituição.", { substituteId: "Escolha outra pessoa." });
    // A permissão não passa ao substituto; remover quem sai segue as regras de remoção.
    if (options.outgoing === "remover") assertCanRemove(viewer, db, outgoing);

    let substitute: Person | undefined;
    if (options.newPerson) {
      const email = options.newPerson.email;
      if (email && db.people.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
        throw new DomainError(422, "Revise os campos destacados.", { "newPerson.email": "Já existe um colaborador com este e-mail." });
      }
      const { squadIds: _squadIds, ...input } = parse(personInputSchema, { name: options.newPerson.name, email, role: outgoing.role });
      substitute = {
        ...input,
        id: uniqueId(options.newPerson.name, db.people, "colaborador"),
        memberships: [],
        access: "consulta",
        accessChange: null,
      };
      db.people.push(substitute);
    } else {
      substitute = db.people.find((p) => p.id === options.substituteId);
      if (!substitute) throw new DomainError(422, "O substituto escolhido não existe mais.", { substituteId: "Colaborador não encontrado." });
    }
    const subId = substitute.id;
    // Quem substitui não pode passar a responder a alguém da própria equipe herdada.
    const managerId = outgoing.managerId === subId || (outgoing.managerId && createsCycle(db.people, subId, outgoing.managerId)) ? null : outgoing.managerId;

    db.people = db.people.map((p) => {
      if (p.id === subId) {
        return {
          ...p,
          memberships: outgoing.memberships,
          managerId,
          externalManager: managerId ? "" : outgoing.externalManager,
          ...(options.takeRole ? { role: outgoing.role, responsibilities: outgoing.responsibilities } : {}),
        };
      }
      if (p.id === id) return { ...p, memberships: [], managerId: null };
      if (p.managerId === id) return { ...p, managerId: subId };
      return p;
    });
    db.squads = db.squads.map((s) =>
      s.leaderIds.includes(id) ? { ...s, leaderIds: [...new Set(s.leaderIds.map((x) => (x === id ? subId : x)))] } : s,
    );
    reassignEffortOwner(db, id, subId);
    if (options.outgoing === "remover") detach(db, id);
    return db.people.find((p) => p.id === subId)!;
  });
}

const cleanSquad = (input: SquadInput): SquadInput => ({ ...input, leaderIds: [...new Set(input.leaderIds)] });

export async function createSquad(data: unknown): Promise<Squad> {
  const input = cleanSquad(parse(squadInputSchema, data));
  return getRepository().transaction((db) => {
    assertSquadReferences(db, input);
    const squad: Squad = { ...input, id: uniqueId(input.name, db.squads, "squad") };
    db.squads.push(squad);
    return squad;
  });
}

export async function updateSquad(id: string, data: unknown): Promise<Squad> {
  const input = cleanSquad(parse(squadInputSchema, data));
  return getRepository().transaction((db) => {
    const index = db.squads.findIndex((s) => s.id === id);
    if (index < 0) throw notFound("Squad");
    assertSquadReferences(db, input, id);
    db.squads[index] = { ...input, id };
    return db.squads[index];
  });
}

/** Exclui o squad; os integrantes continuam cadastrados (nos demais squads ou sem squad). */
export async function deleteSquad(id: string): Promise<void> {
  await getRepository().transaction((db) => {
    if (!db.squads.some((s) => s.id === id)) throw notFound("Squad");
    db.squads = db.squads.filter((s) => s.id !== id);
    db.people = db.people.map((p) => (orderIn(p, id) === undefined ? p : { ...p, memberships: p.memberships.filter((m) => m.squadId !== id) }));
  });
}
