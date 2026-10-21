/**
 * Schemas de validação — fonte única das regras de formato dos dados.
 * São usados no servidor (rotas de API) e no cliente (formulários).
 */
import { z } from "zod";
import {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  ILLUSTRATIONS,
  INITIATIVE_STATUSES,
  METRIC_TARGET_STATES,
  METRIC_VALUE_STATES,
  PHASE_STATES,
  PLATFORM_ACCENTS,
  PLATFORM_ICONS,
  PRIORITIES,
  PROBLEM_VALIDATION,
  PROTOTYPE_STATUSES,
  QUARTERS,
  SOURCE_KINDS,
} from "@/lib/domain/constants";
import { DOCUMENT_EXTENSIONS, PROTOTYPE_EXTENSIONS, isHttpUrl, isSafeRepoPath } from "@/lib/validation/paths";

// Mensagens padrão de validação em português.
z.config(z.locales.pt());

export const INITIATIVE_ID_PATTERN = /^JG-2027-\d{3}$/;

const text = (max = 4000) => z.string().trim().max(max, `Use no máximo ${max} caracteres.`);
const required = (label: string, max = 4000) =>
  z.string().trim().min(1, `${label} é obrigatório.`).max(max, `Use no máximo ${max} caracteres.`);
const list = (max = 50) => z.array(text(1000)).max(max).default([]);
const isoDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Use o formato AAAA-MM-DD.")
  .default("");
const localId = z.string().trim().min(1).max(64);

export const milestoneSchema = z.object({
  id: localId,
  title: required("O nome do marco", 200),
  quarter: z.enum(QUARTERS),
  date: isoDate,
  done: z.boolean().default(false),
});

export const phaseSchema = z.object({
  id: localId,
  title: required("O nome da etapa", 120),
  state: z.enum(PHASE_STATES).default("pendente"),
});

export const versionEntrySchema = z.object({
  version: text(20),
  date: isoDate,
  note: text(500).default(""),
});

/** Valida a origem de um artefato: caminho no repositório OU URL externa. */
function refineSource(
  value: { source: (typeof SOURCE_KINDS)[number]; path: string; url: string },
  ctx: z.RefinementCtx,
  extensions: string[],
  what: string,
) {
  if (value.source === "repo" && !isSafeRepoPath(value.path, extensions)) {
    ctx.addIssue({
      code: "custom",
      path: ["path"],
      message: `Informe um caminho dentro de initiatives/ terminando em ${extensions.join(" ou ")} para o ${what}.`,
    });
  }
  if (value.source === "externo" && !isHttpUrl(value.url)) {
    ctx.addIssue({ code: "custom", path: ["url"], message: "Informe uma URL válida (https://…)." });
  }
}

export const documentRefSchema = z
  .object({
    id: localId,
    title: required("O título do documento", 200),
    kind: z.enum(DOCUMENT_KINDS),
    source: z.enum(SOURCE_KINDS),
    path: text(300).default(""),
    url: text(1000).default(""),
    version: text(20).default(""),
    status: z.enum(DOCUMENT_STATUSES),
    updatedAt: isoDate,
    versions: z.array(versionEntrySchema).max(100).default([]),
  })
  .superRefine((v, ctx) => refineSource(v, ctx, DOCUMENT_EXTENSIONS, "documento"));

export const prototypeRefSchema = z
  .object({
    id: localId,
    name: required("O nome do protótipo", 200),
    description: text(1000).default(""),
    source: z.enum(SOURCE_KINDS),
    path: text(300).default(""),
    url: text(1000).default(""),
    platformIds: z.array(localId).max(20).default([]),
    flows: list(),
    status: z.enum(PROTOTYPE_STATUSES),
  })
  .superRefine((v, ctx) => refineSource(v, ctx, PROTOTYPE_EXTENSIONS, "protótipo"));

export const metricSchema = z.object({
  id: localId,
  indicator: required("O indicador", 300),
  baseline: text(200).default(""),
  baselineState: z.enum(METRIC_VALUE_STATES).default("pendente"),
  target: text(200).default(""),
  targetState: z.enum(METRIC_TARGET_STATES).default("pendente"),
  method: text(1000).default(""),
  observed: text(200).default(""),
  lastEvaluatedAt: isoDate,
});

const imageId = z.string().regex(/^[a-f0-9-]{36}$/, "Imagem inválida.");

