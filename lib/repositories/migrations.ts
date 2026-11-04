import { seedContext } from "@/data/seed/context";
import { ILLUSTRATIONS } from "@/lib/domain/constants";
import { inferDiscipline } from "@/lib/domain/org";
import { defaultRoadmapOrder } from "@/lib/domain/roadmap-order";
import type { Database, IllustrationKey, Person, Squad, StrategyContext } from "@/lib/domain/types";

export const SCHEMA_VERSION = 8;

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
 * v6 → v7: função no squad (discipline), sugerida a partir do cargo.
 * v7 → v8: contexto estratégico do Roadmap 2027 (proposta, direcionadores e indicadores por
 *          plataforma, acompanhamento). O texto e os direcionadores/princípios de demonstração
 *          são substituídos pelo conteúdo oficial; os problemas estruturais são mantidos.
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
    db: {
      ...db,
      schemaVersion: SCHEMA_VERSION,
      initiatives,
      context: migrateContext(db.context),
      people: (db.people ?? []).map(migratePerson),
      squads: (db.squads ?? []).map(migrateSquad),
    },
    changed: true,
  };
}

type LegacyPerson = Person & { squadId?: string | null; squadOrder?: number };
type LegacySquad = Squad & { leaderId?: string | null };

function migratePerson(raw: LegacyPerson): Person {
  const { squadId, squadOrder, ...person } = raw;
  const discipline = person.discipline === undefined ? inferDiscipline(person.role ?? "") : person.discipline;
  if (person.memberships) return { ...person, discipline };
  return { ...person, discipline, memberships: squadId ? [{ squadId, order: squadOrder ?? 0 }] : [] };
}

function migrateSquad(raw: LegacySquad): Squad {
  const { leaderId, ...squad } = raw;
  if (squad.leaderIds) return squad;
  return { ...squad, leaderIds: leaderId ? [leaderId] : [] };
}

type LegacyContext = Partial<StrategyContext> & { drivers?: unknown; principles?: unknown };

/** Detecta o formato pela presença dos campos (o Postgres normaliza a cada leitura). */
function migrateContext(raw: LegacyContext | undefined): StrategyContext {
  const { drivers: _drivers, principles: _principles, ...context } = raw ?? {};
  if (context.proposal) {
    return {
      ...context,
      intro: context.intro ?? "",
      proposal: context.proposal,
      platformsIntro: context.platformsIntro ?? "",
      platformStrategies: context.platformStrategies ?? [],
      measurement: context.measurement ?? "",
      problems: context.problems ?? [],
    };
  }
  return { ...seedContext, problems: context.problems ?? seedContext.problems };
}
