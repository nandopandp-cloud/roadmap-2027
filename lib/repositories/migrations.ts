import { ILLUSTRATIONS } from "@/lib/domain/constants";
import { defaultRoadmapOrder } from "@/lib/domain/roadmap-order";
import type { Database, IllustrationKey, Person, Squad } from "@/lib/domain/types";

export const SCHEMA_VERSION = 6;

/** Ilustrações removidas da biblioteca → equivalentes atuais. */
const RENAMED_ILLUSTRATIONS: Record<string, IllustrationKey | null> = { cometa: null, lua: null };

/**
 * Atualiza um banco gravado em versão anterior sem perder dados:
 * v1 → v2: objetivos, entregas e etapas de progresso; nova biblioteca de ilustrações.
 * v2 → v3: imagem própria da iniciativa (customImage).
 * v3 → v4: ordem manual dos cards no roadmap (roadmapOrder), iniciada pela ordem de prioridade.
 * v4 → v5: Times & Squads (people, squads), vazios até o time cadastrar.
 * v5 → v6: colaborador em vários squads (squadId/squadOrder → memberships) e squads com
 *          várias lideranças (leaderId → leaderIds).
 */
export function migrateDatabase(db: Database): { db: Database; changed: boolean } {
  if ((db.schemaVersion ?? 1) >= SCHEMA_VERSION) return { db, changed: false };
  const initiatives = db.initiatives.map((i) => {
    const raw = i as Partial<typeof i> & typeof i;
    const illustration =
      raw.illustration && !(ILLUSTRATIONS as readonly string[]).includes(raw.illustration)
        ? (RENAMED_ILLUSTRATIONS[raw.illustration] ?? null)
        : raw.illustration;
    return {
      ...raw,
      illustration,
      objectives: raw.objectives ?? [],
      deliverables: raw.deliverables ?? [],
      phases: raw.phases ?? [],
      customImage: raw.customImage ?? null,
      roadmapOrder: raw.roadmapOrder ?? defaultRoadmapOrder(raw),
    };
  });
  return {
    db: { ...db, schemaVersion: SCHEMA_VERSION, initiatives, people: (db.people ?? []).map(migratePerson), squads: (db.squads ?? []).map(migrateSquad) },
    changed: true,
  };
}

type LegacyPerson = Person & { squadId?: string | null; squadOrder?: number };
type LegacySquad = Squad & { leaderId?: string | null };

function migratePerson(raw: LegacyPerson): Person {
  const { squadId, squadOrder, ...person } = raw;
  if (person.memberships) return person;
  return { ...person, memberships: squadId ? [{ squadId, order: squadOrder ?? 0 }] : [] };
}

function migrateSquad(raw: LegacySquad): Squad {
  const { leaderId, ...squad } = raw;
  if (squad.leaderIds) return squad;
  return { ...squad, leaderIds: leaderId ? [leaderId] : [] };
}
