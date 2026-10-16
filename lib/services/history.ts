import { PRIORITY_LABEL, QUARTER_LABEL, STATUS_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { HistoryEntry, Initiative, InitiativeInput } from "@/lib/domain/types";

const quarter = (q: Initiative["quarter"]) => (q ? QUARTER_LABEL[q] : "sem quarter");
const priority = (p: Initiative["priority"]) => (p ? PRIORITY_LABEL[p] : "a definir");

/**
 * Descreve as mudanças importantes entre duas versões de uma iniciativa.
 * Apenas mudanças relevantes para o planejamento são registradas no histórico.
 */
export function describeChanges(before: Initiative, after: InitiativeInput): string[] {
  const changes: string[] = [];
  if (before.title !== after.title) changes.push(`Nome alterado de “${before.title}” para “${after.title}”.`);
  if (before.status !== after.status)
    changes.push(`Status alterado de ${STATUS_LABEL[before.status]} para ${STATUS_LABEL[after.status]}.`);
  if (before.quarter !== after.quarter)
    changes.push(`Quarter alterado de ${quarter(before.quarter)} para ${quarter(after.quarter)}.`);
  if (before.priority !== after.priority)
    changes.push(`Prioridade alterada de ${priority(before.priority)} para ${priority(after.priority)}.`);
  if (before.planningValidated !== after.planningValidated)
    changes.push(after.planningValidated ? "Quarter e prioridade marcados como validados." : "Planejamento voltou a ficar pendente de validação.");

  const diffIds = <T extends { id: string }>(a: T[], b: T[]) => ({
    added: b.filter((x) => !a.some((y) => y.id === x.id)),
    removed: a.filter((x) => !b.some((y) => y.id === x.id)),
  });
  const docs = diffIds(before.documents, after.documents);
  docs.added.forEach((d) => changes.push(`Documento associado: ${d.title}.`));
  docs.removed.forEach((d) => changes.push(`Documento desassociado: ${d.title}.`));
  for (const doc of after.documents) {
    const prev = before.documents.find((d) => d.id === doc.id);
    if (prev && prev.version !== doc.version && doc.version)
      changes.push(`${doc.title}: versão ${prev.version || "—"} → ${doc.version}.`);
  }
  const protos = diffIds(before.prototypes, after.prototypes);
  protos.added.forEach((p) => changes.push(`Protótipo associado: ${p.name}.`));
  protos.removed.forEach((p) => changes.push(`Protótipo desassociado: ${p.name}.`));

  const addedDeps = after.dependsOn.filter((d) => !before.dependsOn.includes(d));
  const removedDeps = before.dependsOn.filter((d) => !after.dependsOn.includes(d));
  if (addedDeps.length) changes.push(`Nova dependência: ${addedDeps.join(", ")}.`);
  if (removedDeps.length) changes.push(`Dependência removida: ${removedDeps.join(", ")}.`);

  const addedPlatforms = after.platformIds.filter((p) => !before.platformIds.includes(p));
  const removedPlatforms = before.platformIds.filter((p) => !after.platformIds.includes(p));
  if (addedPlatforms.length || removedPlatforms.length) changes.push("Plataformas impactadas atualizadas.");

  if (JSON.stringify(before.phases) !== JSON.stringify(after.phases)) {
    const pct = progressOf(after.phases);
    changes.push(`Etapas de progresso atualizadas${pct === null ? "" : ` (${pct}% concluído)`}.`);
  }
  if (JSON.stringify(before.objectives) !== JSON.stringify(after.objectives)) changes.push("Objetivos principais atualizados.");
  return changes;
}

export function historyEntry(description: string, at = new Date().toISOString()): HistoryEntry {
  return { id: crypto.randomUUID(), at, description };
}
