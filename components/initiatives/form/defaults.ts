import { defaultPhases } from "@/lib/domain/progress";
import type { DocumentRef, Initiative, InitiativeInput, Metric, Milestone, Phase, PrototypeRef } from "@/lib/domain/types";

export const FORM_STEPS = [
  { key: "identificacao", label: "Identificação", hint: "Nome, resumo e classificação" },
  { key: "problema", label: "Problema e motivação", hint: "Por que esta iniciativa existe" },
  { key: "impacto", label: "Impacto e plataformas", hint: "Quem e o que é afetado" },
  { key: "planejamento", label: "Planejamento", hint: "Status, quarter e marcos" },
  { key: "documentacao", label: "Documentação e protótipo", hint: "PRDs e experiências navegáveis" },
  { key: "metricas", label: "Métricas e dependências", hint: "Sucesso, riscos e relações" },
] as const;

/** Em qual etapa cada campo vive (para levar o usuário ao primeiro erro). */
const FIELD_STEP: Record<string, number> = {
  title: 0, summary: 0, category: 0, tags: 0, illustration: 0, customImage: 0,
  problem: 1, currentContext: 1, audience: 1, userPain: 1, motivator: 1, evidence: 1, hypothesis: 1, expectedOutcome: 1, objectives: 1, deliverables: 1,
  platformIds: 2, platformNotes: 2, journeys: 2, userProfiles: 2, areas: 2, operationalImpacts: 2,
  status: 3, quarter: 3, priority: 3, planningValidated: 3, owner: 3, milestones: 3, phases: 3,
  documents: 4, prototypes: 4,
  metrics: 5, dependsOn: 5, relatedInitiativeIds: 5, technicalDependencies: 5, risks: 5, pendingDecisions: 5,
};

export function stepForField(path: string): number {
  return FIELD_STEP[path.split(".")[0]] ?? 0;
}

export const emptyInput = (): InitiativeInput => ({
  title: "",
  summary: "",
  category: "",
  tags: [],
  illustration: null,
  customImage: null,
  problem: "",
  currentContext: "",
  audience: "",
  userPain: "",
  motivator: "",
  evidence: [],
  hypothesis: "",
  expectedOutcome: "",
  objectives: [],
  deliverables: [],
  quarter: null,
  priority: null,
  status: "ideia",
  planningValidated: false,
  owner: "",
  milestones: [],
  phases: defaultPhases(),
  dependsOn: [],
  relatedInitiativeIds: [],
  risks: [],
  pendingDecisions: [],
  platformIds: [],
  platformNotes: {},
  journeys: [],
  userProfiles: [],
  areas: [],
  technicalDependencies: [],
  operationalImpacts: [],
  documents: [],
  prototypes: [],
  metrics: [],
});

/** Extrai apenas os campos editáveis de uma iniciativa existente. */
export function toInput(i: Initiative): InitiativeInput {
  const { id: _id, repoFolder: _f, createdAt: _c, updatedAt: _u, history: _h, ...input } = i;
  return structuredClone(input);
}

const localId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

export const newMilestone = (quarter: Milestone["quarter"] = "Q1"): Milestone => ({
  id: localId("m"),
  title: "",
  quarter,
  date: "",
  done: false,
});

export const newPhase = (): Phase => ({ id: localId("fase"), title: "", state: "pendente" });

export const newDocument = (folder?: string, hasPrd?: boolean): DocumentRef => ({
  id: localId("doc"),
  title: "",
  kind: hasPrd ? "outro" : "prd",
  source: "repo",
  path: folder ? `${folder}/${hasPrd ? "documento" : "prd"}.md` : "",
  url: "",
  version: "",
  status: "rascunho",
  updatedAt: new Date().toISOString().slice(0, 10),
  versions: [],
});

export const newPrototype = (folder?: string): PrototypeRef => ({
  id: localId("proto"),
  name: "",
  description: "",
  source: "repo",
  path: folder ? `${folder}/prototype/index.html` : "",
  url: "",
  platformIds: [],
  flows: [],
  status: "conceito",
});

export const newMetric = (): Metric => ({
  id: localId("met"),
  indicator: "",
  baseline: "",
  baselineState: "pendente",
  target: "",
  targetState: "pendente",
  method: "",
  observed: "",
  lastEvaluatedAt: "",
});

const LIST_FIELDS = [
  "tags", "evidence", "objectives", "deliverables", "risks", "pendingDecisions", "journeys", "userProfiles", "areas", "technicalDependencies", "operationalImpacts",
] as const;

/** Remove itens vazios de listas antes de validar/enviar. */
export function cleanInput(input: InitiativeInput): InitiativeInput {
  const out = structuredClone(input);
  for (const key of LIST_FIELDS) out[key] = out[key].map((s) => s.trim()).filter(Boolean);
  out.prototypes = out.prototypes.map((p) => ({ ...p, flows: p.flows.map((f) => f.trim()).filter(Boolean) }));
  return out;
}
