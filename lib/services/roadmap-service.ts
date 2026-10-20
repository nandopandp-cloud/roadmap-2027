import "server-only";
import type { z } from "zod";
import type { Database, Initiative, InitiativeInput, Platform, StrategyContext } from "@/lib/domain/types";
import { QUARTER_LABEL } from "@/lib/domain/labels";
import { nextRoadmapOrder, placeInColumn, roadmapColumn } from "@/lib/domain/roadmap-order";
import { getRepository, storageKind, type StorageKind } from "@/lib/repositories";
import { DomainError, notFound } from "@/lib/services/errors";
import { describeChanges, historyEntry } from "@/lib/services/history";
import { initiativeFolder, slugify } from "@/lib/validation/paths";
import {
  fieldErrors,
  initiativeInputSchema,
  planningPatchSchema,
  platformInputSchema,
  roadmapMoveSchema,
  strategyContextSchema,
} from "@/lib/validation/schemas";

/** Snapshot exposto ao cliente. */
export type Snapshot = Omit<Database, "schemaVersion"> & { writable: boolean; storage: StorageKind };

function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new DomainError(422, "Revise os campos destacados.", fieldErrors(result.error));
  }
  return result.data;
}

const normalizeTitle = (title: string) => slugify(title);

function nextInitiativeId(db: Database): string {
  const max = db.initiatives.reduce((acc, i) => Math.max(acc, Number(i.id.slice(-3)) || 0), 0);
  return `JG-2027-${String(max + 1).padStart(3, "0")}`;
}

/** Garante integridade dos relacionamentos antes de gravar. */
function assertReferences(db: Database, input: InitiativeInput, selfId?: string) {
  const ids = new Set(db.initiatives.map((i) => i.id));
  const platformIds = new Set(db.platforms.map((p) => p.id));
  const fields: Record<string, string> = {};

  const badDep = input.dependsOn.find((d) => d === selfId || !ids.has(d));
  if (badDep) fields.dependsOn = badDep === selfId ? "Uma iniciativa não pode depender de si mesma." : `Iniciativa ${badDep} não existe.`;
  const badRel = input.relatedInitiativeIds.find((d) => d === selfId || !ids.has(d));
  if (badRel) fields.relatedInitiativeIds = `Relacionamento inválido: ${badRel}.`;
  const badPlatform = input.platformIds.find((p) => !platformIds.has(p));
  if (badPlatform) fields.platformIds = `Plataforma ${badPlatform} não existe.`;
  input.prototypes.forEach((p, idx) => {
    if (p.platformIds.some((id) => !platformIds.has(id))) fields[`prototypes.${idx}.platformIds`] = "Plataforma inexistente.";
  });

  const duplicateDoc = input.documents.find(
    (d, idx) => d.source === "repo" && input.documents.findIndex((o) => o.source === "repo" && o.path === d.path) !== idx,
  );
  if (duplicateDoc) fields.documents = `O arquivo ${duplicateDoc.path} foi associado mais de uma vez.`;

  if (Object.keys(fields).length) throw new DomainError(422, "Há relacionamentos inválidos.", fields);
}

function assertUniqueTitle(db: Database, title: string, selfId?: string) {
  const key = normalizeTitle(title);
  const clash = db.initiatives.find((i) => i.id !== selfId && normalizeTitle(i.title) === key);
  if (clash) {
    throw new DomainError(409, `Já existe uma iniciativa com este nome (${clash.id}).`, {
      title: `Já existe uma iniciativa com este nome (${clash.id}).`,
    });
  }
}

/** Mantém apenas as anotações das plataformas selecionadas. */
function cleanPlatformNotes(input: InitiativeInput): InitiativeInput {
  const notes = Object.fromEntries(
    Object.entries(input.platformNotes).filter(([id, note]) => input.platformIds.includes(id) && note.trim()),
  );
  return { ...input, platformNotes: notes };
}

export async function getSnapshot(): Promise<Snapshot> {
  const repo = getRepository();
  const [{ schemaVersion: _v, ...rest }, writable] = await Promise.all([repo.read(), repo.isWritable()]);
  return { ...rest, writable, storage: storageKind() };
}

