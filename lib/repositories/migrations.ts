import { ILLUSTRATIONS } from "@/lib/domain/constants";
import type { Database, IllustrationKey } from "@/lib/domain/types";

export const SCHEMA_VERSION = 2;

/** Ilustrações removidas da biblioteca → equivalentes atuais. */
const RENAMED_ILLUSTRATIONS: Record<string, IllustrationKey | null> = { cometa: null, lua: null };

/**
 * Atualiza um banco gravado em versão anterior sem perder dados:
 * v1 → v2: objetivos, entregas e etapas de progresso; nova biblioteca de ilustrações.
 */
export function migrateDatabase(db: Database): { db: Database; changed: boolean } {
  if ((db.schemaVersion ?? 1) >= SCHEMA_VERSION) return { db, changed: false };
  const initiatives = db.initiatives.map((i) => {
    const raw = i as Partial<typeof i> & typeof i;
    const illustration =
      raw.illustration && !(ILLUSTRATIONS as readonly string[]).includes(raw.illustration)
        ? (RENAMED_ILLUSTRATIONS[raw.illustration] ?? null)
        : raw.illustration;
    return {
      ...raw,
      illustration,
      objectives: raw.objectives ?? [],
      deliverables: raw.deliverables ?? [],
      phases: raw.phases ?? [],
    };
  });
  return { db: { ...db, schemaVersion: SCHEMA_VERSION, initiatives }, changed: true };
}
