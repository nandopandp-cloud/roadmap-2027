import { PRIORITY_LABEL, QUARTER_LABEL, STATUS_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import { parseGithubBranch, parseGithubRepo } from "@/lib/domain/github";
import type { HistoryEntry, Initiative, InitiativeInput, RepositoryLink } from "@/lib/domain/types";

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
  if (before.upcoming !== after.upcoming)
    changes.push(after.upcoming ? "Iniciativa marcada como em breve (cadastro incompleto)." : "Cadastro da iniciativa completado: deixou de ser “em breve”.");
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
  if (before.customImage?.imageId !== after.customImage?.imageId)
    changes.push(after.customImage ? "Imagem da iniciativa atualizada." : "Imagem própria removida.");
  if (JSON.stringify(before.objectives) !== JSON.stringify(after.objectives)) changes.push("Objetivos principais atualizados.");
  return changes;
}

const repoName = (r: RepositoryLink) => {
  const parsed = parseGithubRepo(r.url);
  return parsed ? `${parsed.owner}/${parsed.repo}` : r.url;
};
const branchName = (url: string) => parseGithubBranch(url)?.branch ?? url;
const branchList = (urls: string[]) => urls.map(branchName).join(", ");

/** Mudanças nos repositórios do GitHub vinculados (aba Repositório). */
export function describeRepositoryChanges(before: RepositoryLink[], after: RepositoryLink[]): string[] {
  const changes: string[] = [];
  for (const r of after) {
    const prev = before.find((x) => x.id === r.id);
    const urls = r.branches.map((b) => b.url);
    if (!prev) {
      const branches = urls.length ? ` (${urls.length > 1 ? "branches" : "branch"} ${branchList(urls)})` : "";
      changes.push(`Repositório vinculado: ${repoName(r)}${branches}.`);
      continue;
    }
    if (prev.url !== r.url) {
      changes.push(`Repositório ${repoName(prev)} substituído por ${repoName(r)}.`);
      continue;
    }
    const prevUrls = prev.branches.map((b) => b.url);
    const added = urls.filter((u) => !prevUrls.includes(u));
    const removed = prevUrls.filter((u) => !urls.includes(u));
    if (added.length) changes.push(`${added.length > 1 ? "Branches adicionadas" : "Branch adicionada"} em ${repoName(r)}: ${branchList(added)}.`);
    if (removed.length) changes.push(`${removed.length > 1 ? "Branches removidas" : "Branch removida"} de ${repoName(r)}: ${branchList(removed)}.`);
  }
  before.filter((r) => !after.some((x) => x.id === r.id)).forEach((r) => changes.push(`Repositório desvinculado: ${repoName(r)}.`));
  return changes;
}

export function historyEntry(description: string, at = new Date().toISOString()): HistoryEntry {
  return { id: crypto.randomUUID(), at, description };
}