export async function createInitiative(data: unknown): Promise<Initiative> {
  const input = cleanPlatformNotes(parse(initiativeInputSchema, data));
  return getRepository().transaction((db) => {
    assertUniqueTitle(db, input.title);
    assertReferences(db, input);
    const now = new Date().toISOString();
    const id = nextInitiativeId(db);
    const initiative: Initiative = {
      ...input,
      id,
      repoFolder: initiativeFolder(id, input.title),
      createdAt: now,
      updatedAt: now,
      history: [historyEntry("Iniciativa criada.", now)],
      roadmapOrder: nextRoadmapOrder(db.initiatives, input.quarter),
    };
    db.initiatives.push(initiative);
    return initiative;
  });
}

export async function updateInitiative(id: string, data: unknown): Promise<Initiative> {
  const input = cleanPlatformNotes(parse(initiativeInputSchema, data));
  return getRepository().transaction((db) => {
    const index = db.initiatives.findIndex((i) => i.id === id);
    if (index < 0) throw notFound("Iniciativa");
    assertUniqueTitle(db, input.title, id);
    assertReferences(db, input, id);
    const before = db.initiatives[index];
    const now = new Date().toISOString();
    const changes = describeChanges(before, input);
    const entries = (changes.length ? changes : ["Detalhes da iniciativa atualizados."]).map((c) => historyEntry(c, now));
    const updated: Initiative = {
      ...before,
      ...input,
      roadmapOrder: orderAfterQuarterChange(db, before, input.quarter),
      updatedAt: now,
      history: [...entries, ...before.history].slice(0, 200),
    };
    db.initiatives[index] = updated;
    return updated;
  });
}

/** Alteração rápida de quarter, prioridade, status ou validação do planejamento. */
export async function patchPlanning(id: string, data: unknown): Promise<Initiative> {
  const patch = parse(planningPatchSchema, data);
  return getRepository().transaction((db) => {
    const index = db.initiatives.findIndex((i) => i.id === id);
    if (index < 0) throw notFound("Iniciativa");
    const before = db.initiatives[index];
    const next = { ...before, ...patch };
    const changes = describeChanges(before, next);
    if (!changes.length) return before;
    const now = new Date().toISOString();
    const updated: Initiative = {
      ...next,
      roadmapOrder: orderAfterQuarterChange(db, before, next.quarter),
      updatedAt: now,
      history: [...changes.map((c) => historyEntry(c, now)), ...before.history].slice(0, 200),
    };
    db.initiatives[index] = updated;
    return updated;
  });
}

/** Ao mudar de quarter fora do roadmap (formulário, drawer), a iniciativa vai para o fim da nova coluna. */
function orderAfterQuarterChange(db: Database, before: Initiative, quarter: Initiative["quarter"]): number {
  return before.quarter === quarter ? before.roadmapOrder : nextRoadmapOrder(db.initiatives, quarter, before.id);
}

const columnLabel = (q: Initiative["quarter"]) => (q ? `em ${QUARTER_LABEL[q]}` : "entre as iniciativas sem quarter");

/**
 * Move um card do roadmap para outro quarter e/ou posição. Renumera a coluna de destino
 * e devolve todas as iniciativas cuja ordem mudou.
 */
export async function moveInitiative(id: string, data: unknown): Promise<Initiative[]> {
  const target = parse(roadmapMoveSchema, data);
  return getRepository().transaction((db) => {
    const index = db.initiatives.findIndex((i) => i.id === id);
    if (index < 0) throw notFound("Iniciativa");
    const placement = placeInColumn(db.initiatives, id, target);
    if (!placement) {
      throw new DomainError(409, "O roadmap mudou desde que a página foi carregada. Atualize e tente novamente.");
    }
    const before = db.initiatives[index];
    const sequence = [...placement.orders.keys()].join();
    if (before.quarter === target.quarter && roadmapColumn(db.initiatives, target.quarter).map((i) => i.id).join() === sequence) return [];

    const changed: Initiative[] = [];
    db.initiatives = db.initiatives.map((i) => {
      const order = placement.orders.get(i.id);
      if (order === undefined || i.id === id || order === i.roadmapOrder) return i;
      const updated = { ...i, roadmapOrder: order };
      changed.push(updated);
      return updated;
    });

    const now = new Date().toISOString();
    const descriptions =
      before.quarter !== target.quarter
        ? describeChanges(before, { ...before, quarter: target.quarter })
        : [`Posição no roadmap alterada ${columnLabel(target.quarter)}: ${placement.position}ª de ${placement.size}.`];
    const moved: Initiative = {
      ...before,
      quarter: target.quarter,
      roadmapOrder: placement.orders.get(id) ?? 0,
      updatedAt: now,
      history: [...descriptions.map((c) => historyEntry(c, now)), ...before.history].slice(0, 200),
    };
    db.initiatives[index] = moved;
    return [moved, ...changed];
  });
}