/** Imagem enviada pelo usuário: recorte final, original (para reeditar) e parâmetros do editor. */
export const customImageSchema = z.object({
  imageId,
  originalId: imageId,
  zoom: z.number().min(1).max(5).default(1),
  rotation: z.number().min(-360).max(360).default(0),
  flipX: z.boolean().default(false),
  flipY: z.boolean().default(false),
  x: z.number().min(-2).max(2).default(0),
  y: z.number().min(-2).max(2).default(0),
});

export const historyEntrySchema = z.object({
  id: localId,
  at: z.string(),
  description: text(500),
});

/** Campos editáveis de uma iniciativa (o que o formulário envia). */
export const initiativeInputSchema = z.object({
  // Identificação
  title: required("O nome", 160),
  summary: text(400).default(""),
  category: text(80).default(""),
  tags: z.array(text(40)).max(20).default([]),
  illustration: z.enum(ILLUSTRATIONS).nullable().default(null),
  /** Imagem própria; quando definida, tem prioridade sobre a ilustração da biblioteca. */
  customImage: customImageSchema.nullable().default(null),

  // Problema e motivação
  problem: required("O problema", 4000),
  currentContext: text().default(""),
  audience: text(1000).default(""),
  userPain: text().default(""),
  motivator: required("O motivador", 4000),
  evidence: list(),
  hypothesis: text().default(""),
  expectedOutcome: required("O resultado esperado", 2000),
  objectives: list(),
  deliverables: list(),

  // Planejamento
  quarter: z.enum(QUARTERS).nullable().default(null),
  priority: z.enum(PRIORITIES).nullable().default(null),
  status: z.enum(INITIATIVE_STATUSES, { error: "Selecione um status." }),
  planningValidated: z.boolean().default(false),
  owner: text(120).default(""),
  milestones: z.array(milestoneSchema).max(40).default([]),
  /** Etapas de progresso; o percentual exibido é derivado das etapas concluídas. */
  phases: z.array(phaseSchema).max(12).default([]),
  dependsOn: z.array(z.string().regex(INITIATIVE_ID_PATTERN)).max(30).default([]),
  relatedInitiativeIds: z.array(z.string().regex(INITIATIVE_ID_PATTERN)).max(30).default([]),
  risks: list(),
  pendingDecisions: list(),

  // Impacto
  platformIds: z.array(localId).max(20).default([]),
  /** Como a iniciativa afeta cada plataforma (texto curto por plataforma). */
  platformNotes: z.record(z.string(), text(200)).default({}),
  journeys: list(),
  userProfiles: list(),
  areas: list(),
  technicalDependencies: list(),
  operationalImpacts: list(),

  // Documentação e experiência
  documents: z.array(documentRefSchema).max(30).default([]),
  prototypes: z.array(prototypeRefSchema).max(30).default([]),

  // Métricas
  metrics: z.array(metricSchema).max(30).default([]),
});

export const initiativeSchema = initiativeInputSchema.extend({
  id: z.string().regex(INITIATIVE_ID_PATTERN),
  /** Pasta estável dos artefatos no repositório (não muda quando o título muda). */
  repoFolder: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(historyEntrySchema).default([]),
  /** Posição na coluna do roadmap (quarter); alterada ao arrastar os cards. Não faz parte do formulário. */
  roadmapOrder: z.number().int().min(0).default(0),
});

/** Alterações rápidas de planejamento (drawer e roadmap). */
export const planningPatchSchema = z
  .object({
    quarter: z.enum(QUARTERS).nullable(),
    priority: z.enum(PRIORITIES).nullable(),
    status: z.enum(INITIATIVE_STATUSES),
    planningValidated: z.boolean(),
    phases: z.array(phaseSchema).max(12),
  })
  .partial();

/** Mover um card no roadmap: coluna de destino e vizinho visível no ponto de inserção. */
export const roadmapMoveSchema = z.object({
  quarter: z.enum(QUARTERS).nullable(),
  beforeId: z.string().regex(INITIATIVE_ID_PATTERN).nullable().default(null),
  afterId: z.string().regex(INITIATIVE_ID_PATTERN).nullable().default(null),
});

export const platformInputSchema = z.object({
  name: required("O nome", 80),
  description: text(400).default(""),
  owner: text(120).default(""),
  icon: z.enum(PLATFORM_ICONS).default("layers"),
  accent: z.enum(PLATFORM_ACCENTS).default("indigo"),
});

export const platformSchema = platformInputSchema.extend({ id: localId });

/* ---------- Times & Squads ---------- */

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Informe um e-mail válido.")
  .default("");

