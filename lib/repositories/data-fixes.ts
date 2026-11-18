import { personForEmail } from "@/lib/domain/access";
import type { Database, HistoryEntry } from "@/lib/domain/types";
import { slugify } from "@/lib/validation/paths";

/**
 * Ajustes de dados pedidos pelo time, aplicados uma única vez no banco (a chave fica em
 * roadmap_meta; ver PostgresRepository.applyDataFixes). Cada ajuste devolve quantas
 * iniciativas mudaram, ou null quando ainda não pode ser aplicado (tenta de novo depois).
 */
export interface DataFix {
  key: string;
  apply: (db: Database, now: string) => number | null;
}

const FERNANDO_EMAIL = "fernando.rodrigues@jovensgenios.com";

const entry = (description: string, at: string): HistoryEntry => ({ id: crypto.randomUUID(), at, description });

/**
 * 18/11/2026 — pedido do Fernando: ele é o criador de todas as iniciativas e dos PRDs delas,
 * exceto a Lojinha Geniex (criada por ele, mas com o PRD construído pelo João Vitor, informado à mão).
 */
export const creatorFernando: DataFix = {
  key: "fix_criador_fernando_2026_11_18",
  apply(db, now) {
    const fernando = personForEmail(db.people, FERNANDO_EMAIL);
    // Sem o Fernando em Times & Squads não há a quem atribuir: tenta na próxima carga.
    if (!fernando) return null;
    const nameOf = (id: string | null) => (id ? (db.people.find((p) => p.id === id)?.name ?? "colaborador removido") : "não informado");
    let changed = 0;
    db.initiatives = db.initiatives.map((initiative) => {
      if (slugify(initiative.title).includes("lojinha")) return initiative;
      const notes: string[] = [];
      if (initiative.creatorId !== fernando.id) {
        notes.push(`Criador da iniciativa: ${fernando.name} (antes: ${nameOf(initiative.creatorId)}). Ajuste em lote.`);
      }
      const documents = initiative.documents.map((doc) => {
        if (doc.kind !== "prd" || doc.authorId === fernando.id) return doc;
        notes.push(`${doc.title}: criado por ${fernando.name} (antes: ${nameOf(doc.authorId)}). Ajuste em lote.`);
        return { ...doc, authorId: fernando.id, collaboratorIds: doc.collaboratorIds.filter((id) => id !== fernando.id) };
      });
      if (!notes.length) return initiative;
      changed++;
      return {
        ...initiative,
        creatorId: fernando.id,
        documents,
        history: [...notes.map((n) => entry(n, now)), ...initiative.history].slice(0, 200),
      };
    });
    return changed;
  },
};

export const DATA_FIXES: DataFix[] = [creatorFernando];
