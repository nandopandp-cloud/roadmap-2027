/**
 * Schemas de validação — fonte única das regras de formato dos dados.
 * São usados no servidor (rotas de API) e no cliente (formulários).
 */
import { z } from "zod";
import {
  CONTEXT_ARTS,
  DISCIPLINES,
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
import { parseGithubBranch, parseGithubRepo, sameGithubRepo } from "@/lib/domain/github";
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

const documentRefFields = {
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
};

export const documentRefSchema = z
  .object(documentRefFields)
  .superRefine((v, ctx) => refineSource(v, ctx, DOCUMENT_EXTENSIONS, "documento"));

/**
 * Documento como enviado pelo formulário: além da referência, pode trazer o texto
 * escrito ou colado (`content`). O servidor grava esse texto como Markdown na pasta
 * da iniciativa e guarda só a referência — `content` nunca é persistido na iniciativa.
 */
export const documentDraftSchema = z
  .object({ ...documentRefFields, content: z.string().max(500_000, "Documento muito grande.").optional() })
  .superRefine((v, ctx) => {
    if (v.content === undefined) return refineSource(v, ctx, DOCUMENT_EXTENSIONS, "documento");
    if (!v.content.trim()) ctx.addIssue({ code: "custom", path: ["content"], message: "Escreva ou cole o texto do documento." });
    // Sem caminho, o servidor escolhe um nome livre na pasta da iniciativa.
    if (v.path && !isSafeRepoPath(v.path, DOCUMENT_EXTENSIONS))
      ctx.addIssue({ code: "custom", path: ["path"], message: "Caminho de arquivo inválido." });
  });

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

/** Branch do projeto no GitHub (https://github.com/<org>/<repo>/tree/<branch>). */
export const repositoryBranchSchema = z.object({
  id: localId,
  url: required("O link da branch", 500),
});

/**
 * Repositório do GitHub vinculado à iniciativa: link do repositório e as branches
 * do projeto nele (nenhuma, uma ou várias).
 */
export const repositoryLinkSchema = z
  .object({
    id: localId,
    url: required("O link do repositório", 300),
    branches: z.array(repositoryBranchSchema).max(20, "Vincule no máximo 20 branches por repositório.").default([]),
    note: text(200).default(""),
  })
  .superRefine((v, ctx) => {
    const repo = parseGithubRepo(v.url);
    if (!repo) {
      ctx.addIssue({ code: "custom", path: ["url"], message: "Informe o link de um repositório do GitHub (https://github.com/organização/repositório)." });
      return;
    }
    const seen: string[] = [];
    v.branches.forEach((b, idx) => {
      const path = ["branches", idx, "url"];
      const branch = parseGithubBranch(b.url);
      if (!branch) ctx.addIssue({ code: "custom", path, message: "Informe o link da branch (https://github.com/organização/repositório/tree/branch)." });
      else if (!sameGithubRepo(repo, branch)) ctx.addIssue({ code: "custom", path, message: `A branch precisa ser do repositório ${repo.owner}/${repo.repo}.` });
      else if (seen.includes(branch.branch)) ctx.addIssue({ code: "custom", path, message: `A branch ${branch.branch} já foi informada.` });
      else seen.push(branch.branch);
    });
  });

export const historyEntrySchema = z.object({
  id: localId,
  at: z.string(),
  description: text(500),
});

/** Campos editáveis de uma iniciativa (o que o formulário envia), sem as regras de preenchimento. */
const initiativeFieldsSchema = z.object({
  // Identificação
  title: required("O nome", 160),
  summary: text(400).default(""),
  /**
   * Iniciativa "em breve": sinalizada só com nome e descrição para avisar que será considerada.
   * Enquanto marcada, problema, motivador e resultado esperado não são exigidos.
   */
  upcoming: z.boolean().default(false),
  category: text(80).default(""),
  tags: z.array(text(40)).max(20).default([]),
  illustration: z.enum(ILLUSTRATIONS).nullable().default(null),
  /** Imagem própria; quando definida, tem prioridade sobre a ilustração da biblioteca. */
  customImage: customImageSchema.nullable().default(null),

  // Problema e motivação
  problem: text().default(""),
  currentContext: text().default(""),
  audience: text(1000).default(""),
  userPain: text().default(""),
  motivator: text().default(""),
  evidence: list(),
  hypothesis: text().default(""),
  expectedOutcome: text(2000).default(""),
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
  documents: z.array(documentDraftSchema).max(30).default([]),
  prototypes: z.array(prototypeRefSchema).max(30).default([]),

  // Métricas
  metrics: z.array(metricSchema).max(30).default([]),
});

/** Campos exigidos de toda iniciativa que não está marcada como "em breve". */
const COMPLETE_FIELDS = [
  ["problem", "O problema"],
  ["motivator", "O motivador"],
  ["expectedOutcome", "O resultado esperado"],
] as const;

/** Iniciativa como enviada pelo formulário: cadastro completo, salvo se marcada como "em breve". */
export const initiativeInputSchema = COMPLETE_FIELDS.reduce(
  (schema, [field, label]) =>
    schema.refine((v) => v.upcoming || !!v[field]?.trim(), {
      path: [field],
      message: `${label} é obrigatório.`,
      // Avalia mesmo quando outros campos têm erro, para mostrar todas as pendências de uma vez.
      when: (payload) => typeof payload.value === "object" && payload.value !== null,
    }),
  initiativeFieldsSchema,
);

/** Sinalizar uma iniciativa "em breve": só nome e descrição. */
export const upcomingInitiativeSchema = z.object({
  title: required("O nome", 160),
  summary: text(400).default(""),
});

export const initiativeSchema = initiativeFieldsSchema.extend({
  documents: z.array(documentRefSchema).max(30).default([]),
  id: z.string().regex(INITIATIVE_ID_PATTERN),
  /** Pasta estável dos artefatos no repositório (não muda quando o título muda). */
  repoFolder: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  history: z.array(historyEntrySchema).default([]),
  /** Repositórios do GitHub (editados na aba Repositório do drawer, não no formulário). */
  repositories: z.array(repositoryLinkSchema).max(10).default([]),
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
    repositories: z
      .array(repositoryLinkSchema)
      .max(10, "Vincule no máximo 10 repositórios.")
      .superRefine((list, ctx) => {
        const repos = list.map((r) => parseGithubRepo(r.url));
        repos.forEach((repo, idx) => {
          if (repo && repos.slice(0, idx).some((other) => other && sameGithubRepo(other, repo)))
            ctx.addIssue({ code: "custom", path: [idx, "url"], message: `O repositório ${repo.owner}/${repo.repo} já está vinculado.` });
        });
      }),
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
  /** Função no squad (Produto, Design, Engenharia, QA); null quando não se aplica. */
  discipline: z.enum(DISCIPLINES).nullable().default(null),
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

/** Seção narrativa da proposta do roadmap (texto em Markdown, preservado como fornecido). */
const contextArt = z.union([z.enum(CONTEXT_ARTS), z.literal("")]).default("");

/** Etapa de um ciclo exibida em cartões (ex.: planejar → entregar → revisar). */
export const proposalStepSchema = z.object({
  id: localId,
  title: required("O título da etapa", 80),
  description: text(200).default(""),
});

/** Seção narrativa da proposta: resumo em destaque + texto original completo (Markdown). */
export const proposalSectionSchema = z.object({
  id: localId,
  title: required("O título", 160),
  subtitle: text(200).default(""),
  /** Versão curta exibida na página (Markdown). */
  summary: text(3000).default(""),
  steps: z.array(proposalStepSchema).max(6).default([]),
  illustration: contextArt,
  /** Texto completo, preservado como fornecido. */
  body: required("O texto", 20000),
  /** Frase de fechamento destacada. */
  highlight: text(600).default(""),
});

/** Faixa de compromisso exibida ao final das abas do Contexto. */
export const commitmentSchema = z.object({
  title: text(160).default(""),
  summary: text(600).default(""),
  body: text(20000).default(""),
});

/** Número de referência de uma plataforma, como informado pelo time (nada é calculado). */
export const platformIndicatorSchema = z.object({
  id: localId,
  label: required("O indicador", 120),
  value: required("O valor", 60),
  detail: text(300).default(""),
  /** Exibido no resumo da plataforma. */
  featured: z.boolean().default(false),
});

/** Meta de uma plataforma: valor atual → valor desejado, com situação explícita. */
export const platformGoalSchema = z.object({
  id: localId,
  label: required("O indicador", 160),
  current: text(60).default(""),
  target: required("A meta", 60),
  detail: text(300).default(""),
  state: z.enum(METRIC_TARGET_STATES).default("proposta"),
  /** Variação em destaque (ex.: "+227%") e sua legenda, como informadas. */
  change: text(20).default(""),
  changeLabel: text(80).default(""),
  featured: z.boolean().default(false),
});

/** Direcionador estratégico de uma plataforma para o ciclo (o "porquê" e os indicadores). */
export const platformStrategySchema = z.object({
  id: localId,
  platformId: required("A plataforma", 64),
  focus: required("O direcionador", 120),
  statement: text(300).default(""),
  /** Descrição curta exibida no resumo da plataforma. */
  summary: text(300).default(""),
  illustration: contextArt,
  narrative: text(20000).default(""),
  indicators: z.array(platformIndicatorSchema).max(16).default([]),
  goals: z.array(platformGoalSchema).max(12).default([]),
  outcomes: list(20),
  /** Principais resultados (versão curta) exibidos no resumo. */
  keyOutcomes: list(6),
  closing: text(2000).default(""),
});

export const strategyContextSchema = z.object({
  introTitle: text(200).default(""),
  introSummary: text(1500).default(""),
  intro: text(6000).default(""),
  proposal: z.array(proposalSectionSchema).max(20).default([]),
  commitment: commitmentSchema.default({ title: "", summary: "", body: "" }),
  platformsSummary: text(600).default(""),
  platformsIntro: text(4000).default(""),
  platformStrategies: z.array(platformStrategySchema).max(12).default([]),
  /** "Como saberemos se estamos evoluindo?" (Markdown). */
  measurement: text(8000).default(""),
  problems: z.array(structuralProblemSchema).max(60).default([]),
});

/** Corpo para criação/edição de um documento Markdown no repositório. */
export const documentContentSchema = z.object({
  path: z.string().refine((p) => isSafeRepoPath(p, DOCUMENT_EXTENSIONS), "Caminho de documento inválido."),
  content: z.string().max(500_000, "Documento muito grande."),
});

/** Texto completo de um PRD usado para criar uma iniciativa (preservado como prd.md). */
const prdText = z
  .string()
  .trim()
  .min(200, "Cole o texto completo do PRD (mínimo de 200 caracteres).")
  .max(500_000, "Documento muito grande.");

/** Análise de um PRD: devolve os campos da iniciativa identificados no texto. */
export const prdAnalysisSchema = z.object({ content: prdText });

/** Criação de iniciativa a partir de um PRD: campos revisados + texto original do PRD. */
export const initiativeFromPrdSchema = z.object({ initiative: z.unknown(), prd: prdText });

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
