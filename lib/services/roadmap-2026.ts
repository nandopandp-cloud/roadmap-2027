import "server-only";
import { seedRoadmap2026 } from "@/data/seed/roadmap-2026";
import type { Viewer } from "@/lib/auth/session";
import { canPlanRoadmap2026For } from "@/lib/domain/effort-access";
import { OWNER_TRACK_LABEL, OWNER_TRACKS_2026, STATUS_2026_LABEL, TRACK_STATUS_LABEL, TRACK_STATUS_TRACKS, WORK_2026_LABEL, workPeriod } from "@/lib/domain/roadmap-2026";
import type { Database, Person, Roadmap2026, Roadmap2026Item } from "@/lib/domain/types";
import { getRepository, storageKind } from "@/lib/repositories";
import { READ_ONLY_MESSAGE } from "@/lib/repositories/json-file-repository";
import { DomainError, notFound } from "@/lib/services/errors";
import { historyEntry } from "@/lib/services/history";
import { fieldErrors, roadmap2026MoveSchema, roadmap2026PatchSchema, roadmap2026SourceSchema } from "@/lib/validation/schemas";

/**
 * Roadmap 2026: iniciativas importadas da planilha do time e planejadas no app — status,
 * semanas de cada fase, dados e remoção. Quem altera: Head de Produto, Head de Engenharia,
 * tech leads e a coordenação de design (cargo em Times & Squads). Todos consultam.
 */

const ID = /^R26-\d{3}$/;
const NO_ACCESS =
  "Só o Head de Produto, o Head de Engenharia, os tech leads e a coordenação de design alteram o Roadmap 2026. Confira seu cargo e seu e-mail em Times & Squads.";

const source = roadmap2026SourceSchema.parse(seedRoadmap2026.source);

export async function getRoadmap2026(): Promise<Roadmap2026> {
  const db = await getRepository().read();
  return { source, items: db.roadmap2026 };
}

function assertPlanner(viewer: Viewer, db: Database) {
  if (!canPlanRoadmap2026For(viewer, db.people)) throw new DomainError(403, NO_ACCESS);
}

/** Gravação local (JSON) é somente leitura na Vercel: mesma mensagem das demais edições. */
async function guardStorage<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (storageKind() === "arquivo" && (error as NodeJS.ErrnoException).code) throw new DomainError(503, READ_ONLY_MESSAGE);
    throw error;
  }
}

const quoted = (v: string) => (v ? `“${v}”` : "vazio");

/** Mudanças relevantes entre duas versões de uma iniciativa do 2026, para o histórico. */
export function describe2026Changes(before: Roadmap2026Item, after: Roadmap2026Item, people: Pick<Person, "id" | "name">[] = []): string[] {
  const out: string[] = [];
  if (before.status !== after.status) out.push(`Status: ${STATUS_2026_LABEL[before.status]} → ${STATUS_2026_LABEL[after.status]}.`);
  if (before.title !== after.title) out.push(`Nome alterado de “${before.title}” para “${after.title}”.`);
  if (before.subtitle !== after.subtitle) out.push(after.subtitle ? `Subtítulo: ${quoted(after.subtitle)}.` : "Subtítulo removido.");
  if (before.squad !== after.squad) out.push(`Squad: ${before.squad} → ${after.squad}.`);
  for (const track of TRACK_STATUS_TRACKS) {
    if (before.trackStatus[track] !== after.trackStatus[track])
      out.push(`Andamento de ${OWNER_TRACK_LABEL[track]}: ${TRACK_STATUS_LABEL[before.trackStatus[track]]} → ${TRACK_STATUS_LABEL[after.trackStatus[track]]}.`);
  }
  const names = (ids: string[]) => (ids.length ? ids.map((id) => people.find((p) => p.id === id)?.name ?? "pessoa removida").join(", ") : "ninguém");
  for (const track of OWNER_TRACKS_2026) {
    const a = before.owners[track];
    const b = after.owners[track];
    if (a.length !== b.length || a.some((id, i) => id !== b[i])) out.push(`Responsáveis de ${OWNER_TRACK_LABEL[track]}: ${names(a)} → ${names(b)}.`);
  }
  if (before.backlog !== after.backlog) out.push(after.backlog ? "Marcada como backlog." : "Saiu do backlog.");
  for (const seg of after.segments) {
    const prev = before.segments.find((s) => s.id === seg.id);
    if (!prev) out.push(`Fase de ${WORK_2026_LABEL[seg.work]} adicionada: ${workPeriod(seg)}.`);
    else {
      if (prev.work !== seg.work) out.push(`Fase de ${WORK_2026_LABEL[prev.work]} passou a ser de ${WORK_2026_LABEL[seg.work]}.`);
      if (prev.start !== seg.start || prev.weeks !== seg.weeks) out.push(`${WORK_2026_LABEL[seg.work]}: ${workPeriod(prev)} → ${workPeriod(seg)}.`);
    }
  }
  for (const seg of before.segments) {
    if (!after.segments.some((s) => s.id === seg.id)) out.push(`Fase de ${WORK_2026_LABEL[seg.work]} removida (${workPeriod(seg)}).`);
  }
  return out;
}