/** Exclui a iniciativa e remove referências a ela, preservando a integridade. */
export async function deleteInitiative(id: string): Promise<void> {
  await getRepository().transaction((db) => {
    if (!db.initiatives.some((i) => i.id === id)) throw notFound("Iniciativa");
    const now = new Date().toISOString();
    db.initiatives = db.initiatives
      .filter((i) => i.id !== id)
      .map((i) => {
        if (!i.dependsOn.includes(id) && !i.relatedInitiativeIds.includes(id)) return i;
        return {
          ...i,
          dependsOn: i.dependsOn.filter((d) => d !== id),
          relatedInitiativeIds: i.relatedInitiativeIds.filter((d) => d !== id),
          updatedAt: now,
          history: [historyEntry(`Vínculo com ${id} removido porque a iniciativa foi excluída.`, now), ...i.history],
        };
      });
    db.context.problems = db.context.problems.map((p) => ({
      ...p,
      relatedInitiativeIds: p.relatedInitiativeIds.filter((r) => r !== id),
    }));
  });
}

export async function createPlatform(data: unknown): Promise<Platform> {
  const input = parse(platformInputSchema, data);
  return getRepository().transaction((db) => {
    const base = slugify(input.name) || "plataforma";
    if (db.platforms.some((p) => slugify(p.name) === base)) {
      throw new DomainError(409, "Já existe uma plataforma com este nome.", { name: "Já existe uma plataforma com este nome." });
    }
    let id = base;
    for (let n = 2; db.platforms.some((p) => p.id === id); n++) id = `${base}-${n}`;
    const platform: Platform = { ...input, id };
    db.platforms.push(platform);
    return platform;
  });
}

export async function updatePlatform(id: string, data: unknown): Promise<Platform> {
  const input = parse(platformInputSchema, data);
  return getRepository().transaction((db) => {
    const index = db.platforms.findIndex((p) => p.id === id);
    if (index < 0) throw notFound("Plataforma");
    if (db.platforms.some((p) => p.id !== id && slugify(p.name) === slugify(input.name))) {
      throw new DomainError(409, "Já existe uma plataforma com este nome.", { name: "Já existe uma plataforma com este nome." });
    }
    db.platforms[index] = { ...input, id };
    return db.platforms[index];
  });
}

/** Plataformas vinculadas a iniciativas não podem ser excluídas (preserva relacionamentos). */
export async function deletePlatform(id: string): Promise<void> {
  await getRepository().transaction((db) => {
    if (!db.platforms.some((p) => p.id === id)) throw notFound("Plataforma");
    const usedBy = db.initiatives.filter(
      (i) => i.platformIds.includes(id) || i.prototypes.some((p) => p.platformIds.includes(id)),
    );
    if (usedBy.length) {
      throw new DomainError(
        409,
        `Esta plataforma está vinculada a ${usedBy.length === 1 ? "1 iniciativa" : `${usedBy.length} iniciativas`} (${usedBy
          .map((i) => i.id)
          .join(", ")}). Remova os vínculos antes de excluí-la.`,
      );
    }
    db.platforms = db.platforms.filter((p) => p.id !== id);
  });
}

export async function updateContext(data: unknown): Promise<StrategyContext> {
  const context = parse(strategyContextSchema, data);
  return getRepository().transaction((db) => {
    const ids = new Set(db.initiatives.map((i) => i.id));
    context.problems = context.problems.map((p) => ({
      ...p,
      relatedInitiativeIds: p.relatedInitiativeIds.filter((r) => ids.has(r)),
    }));
    db.context = context;
    return context;
  });
}

