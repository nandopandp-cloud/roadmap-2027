import "server-only";
import type { z } from "zod";
import { createsCycle, nextSquadOrder, placeInSquad } from "@/lib/domain/org";
import type { Database, Person, PersonInput, Squad, SquadInput } from "@/lib/domain/types";
import { getRepository } from "@/lib/repositories";
import { DomainError, notFound } from "@/lib/services/errors";
import { slugify } from "@/lib/validation/paths";
import {
  fieldErrors,
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
  if (input.squadId && !db.squads.some((s) => s.id === input.squadId)) fields.squadId = "O squad escolhido não existe mais.";
  if (input.email && db.people.some((p) => p.id !== selfId && p.email.toLowerCase() === input.email.toLowerCase())) {
    fields.email = "Já existe um colaborador com este e-mail.";
  }
  if (Object.keys(fields).length) throw new DomainError(422, "Revise os campos destacados.", fields);
}

function assertSquadReferences(db: Database, input: SquadInput, selfId?: string) {
  const fields: Record<string, string> = {};
  if (input.leaderId && !db.people.some((p) => p.id === input.leaderId)) fields.leaderId = "A liderança escolhida não existe mais.";
  const badPlatform = input.platformIds.find((id) => !db.platforms.some((p) => p.id === id));
  if (badPlatform) fields.platformIds = `Plataforma ${badPlatform} não existe.`;
  if (db.squads.some((s) => s.id !== selfId && slugify(s.name) === slugify(input.name))) fields.name = "Já existe um squad com este nome.";
  if (Object.keys(fields).length) throw new DomainError(422, "Revise os campos destacados.", fields);
}

/** A liderança externa só vale quando não há liderança cadastrada. */
const cleanPerson = (input: PersonInput): PersonInput => (input.managerId ? { ...input, externalManager: "" } : input);

export async function createPerson(data: unknown): Promise<Person> {
  const input = cleanPerson(parse(personInputSchema, data));
  return getRepository().transaction((db) => {
    assertPersonReferences(db, input);
    const person: Person = {
      ...input,
      id: uniqueId(input.name, db.people, "colaborador"),
      squadOrder: nextSquadOrder(db.people, input.squadId),
    };
    db.people.push(person);
    return person;
  });
}

export async function updatePerson(id: string, data: unknown): Promise<Person> {
  const input = cleanPerson(parse(personInputSchema, data));
  return getRepository().transaction((db) => {
    const index = db.people.findIndex((p) => p.id === id);
    if (index < 0) throw notFound("Colaborador");
    assertPersonReferences(db, input, id);
    const before = db.people[index];
    const squadOrder = before.squadId === input.squadId ? before.squadOrder : nextSquadOrder(db.people, input.squadId, id);
    db.people[index] = { ...before, ...input, squadOrder };
    return db.people[index];
  });
}

/** Remove o colaborador e desfaz as referências (liderados e squads liderados ficam sem liderança). */
function detach(db: Database, id: string) {
  db.people = db.people.filter((p) => p.id !== id).map((p) => (p.managerId === id ? { ...p, managerId: null } : p));
  db.squads = db.squads.map((s) => (s.leaderId === id ? { ...s, leaderId: null } : s));
}

export async function deletePerson(id: string): Promise<void> {
  await getRepository().transaction((db) => {
    if (!db.people.some((p) => p.id === id)) throw notFound("Colaborador");
    detach(db, id);
  });
}

/** Realoca um colaborador para outro squad (ou sem squad) e posição. Devolve os colaboradores alterados. */
export async function movePerson(id: string, data: unknown): Promise<Person[]> {
  const target = parse(personMoveSchema, data);
  return getRepository().transaction((db) => {
    if (!db.people.some((p) => p.id === id)) throw notFound("Colaborador");
    if (target.squadId && !db.squads.some((s) => s.id === target.squadId)) throw new DomainError(422, "O squad de destino não existe mais.");
    const orders = placeInSquad(db.people, id, target);
    if (!orders) throw new DomainError(409, "O organograma mudou desde que a página foi carregada. Atualize e tente novamente.");
    const changed: Person[] = [];
    db.people = db.people.map((p) => {
      const order = orders.get(p.id);
      if (order === undefined) return p;
      const squadId = p.id === id ? target.squadId : p.squadId;
      if (order === p.squadOrder && squadId === p.squadId) return p;
      const updated = { ...p, squadId, squadOrder: order };
      changed.push(updated);
      return updated;
    });
    return changed;
  });
}

/**
 * Substitui um colaborador: o substituto assume o squad e a posição, os squads liderados,
 * os liderados diretos e a liderança de quem sai (e, opcionalmente, cargo e responsabilidades).
 */
export async function replacePerson(id: string, data: unknown): Promise<Person> {
  const options = parse(personReplaceSchema, data);
  return getRepository().transaction((db) => {
    const outgoing = db.people.find((p) => p.id === id);
    if (!outgoing) throw notFound("Colaborador");
    if (options.substituteId === id) throw new DomainError(422, "Escolha outra pessoa para a substituição.", { substituteId: "Escolha outra pessoa." });

    let substitute: Person | undefined;
    if (options.newPerson) {
      const email = options.newPerson.email;
      if (email && db.people.some((p) => p.email.toLowerCase() === email.toLowerCase())) {
        throw new DomainError(422, "Revise os campos destacados.", { "newPerson.email": "Já existe um colaborador com este e-mail." });
      }
      substitute = {
        ...parse(personInputSchema, { name: options.newPerson.name, email, role: outgoing.role }),
        id: uniqueId(options.newPerson.name, db.people, "colaborador"),
        squadOrder: 0,
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
          squadId: outgoing.squadId,
          squadOrder: outgoing.squadOrder,
          managerId,
          externalManager: managerId ? "" : outgoing.externalManager,
          ...(options.takeRole ? { role: outgoing.role, responsibilities: outgoing.responsibilities } : {}),
        };
      }
      if (p.id === id) return { ...p, squadId: null, managerId: null, squadOrder: nextSquadOrder(db.people, null, id) };
      if (p.managerId === id) return { ...p, managerId: subId };
      return p;
    });
    db.squads = db.squads.map((s) => (s.leaderId === id ? { ...s, leaderId: subId } : s));
    if (options.outgoing === "remover") detach(db, id);
    return db.people.find((p) => p.id === subId)!;
  });
}

export async function createSquad(data: unknown): Promise<Squad> {
  const input = parse(squadInputSchema, data);
  return getRepository().transaction((db) => {
    assertSquadReferences(db, input);
    const squad: Squad = { ...input, id: uniqueId(input.name, db.squads, "squad") };
    db.squads.push(squad);
    return squad;
  });
}

export async function updateSquad(id: string, data: unknown): Promise<Squad> {
  const input = parse(squadInputSchema, data);
  return getRepository().transaction((db) => {
    const index = db.squads.findIndex((s) => s.id === id);
    if (index < 0) throw notFound("Squad");
    assertSquadReferences(db, input, id);
    db.squads[index] = { ...input, id };
    return db.squads[index];
  });
}

/** Exclui o squad; os integrantes continuam cadastrados, sem squad. */
export async function deleteSquad(id: string): Promise<void> {
  await getRepository().transaction((db) => {
    if (!db.squads.some((s) => s.id === id)) throw notFound("Squad");
    let order = nextSquadOrder(db.people, null);
    db.squads = db.squads.filter((s) => s.id !== id);
    db.people = db.people.map((p) => (p.squadId === id ? { ...p, squadId: null, squadOrder: order++ } : p));
  });
}