/** Altera status, dados ou semanas de uma iniciativa do 2026 (só os campos enviados). */
export async function patchRoadmap2026Item(id: string, data: unknown, viewer: Viewer): Promise<Roadmap2026Item> {
  if (!ID.test(id)) throw notFound("Iniciativa do Roadmap 2026");
  const parsed = roadmap2026PatchSchema.safeParse(data);
  if (!parsed.success) throw new DomainError(400, "Revise os campos destacados.", fieldErrors(parsed.error));
  const patch = parsed.data;
  if (patch.segments && new Set(patch.segments.map((s) => s.id)).size !== patch.segments.length)
    throw new DomainError(400, "Há fases repetidas. Recarregue a página e tente de novo.");

  return guardStorage(() =>
    getRepository().transaction((db) => {
      assertPlanner(viewer, db);
      const idx = db.roadmap2026.findIndex((i) => i.id === id);
      if (idx < 0) throw notFound("Iniciativa do Roadmap 2026");
      const before = db.roadmap2026[idx];
      const next: Roadmap2026Item = { ...before, ...patch };
      if (patch.owners) {
        // Só colaboradores de Times & Squads, sem repetição na mesma frente.
        const known = new Set(db.people.map((p) => p.id));
        const unknown = OWNER_TRACKS_2026.flatMap((t) => patch.owners![t]).filter((pid) => !known.has(pid));
        if (unknown.length) throw new DomainError(400, "Escolha pessoas cadastradas em Times & Squads.", { owners: "Pessoa não encontrada no organograma." });
        next.owners = { design: [...new Set(patch.owners.design)], engineering: [...new Set(patch.owners.engineering)], qa: [...new Set(patch.owners.qa)] };
      }
      if (patch.platformId !== undefined && patch.platformId !== before.platformId) {
        const platform = patch.platformId ? db.platforms.find((p) => p.id === patch.platformId) : null;
        if (patch.platformId && !platform) throw new DomainError(400, "Squad inválido.", { platformId: "Escolha um squad da lista." });
        next.squad = platform ? platform.name : "Transversais";
      }
      const changes = describe2026Changes(before, next, db.people);
      if (!changes.length) return before;
      const at = new Date().toISOString();
      next.history = [...changes.map((c) => historyEntry(`${c.slice(0, -1)} (por ${viewer.name}).`, at)), ...before.history].slice(0, 500);
      db.roadmap2026[idx] = next;
      return next;
    }),
  );
}

/**
 * Muda a posição da iniciativa no Gantt (a ordem vale dentro do squad): passa a ficar antes de
 * `beforeId` ou logo depois de `afterId`.
 */
export async function moveRoadmap2026Item(id: string, data: unknown, viewer: Viewer): Promise<{ ok: true }> {
  if (!ID.test(id)) throw notFound("Iniciativa do Roadmap 2026");
  const parsed = roadmap2026MoveSchema.safeParse(data);
  if (!parsed.success) throw new DomainError(400, "Posição inválida.", fieldErrors(parsed.error));
  const { beforeId, afterId } = parsed.data;
  if (beforeId === id || afterId === id) throw new DomainError(400, "Posição inválida.");
  return guardStorage(() =>
    getRepository().transaction((db) => {
      assertPlanner(viewer, db);
      const item = db.roadmap2026.find((i) => i.id === id);
      if (!item) throw notFound("Iniciativa do Roadmap 2026");
      const neighbor = db.roadmap2026.find((i) => i.id === (beforeId ?? afterId));
      if (!neighbor) throw new DomainError(409, "A iniciativa vizinha não existe mais. Recarregue a página.");
      if (neighbor.squad !== item.squad) throw new DomainError(400, "A ordem vale dentro do mesmo squad.");
      const rest = db.roadmap2026.filter((i) => i.id !== id);
      const at = rest.indexOf(neighbor) + (beforeId ? 0 : 1);
      const before = db.roadmap2026.map((i) => i.id).join();
      rest.splice(at, 0, item);
      if (rest.map((i) => i.id).join() === before) return { ok: true as const };
      const index = rest.filter((i) => i.squad === item.squad).indexOf(item) + 1;
      rest[rest.indexOf(item)] = { ...item, history: [historyEntry(`Ordem no Gantt: passou a ser a ${index}ª de ${item.squad} (por ${viewer.name}).`), ...item.history].slice(0, 500) };
      db.roadmap2026 = rest;
      return { ok: true as const };
    }),
  );
}

/** Remove uma iniciativa do Roadmap 2026 (não volta na próxima carga). */
export async function removeRoadmap2026Item(id: string, viewer: Viewer): Promise<{ ok: true }> {
  if (!ID.test(id)) throw notFound("Iniciativa do Roadmap 2026");
  return guardStorage(() =>
    getRepository().transaction((db) => {
      assertPlanner(viewer, db);
      const before = db.roadmap2026.length;
      db.roadmap2026 = db.roadmap2026.filter((i) => i.id !== id);
      if (db.roadmap2026.length === before) throw notFound("Iniciativa do Roadmap 2026");
      return { ok: true as const };
    }),
  );
}