/** Campos editáveis de um colaborador (o que o formulário envia). */
export const personInputSchema = z.object({
  name: required("O nome", 120),
  role: required("O cargo", 120),
  area: text(80).default(""),
  email: optionalEmail,
  location: text(120).default(""),
  /** Liderança direta cadastrada no organograma. */
  managerId: localId.nullable().default(null),
  /** Liderança direta fora do organograma (ex.: "CEO · Jovens Gênios"), usada quando managerId é nulo. */
  externalManager: text(160).default(""),
  /** Squads de que a pessoa participa (pode ser mais de um). */
  squadIds: z.array(localId).max(20).default([]),
  responsibilities: list(),
  photo: customImageSchema.nullable().default(null),
});

/** Participação em um squad, com a posição do card; alterada ao arrastar no organograma. */
export const membershipSchema = z.object({
  squadId: localId,
  order: z.number().int().min(0).default(0),
});

export const personSchema = personInputSchema.omit({ squadIds: true }).extend({
  id: localId,
  memberships: z.array(membershipSchema).default([]),
});

export const squadInputSchema = z.object({
  name: required("O nome", 80),
  description: text(400).default(""),
  icon: z.enum(PLATFORM_ICONS).default("layers"),
  accent: z.enum(PLATFORM_ACCENTS).default("indigo"),
  /** Pessoas a quem o squad responde, na ordem exibida acima do squad no organograma. */
  leaderIds: z.array(localId).max(10).default([]),
  /** Plataformas sob responsabilidade do squad (base das iniciativas relacionadas). */
  platformIds: z.array(localId).max(20).default([]),
});

export const squadSchema = squadInputSchema.extend({ id: localId });

/** Lugar do organograma: integrantes de um squad (null = sem squad) ou o topo (lideranças) de um grupo de squads. */
export const orgZoneSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("squad"), squadId: localId.nullable() }),
  z.object({ kind: z.literal("leaders"), squadIds: z.array(localId).min(1).max(50) }),
]);

/**
 * Realocar um colaborador: de onde sai (null = não sai de lugar nenhum), para onde vai e o
 * vizinho no ponto de inserção. Com `keep`, continua também na origem (participa dos dois).
 */
export const personMoveSchema = z.object({
  from: orgZoneSchema.nullable().default(null),
  to: orgZoneSchema,
  beforeId: localId.nullable().default(null),
  afterId: localId.nullable().default(null),
  keep: z.boolean().default(false),
});

/** Substituir um colaborador por outro (existente ou novo), transferindo squad, liderança e equipe. */
export const personReplaceSchema = z
  .object({
    substituteId: localId.nullable().default(null),
    newPerson: z.object({ name: required("O nome", 120), email: optionalEmail }).nullable().default(null),
    /** O substituto assume o cargo e as responsabilidades de quem sai. */
    takeRole: z.boolean().default(true),
    /** O que acontece com quem sai: fica no cadastro sem squad ou é removido. */
    outgoing: z.enum(["manter", "remover"]).default("manter"),
  })
  .refine((v) => !!v.substituteId !== !!v.newPerson, { message: "Escolha um colaborador ou cadastre um novo.", path: ["substituteId"] });

export const driverSchema = z.object({
  id: localId,
  title: required("O título", 120),
  description: required("A descrição", 600),
});

export const principleSchema = driverSchema;

export const structuralProblemSchema = z.object({
  id: localId,
  name: required("O nome", 160),
  description: required("A descrição", 2000),
  audience: text(600).default(""),
  evidence: list(),
  consequences: text(2000).default(""),
  relatedInitiativeIds: z.array(z.string().regex(INITIATIVE_ID_PATTERN)).max(30).default([]),
  validation: z.enum(PROBLEM_VALIDATION),
});

export const strategyContextSchema = z.object({
  intro: text(6000).default(""),
  drivers: z.array(driverSchema).max(12).default([]),
  principles: z.array(principleSchema).max(12).default([]),
  problems: z.array(structuralProblemSchema).max(60).default([]),
});

/** Corpo para criação/edição de um documento Markdown no repositório. */
export const documentContentSchema = z.object({
  path: z.string().refine((p) => isSafeRepoPath(p, DOCUMENT_EXTENSIONS), "Caminho de documento inválido."),
  content: z.string().max(500_000, "Documento muito grande."),
});

/** Converte erros do Zod em um mapa campo → mensagem, usado pelos formulários. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Pedido de download de imagem por link da web (editor de imagem). */
export const remoteImageRequestSchema = z.object({ url: z.string().trim().min(1).max(2048) });
