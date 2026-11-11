/**
 * Schemas de validação — fonte única das regras de formato dos dados.
 * São usados no servidor (rotas de API) e no cliente (formulários).
 */
import { z } from "zod";
import {
  CONTEXT_ARTS,
  DISCIPLINES,
  EFFORT_START_MODES,
  EFFORT_TRACKS,
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
  ROADMAP_2026_PHASES,
  ROADMAP_2026_STATUSES,
  ROADMAP_2026_TRACK_STATUSES,
  ROADMAP_2026_WAVES,
  ROADMAP_2026_WEEK_COUNT,
  ROADMAP_2026_WORK,
  SOURCE_KINDS,
} from "@/lib/domain/constants";
import { parseGithubBranch, parseGithubRepo, sameGithubRepo } from "@/lib/domain/github";
import { DOCUMENT_EXTENSIONS, PROTOTYPE_EXTENSIONS, isHttpUrl, isSafeRepoPath } from "@/lib/validation/paths";
import { ATTACHMENT_MAX_BYTES, ATTACHMENT_MAX_PARTS, ATTACHMENTS_PER_TRACK, attachmentTypeOf } from "@/lib/domain/effort-attachments";

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

/** Esforço estimado de uma frente (Design ou Engenharia), informado pelo responsável. */
export const effortEstimateSchema = z
  .object({
    weeks: z
      .number({ error: "Informe as semanas de esforço." })
      .min(0.5, "Informe ao menos meia semana.")
      .max(52, "Use no máximo 52 semanas.")
      .refine((v) => Number.isInteger(v * 2), "Use semanas inteiras ou meias (ex.: 2,5)."),
    startMode: z.enum(EFFORT_START_MODES).default("auto"),
    /** Só quando startMode = "date". */
    startDate: isoDate,
    /** Responsável (colaborador do organograma); null = a definir. */
    ownerId: localId.nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.startMode === "date" && !v.startDate) ctx.addIssue({ code: "custom", path: ["startDate"], message: "Informe a data de início." });
  })
  .transform((v) => ({ ...v, startDate: v.startMode === "date" ? v.startDate : "" }));

export const initiativeEffortSchema = z.object({
  design: effortEstimateSchema.nullable().default(null),
  engineering: effortEstimateSchema.nullable().default(null),
});

const attachmentId = z.string().regex(/^[a-f0-9-]{36}$/, "Identificador inválido.");
const attachmentName = z.string().trim().min(1, "Informe o nome.").max(200, "Nome longo demais (máximo de 200 caracteres).");
const attachmentUrl = z
  .string()
  .trim()
  .max(2000, "Link longo demais.")
  .refine((v) => isHttpUrl(v), "Informe um link começando com https://.");

/** Anexo da justificativa de uma frente de esforço: arquivo enviado ou link (Figma, Google Docs…). */
export const effortAttachmentSchema = z.discriminatedUnion("kind", [
  z.object({
    id: attachmentId,
    kind: z.literal("file"),
    name: attachmentName,
    size: z.number().int().min(1).max(ATTACHMENT_MAX_BYTES),
    addedBy: z.string().max(200).default(""),
    addedAt: z.string(),
  }),
  z.object({
    id: attachmentId,
    kind: z.literal("link"),
    name: attachmentName,
    url: attachmentUrl,
    addedBy: z.string().max(200).default(""),
    addedAt: z.string(),
  }),
]);

/** Justificativa do esforço: anexos de cada frente, separados. */
export const effortEvidenceSchema = z.object({
  design: z.array(effortAttachmentSchema).max(ATTACHMENTS_PER_TRACK).default([]),
  engineering: z.array(effortAttachmentSchema).max(ATTACHMENTS_PER_TRACK).default([]),
});

/** Novo anexo: link, ou arquivo já enviado em partes (uploadId). */
export const effortAttachmentInputSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("link"), track: z.enum(EFFORT_TRACKS), url: attachmentUrl }),
  z.object({
    kind: z.literal("file"),
    track: z.enum(EFFORT_TRACKS),
    name: attachmentName.refine((v) => !!attachmentTypeOf(v), "Tipo de arquivo não aceito. Envie imagem, PDF, documento, planilha ou apresentação."),
    size: z.number().int().min(1, "O arquivo está vazio.").max(ATTACHMENT_MAX_BYTES, "O arquivo passa de 10 MB."),
    uploadId: attachmentId,
    parts: z.number().int().min(1).max(ATTACHMENT_MAX_PARTS),
  }),
]);

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
  /** Semanas de esforço de Design e Engenharia (editadas no Gantt e na aba Roadmap). */
  effort: initiativeEffortSchema.default({ design: null, engineering: null }),
  /** Justificativa do esforço: arquivos e links de cada frente (anexados na janela de esforço). */
  effortEvidence: effortEvidenceSchema.default({ design: [], engineering: [] }),
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

/* ---------- Roadmap 2026 ---------- */

/**
 * Importação da planilha (data/seed/roadmap-2026.ts): semanas seguidas na mesma cor.
 * `start` é o índice da semana (0 = S1 de julho/2026).
 */