const DOCUMENT_TEMPLATES: Record<"prd" | "decisoes", (i: Initiative) => string> = {
  prd: (i) => `# PRD — ${i.title}

> Rascunho criado em ${new Date().toLocaleDateString("pt-BR")}. Substitua cada seção pelo conteúdo validado.

## 1. Resumo executivo

## 2. Contexto e problema

${i.problem}

## 3. Objetivos do produto

### 3.1 Objetivo principal

### 3.2 Não objetivos

## 4. Público-alvo e cenários de utilização

## 5. Solução proposta

## 6. Requisitos funcionais

| ID | Requisito | Descrição |
| --- | --- | --- |
| RF01 | | |

## 7. Regras de negócio

## 8. Métricas e instrumentação

## 9. Critérios de aceite

## 10. Dependências

## 11. Riscos e mitigações

## 12. Decisões pendentes
`,
  decisoes: (i) => `# Decisões — ${i.id} ${i.title}

Registro de decisões relevantes e suas justificativas.

| # | Decisão | Situação | Justificativa | Fonte |
| --- | --- | --- | --- | --- |
| D1 | | Proposta | | |
`,
};

/**
 * Cria um documento Markdown na pasta da iniciativa a partir de um modelo e o
 * associa à iniciativa. Não sobrescreve arquivos existentes.
 */
export async function createRepoDocument(
  initiativeId: string,
  kind: "prd" | "decisoes",
  writer: (relPath: string, content: string) => Promise<unknown>,
  exists: (relPath: string) => Promise<boolean>,
): Promise<Initiative> {
  const db = await getRepository().read();
  const initiative = db.initiatives.find((i) => i.id === initiativeId);
  if (!initiative) throw notFound("Iniciativa");
  if (initiative.documents.some((d) => d.kind === kind)) {
    throw new DomainError(409, "Esta iniciativa já possui um documento deste tipo associado.");
  }
  const relPath = `${initiative.repoFolder}/${kind === "prd" ? "prd" : "decisions"}.md`;
  if (await exists(relPath)) {
    throw new DomainError(409, `O arquivo ${relPath} já existe. Associe-o pela edição da iniciativa.`);
  }
  await writer(relPath, DOCUMENT_TEMPLATES[kind](initiative));
  const today = new Date().toISOString().slice(0, 10);
  return getRepository().transaction((current) => {
    const index = current.initiatives.findIndex((i) => i.id === initiativeId);
    if (index < 0) throw notFound("Iniciativa");
    const target = current.initiatives[index];
    const title = kind === "prd" ? target.title : "Decisões e dependências";
    const now = new Date().toISOString();
    const updated: Initiative = {
      ...target,
      documents: [
        ...target.documents,
        {
          id: `${kind}-${Date.now().toString(36)}`,
          title,
          kind,
          source: "repo",
          path: relPath,
          url: "",
          version: "0.1",
          status: "rascunho",
          updatedAt: today,
          versions: [{ version: "0.1", date: today, note: "Documento criado a partir do modelo." }],
        },
      ],
      updatedAt: now,
      history: [historyEntry(`Documento criado: ${relPath}.`, now), ...target.history],
    };
    current.initiatives[index] = updated;
    return updated;
  });
}

/** Registra uma revisão de documento (data, versão e nota) após salvar seu conteúdo. */
export async function recordDocumentRevision(
  initiativeId: string,
  documentId: string,
  revision: { version?: string; note?: string },
): Promise<Initiative> {
  return getRepository().transaction((db) => {
    const index = db.initiatives.findIndex((i) => i.id === initiativeId);
    if (index < 0) throw notFound("Iniciativa");
    const initiative = db.initiatives[index];
    const doc = initiative.documents.find((d) => d.id === documentId);
    if (!doc) throw notFound("Documento");
    const today = new Date().toISOString().slice(0, 10);
    const version = revision.version?.trim().slice(0, 20) || doc.version;
    const note = revision.note?.trim().slice(0, 500) || "Conteúdo atualizado.";
    const now = new Date().toISOString();
    const updatedDoc = {
      ...doc,
      version,
      updatedAt: today,
      versions: [{ version, date: today, note }, ...doc.versions].slice(0, 100),
    };
    const updated: Initiative = {
      ...initiative,
      documents: initiative.documents.map((d) => (d.id === documentId ? updatedDoc : d)),
      updatedAt: now,
      history: [
        historyEntry(`${doc.title} atualizado${version !== doc.version ? ` para a versão ${version}` : ""}: ${note}`, now),
        ...initiative.history,
      ].slice(0, 200),
    };
    db.initiatives[index] = updated;
    return updated;
  });
}
