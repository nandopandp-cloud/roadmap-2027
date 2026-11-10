import { seedContext } from "@/data/seed/context";
import { seedRoadmap2026 } from "@/data/seed/roadmap-2026";
import { ILLUSTRATIONS } from "@/lib/domain/constants";
import { inferDiscipline } from "@/lib/domain/org";
import { importedItem } from "@/lib/domain/roadmap-2026";
import { defaultRoadmapOrder } from "@/lib/domain/roadmap-order";
import type { Database, IllustrationKey, Person, PlatformStrategy, ProposalSection, RepositoryLink, Roadmap2026Item, Squad, StrategyContext } from "@/lib/domain/types";

export const SCHEMA_VERSION = 15;

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
 * v8 → v9: Contexto com resumos visuais (títulos e resumos curtos, etapas, ilustrações,
 *          destaques numéricos, principais resultados) e faixa de compromisso — a seção
 *          "compromisso-2027" da proposta passa a ser `commitment`. Edições são preservadas.
 * v9 → v10: repositórios do GitHub vinculados à iniciativa (repositories), vazios até o time cadastrar.
 * v10 → v11: várias branches por repositório (branchUrl → branches).
 * v11 → v12: iniciativas "em breve" (upcoming), sinalizadas só com nome e descrição.
 * v12 → v13: esforço estimado de Design e Engenharia (effort), vazio até os responsáveis estimarem.
 * v13 → v14: justificativa do esforço (effortEvidence): anexos de cada frente, vazios até serem enviados.
 * v14 → v15: Roadmap 2026 editável (roadmap2026), importado da planilha do time (data/seed/roadmap-2026.ts)
 *            com status inicial lido das cores. No Postgres a importação é feita uma vez na tabela
 *            roadmap_2026 (ver postgres-repository.ts).
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
      repositories: (raw.repositories ?? []).map(migrateRepository),
      upcoming: raw.upcoming ?? false,
      effort: raw.effort ?? { design: null, engineering: null },
      effortEvidence: raw.effortEvidence ?? { design: [], engineering: [] },
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
      roadmap2026: db.roadmap2026 ?? importedRoadmap2026(),
    },
    changed: true,
  };
}

/** Iniciativas do Roadmap 2026 como importadas da planilha. */
export function importedRoadmap2026(): Roadmap2026Item[] {
  return seedRoadmap2026.items.map(importedItem);
}

type LegacyRepository = Omit<RepositoryLink, "branches"> & { branches?: RepositoryLink["branches"]; branchUrl?: string };

function migrateRepository(raw: LegacyRepository): RepositoryLink {
  const { branchUrl, ...repo } = raw;
  if (repo.branches) return repo as RepositoryLink;
  return { ...repo, branches: branchUrl ? [{ id: `${repo.id}-b1`, url: branchUrl }] : [] };
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
type LegacySection = Partial<ProposalSection> & Pick<ProposalSection, "id" | "title" | "body">;
type LegacyStrategy = Partial<PlatformStrategy> & Pick<PlatformStrategy, "id" | "platformId" | "focus">;

const COMMITMENT_SECTION_ID = "compromisso-2027";

/** Completa linhas antigas com os campos novos do seed (mesmo id), sem sobrescrever o que existe. */
function mergeRows<T extends { id: string }>(rows: Partial<T>[], seedRows: T[], defaults: Omit<T, "id">): T[] {
  return rows.map((r) => ({ ...defaults, ...seedRows.find((x) => x.id === r.id), ...r }) as T);
}

/** Detecta o formato pela presença dos campos (o Postgres normaliza a cada leitura). */
function migrateContext(raw: LegacyContext | undefined): StrategyContext {
  const { drivers: _drivers, principles: _principles, ...context } = raw ?? {};
  // Antes da v8: conteúdo de demonstração → contexto oficial (mantendo os problemas estruturais).
  if (!context.proposal) return { ...seedContext, problems: context.problems ?? seedContext.problems };
  if (context.commitment) return context as StrategyContext;

  // v8 → v9.
  const sections = context.proposal as LegacySection[];
  const legacyCommitment = sections.find((s) => s.id === COMMITMENT_SECTION_ID);
  const proposal = sections
    .filter((s) => s.id !== COMMITMENT_SECTION_ID)
    .map((s) => {
      const seed = seedContext.proposal.find((x) => x.id === s.id);
      // Título e subtítulo da seção de planejamento foram invertidos na v9; só ajusta se não foram editados.
      const swapped = s.id === "novo-modelo-de-planejamento" && s.title === "Um novo modelo de planejamento e execução" && seed ? { title: seed.title, subtitle: seed.subtitle } : {};
      return { subtitle: "", summary: "", steps: [], illustration: "" as const, highlight: "", ...seed, ...s, ...swapped };
    });
  const commitment = legacyCommitment
    ? {
        title: legacyCommitment.title,
        summary: seedContext.commitment.summary,
        body: [legacyCommitment.body, legacyCommitment.highlight ? `**${legacyCommitment.highlight}**` : ""].filter(Boolean).join("\n\n"),
      }
    : seedContext.commitment;
  const platformStrategies = ((context.platformStrategies ?? []) as LegacyStrategy[]).map((s) => {
    const seed = seedContext.platformStrategies.find((x) => x.id === s.id);
    if (s.keyOutcomes) return s as PlatformStrategy;
    const indicators = mergeRows(s.indicators ?? [], seed?.indicators ?? [], { label: "", value: "", detail: "", featured: false });
    const goals = mergeRows(s.goals ?? [], seed?.goals ?? [], { label: "", current: "", target: "", detail: "", state: "proposta", change: "", changeLabel: "", featured: false });
    const added = (seed?.indicators ?? []).filter((x) => !indicators.some((i) => i.id === x.id));
    return {
      statement: "",
      narrative: "",
      outcomes: [],
      closing: "",
      summary: seed?.summary ?? "",
      illustration: seed?.illustration ?? "",
      keyOutcomes: seed?.keyOutcomes ?? [],
      ...s,
      indicators: [...indicators.filter((i) => i.featured), ...added.filter((i) => i.featured), ...indicators.filter((i) => !i.featured), ...added.filter((i) => !i.featured)],
      goals,
    } as PlatformStrategy;
  });
  return {
    ...context,
    introTitle: context.introTitle ?? seedContext.introTitle,
    introSummary: context.introSummary ?? seedContext.introSummary,
    intro: context.intro ?? "",
    proposal,
    commitment,
    platformsSummary: context.platformsSummary ?? seedContext.platformsSummary,
    platformsIntro: context.platformsIntro ?? "",
    platformStrategies,
    measurement: context.measurement ?? "",
    problems: context.problems ?? [],
  };
}
