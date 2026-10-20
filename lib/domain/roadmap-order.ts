import { PRIORITY_RANK } from "@/lib/domain/labels";
import type { Initiative, Quarter } from "@/lib/domain/types";

/**
 * Ordem das iniciativas dentro de cada coluna do roadmap (quarter ou "sem quarter").
 * Usada no servidor (ao gravar) e no cliente (atualização otimista ao arrastar).
 */

type Ordered = Pick<Initiative, "id" | "quarter" | "roadmapOrder">;

/** Destino de um card: coluna e vizinho visível (antes de `beforeId` ou depois de `afterId`). */
export interface RoadmapTarget {
  quarter: Quarter | null;
  beforeId?: string | null;
  afterId?: string | null;
}

export interface Placement {
  /** Nova posição (roadmapOrder) de cada iniciativa da coluna de destino, incluindo a movida. */
  orders: Map<string, number>;
  /** Posição final da iniciativa movida (1 = primeira). */
  position: number;
  size: number;
}

export const compareRoadmapOrder = (a: Ordered, b: Ordered) => a.roadmapOrder - b.roadmapOrder || a.id.localeCompare(b.id);

export function roadmapColumn<T extends Ordered>(list: T[], quarter: Quarter | null, exceptId?: string): T[] {
  return list.filter((i) => i.quarter === quarter && i.id !== exceptId).sort(compareRoadmapOrder);
}

/** Posição ao final da coluna (novas iniciativas e mudanças de quarter fora do roadmap). */
export function nextRoadmapOrder(list: Ordered[], quarter: Quarter | null, exceptId?: string): number {
  return roadmapColumn(list, quarter, exceptId).reduce((max, i) => Math.max(max, i.roadmapOrder + 1), 0);
}

/**
 * Ordem padrão para registros gravados antes da ordenação manual: prioridade e depois ID,
 * a mesma ordem exibida até então. Determinística por registro, para que a migração em
 * memória (Postgres) produza sempre o mesmo valor.
 */
export function defaultRoadmapOrder(i: Pick<Initiative, "id" | "priority">): number {
  return (i.priority ? PRIORITY_RANK[i.priority] : 3) * 1000 + (Number(i.id.slice(-3)) || 0);
}

/** Calcula a coluna de destino com a iniciativa inserida. null quando o vizinho informado não está na coluna. */
export function placeInColumn(list: Ordered[], id: string, target: RoadmapTarget): Placement | null {
  const column = roadmapColumn(list, target.quarter, id);
  let index = column.length;
  if (target.afterId) {
    const at = column.findIndex((i) => i.id === target.afterId);
    if (at < 0) return null;
    index = at + 1;
  } else if (target.beforeId) {
    const at = column.findIndex((i) => i.id === target.beforeId);
    if (at < 0) return null;
    index = at;
  }
  const ids = column.map((i) => i.id);
  ids.splice(index, 0, id);
  return { orders: new Map(ids.map((x, n) => [x, n])), position: index + 1, size: ids.length };
}
