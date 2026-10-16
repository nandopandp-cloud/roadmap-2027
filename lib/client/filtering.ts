import { PRIORITY_RANK } from "@/lib/domain/labels";
import type { Initiative, InitiativeStatus, Quarter } from "@/lib/domain/types";

export type SortKey = "prioridade" | "recentes" | "quarter" | "id";

export interface InitiativeFilters {
  query: string;
  quarter: Quarter | "todos" | "sem";
  platform: string | "todas";
  status: InitiativeStatus | "todos";
  sort: SortKey;
}

export const DEFAULT_FILTERS: InitiativeFilters = {
  query: "",
  quarter: "todos",
  platform: "todas",
  status: "todos",
  sort: "prioridade",
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Texto pesquisável: nome, problema, motivador, palavras-chave e demais campos descritivos. */
function haystack(i: Initiative): string {
  return normalize(
    [
      i.id,
      i.title,
      i.summary,
      i.category,
      i.tags.join(" "),
      i.problem,
      i.motivator,
      i.hypothesis,
      i.audience,
      i.expectedOutcome,
      i.journeys.join(" "),
    ].join(" "),
  );
}

export function filterInitiatives(list: Initiative[], f: InitiativeFilters): Initiative[] {
  const terms = normalize(f.query).split(/\s+/).filter(Boolean);
  const filtered = list.filter((i) => {
    if (f.quarter === "sem" ? i.quarter !== null : f.quarter !== "todos" && i.quarter !== f.quarter) return false;
    if (f.platform !== "todas" && !i.platformIds.includes(f.platform)) return false;
    if (f.status !== "todos" && i.status !== f.status) return false;
    if (terms.length) {
      const text = haystack(i);
      if (!terms.every((t) => text.includes(t))) return false;
    }
    return true;
  });
  return sortInitiatives(filtered, f.sort);
}

const quarterRank = (q: Quarter | null) => (q ? Number(q[1]) : 9);

export function sortInitiatives(list: Initiative[], sort: SortKey): Initiative[] {
  const copy = [...list];
  switch (sort) {
    case "recentes":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "quarter":
      return copy.sort((a, b) => quarterRank(a.quarter) - quarterRank(b.quarter) || a.id.localeCompare(b.id));
    case "id":
      return copy.sort((a, b) => a.id.localeCompare(b.id));
    case "prioridade":
    default:
      return copy.sort(
        (a, b) =>
          (a.priority ? PRIORITY_RANK[a.priority] : 9) - (b.priority ? PRIORITY_RANK[b.priority] : 9) ||
          quarterRank(a.quarter) - quarterRank(b.quarter) ||
          a.id.localeCompare(b.id),
      );
  }
}

/** Uma iniciativa é transversal quando impacta mais de uma plataforma. */
export const isTransversal = (i: Pick<Initiative, "platformIds">) => i.platformIds.length > 1;