export const roadmap2026SegmentSchema = z
  .object({
    phase: z.enum(ROADMAP_2026_PHASES),
    start: z.number().int().min(0).max(ROADMAP_2026_WEEK_COUNT - 1),
    weeks: z.number().int().min(1).max(ROADMAP_2026_WEEK_COUNT),
  })
  .refine((s) => s.start + s.weeks <= ROADMAP_2026_WEEK_COUNT, "A fase passa de abril/2027.");

/** Linha da planilha como importada: textos de Design, Engenheiro e QA mantidos como escritos. */
export const roadmap2026ImportItemSchema = z.object({
  id: z.string().regex(/^R26-\d{3}$/),
  title: required("O nome", 200),
  /** Squad como escrito na planilha (Exploradores, Educadores, Geniex, Famílias, Transversais, LMS). */
  squad: required("O squad", 80),
  /** Plataforma correspondente ao squad; null para "Transversais". */
  platformId: localId.nullable(),
  wave: z.enum(ROADMAP_2026_WAVES).nullable(),
  /** "Qtd Semana" da planilha (preenchida só em parte das linhas). */
  weeks: z.number().positive().max(52).nullable(),
  design: text(120),
  engineering: text(120),
  qa: text(120),
  /** Status "Backlog" na planilha. */
  backlog: z.boolean(),
  /** Etapa de engenharia "ENG. PRECIFICAR". */
  pricing: z.boolean(),
  segments: z.array(roadmap2026SegmentSchema).max(ROADMAP_2026_WEEK_COUNT),
});

export const roadmap2026SourceSchema = z.object({ title: text(200), sheet: text(120), url: z.string().refine(isHttpUrl), importedAt: isoDate });

export const roadmap2026ImportSchema = z.object({
  source: roadmap2026SourceSchema,
  items: z.array(roadmap2026ImportItemSchema).max(500),
});

/** Sequência de semanas de um tipo de trabalho (Design, Engenharia, QA ou não informado). */
export const roadmap2026WorkSchema = z
  .object({
    id: localId,
    work: z.enum(ROADMAP_2026_WORK),
    start: z.number().int().min(0, "O início fica antes de julho/2026.").max(ROADMAP_2026_WEEK_COUNT - 1),
    weeks: z.number().int().min(1, "Use ao menos uma semana.").max(ROADMAP_2026_WEEK_COUNT),
  })
  .refine((s) => s.start + s.weeks <= ROADMAP_2026_WEEK_COUNT, { message: "A fase passa de abril/2027, o fim do Roadmap 2026.", path: ["weeks"] });

/**
 * Campos que a interface altera em uma iniciativa do Roadmap 2026. Sem `.default()`: no Zod 4 o
 * padrão vale também para campos ausentes de um `.partial()`, e a alteração parcial apagaria
 * o que não foi enviado.
 */
const ownerIds = z.array(localId).max(10, "Escolha no máximo 10 pessoas por frente.");

/** Responsáveis por frente: colaboradores de Times & Squads (ids). */
export const roadmap2026OwnersSchema = z.object({ design: ownerIds, engineering: ownerIds, qa: ownerIds });

/** Andamento de Design e de Engenharia, separado do status geral. */
export const roadmap2026TrackStatusSchema = z.object({
  design: z.enum(ROADMAP_2026_TRACK_STATUSES),
  engineering: z.enum(ROADMAP_2026_TRACK_STATUSES),
});

const roadmap2026EditableFields = {
  title: required("O nome", 200),
  subtitle: text(200),
  platformId: localId.nullable(),
  owners: roadmap2026OwnersSchema,
  trackStatus: roadmap2026TrackStatusSchema,
  backlog: z.boolean(),
  status: z.enum(ROADMAP_2026_STATUSES),
  segments: z.array(roadmap2026WorkSchema).max(ROADMAP_2026_WEEK_COUNT),
};

/** Iniciativa do Roadmap 2026 gravada no banco (nasce da importação da planilha). */
export const roadmap2026ItemSchema = z.object({
  id: z.string().regex(/^R26-\d{3}$/),
  ...roadmap2026EditableFields,
  /** Squad exibido: nome da plataforma ou "Transversais" (texto da planilha na importação). */
  squad: required("O squad", 80),
  /**
   * Design, Engenheiro e QA como escritos na planilha ("Concluído", "Andamento - Renan"…).
   * Só referência: quem responde pela iniciativa fica em `owners`.
   */
  design: text(120),
  engineering: text(120),
  qa: text(120),
  /** "Qtd Semana" e "ENG. PRECIFICAR" da planilha, mantidos como referência. */
  weeks: z.number().positive().max(52).nullable(),
  pricing: z.boolean(),
  history: z.array(historyEntrySchema).max(500),
});

/** Nova posição de uma iniciativa do 2026 no Gantt: antes de `beforeId` ou depois de `afterId`. */
export const roadmap2026MoveSchema = z
  .object({
    beforeId: z.string().regex(/^R26-\d{3}$/).nullable().default(null),
    afterId: z.string().regex(/^R26-\d{3}$/).nullable().default(null),
  })
  .refine((v) => !!v.beforeId !== !!v.afterId, "Informe a iniciativa vizinha.");

/** Alteração de uma iniciativa do Roadmap 2026: só os campos enviados mudam (o Gantt envia só as semanas). */
export const roadmap2026PatchSchema = z.object(roadmap2026EditableFields).partial();

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
