import "server-only";
import type { z } from "zod";
import type { Viewer } from "@/lib/auth/session";
import { EFFORT_TRACK_LABEL, EFFORT_TRACKS, type EffortTrack } from "@/lib/domain/effort";
import { effortTracksFor } from "@/lib/domain/effort-access";
import {
  ATTACHMENT_CHUNK_BYTES,
  ATTACHMENT_MAX_PARTS,
  ATTACHMENTS_PER_TRACK,
  attachmentTypeOf,
  linkName,
} from "@/lib/domain/effort-attachments";
import type { EffortAttachment, Initiative } from "@/lib/domain/types";
import { getAttachmentStore, getRepository, storageKind } from "@/lib/repositories";
import type { StoredAttachment } from "@/lib/repositories/attachments";
import { READ_ONLY_MESSAGE } from "@/lib/repositories/json-file-repository";
import { DomainError, notFound } from "@/lib/services/errors";
import { historyEntry } from "@/lib/services/history";
import { effortAttachmentInputSchema, fieldErrors } from "@/lib/validation/schemas";

/**
 * Justificativa do esforço: arquivos e links de cada frente. Quem estima uma frente
 * (editores; tech leads em Engenharia; coordenação de design em Design) anexa e remove
 * os arquivos dela. Todos que consultam o roadmap veem e baixam.
 */

const UUID = /^[a-f0-9-]{36}$/;

function parse<S extends z.ZodType>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) throw new DomainError(400, "Revise os campos destacados.", fieldErrors(result.error));
  return result.data;
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

const NO_TRACK = "Só editores, tech leads e a coordenação de design anexam a justificativa do esforço.";

function assertTrack(viewer: Viewer, people: Parameters<typeof effortTracksFor>[1], track: EffortTrack) {
  const allowed = effortTracksFor(viewer, people);
  if (!allowed.length) throw new DomainError(403, NO_TRACK);
  if (!allowed.includes(track)) {
    const own = allowed.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ");
    throw new DomainError(403, `Seu perfil anexa apenas a justificativa de ${own}.`);
  }
}

/** Quem não é editor fica identificado no histórico (como na estimativa). */
const byline = (viewer: Viewer) => (viewer.role === "editor" ? "" : ` (por ${viewer.name})`);

/** Recebe uma parte de um arquivo em envio. */
export async function uploadAttachmentPart(uploadId: string, part: number, data: Buffer, viewer: Viewer): Promise<void> {
  if (!UUID.test(uploadId) || !Number.isInteger(part) || part < 0 || part >= ATTACHMENT_MAX_PARTS) {
    throw new DomainError(400, "Parte de envio inválida.");
  }
  if (data.length === 0) throw new DomainError(400, "Parte vazia.");
  if (data.length > ATTACHMENT_CHUNK_BYTES) throw new DomainError(413, "Parte grande demais.");
  const db = await getRepository().read();
  if (!effortTracksFor(viewer, db.people).length) throw new DomainError(403, NO_TRACK);
  await guardStorage(() => getAttachmentStore().savePart(uploadId, part, data));
}

/** Anexa um link ou um arquivo (já enviado em partes) à justificativa de uma frente. */
export async function addEffortAttachment(id: string, data: unknown, viewer: Viewer): Promise<Initiative> {
  const input = parse(effortAttachmentInputSchema, data);
  const store = getAttachmentStore();

  // Confere antes de montar o arquivo: iniciativa, permissão e limite de anexos.
  const current = await getRepository().read();
  const target = current.initiatives.find((i) => i.id === id);
  if (!target) throw notFound("Iniciativa");
  assertTrack(viewer, current.people, input.track);
  if (target.effortEvidence[input.track].length >= ATTACHMENTS_PER_TRACK) {
    throw new DomainError(400, `Cada frente aceita até ${ATTACHMENTS_PER_TRACK} anexos. Remova algum antes de anexar outro.`);
  }

  const now = new Date().toISOString();
  const attachmentId = crypto.randomUUID();
  let attachment: EffortAttachment;
  let stored = false;
  if (input.kind === "file") {
    const type = attachmentTypeOf(input.name);
    if (!type) throw new DomainError(415, "Tipo de arquivo não aceito.");
    const file = await guardStorage(() => store.takeParts(input.uploadId, input.parts));
    if (!file) throw new DomainError(400, "O envio do arquivo não foi concluído. Tente enviar de novo.");
    if (file.length !== input.size) throw new DomainError(400, "O arquivo chegou incompleto. Tente enviar de novo.");
    const record: StoredAttachment = { name: input.name, contentType: type.contentType, data: file };
    await guardStorage(() => store.save(attachmentId, record));
    stored = true;
    attachment = { id: attachmentId, kind: "file", name: input.name, size: file.length, addedBy: viewer.name, addedAt: now };
  } else {
    attachment = { id: attachmentId, kind: "link", name: linkName(input.url), url: input.url, addedBy: viewer.name, addedAt: now };
  }

  try {
    return await getRepository().transaction((db) => {
      const index = db.initiatives.findIndex((i) => i.id === id);
      if (index < 0) throw notFound("Iniciativa");
      assertTrack(viewer, db.people, input.track);
      const before = db.initiatives[index];
      const list = before.effortEvidence[input.track];
      if (list.length >= ATTACHMENTS_PER_TRACK) throw new DomainError(400, `Cada frente aceita até ${ATTACHMENTS_PER_TRACK} anexos.`);
      const what = attachment.kind === "file" ? `Arquivo "${attachment.name}"` : `Link ${attachment.name}`;
      const updated: Initiative = {
        ...before,
        effortEvidence: { ...before.effortEvidence, [input.track]: [...list, attachment] },
        updatedAt: now,
        history: [
          historyEntry(`${what} anexado à justificativa de ${EFFORT_TRACK_LABEL[input.track]}${byline(viewer)}.`, now),
          ...before.history,
        ].slice(0, 200),
      };
      db.initiatives[index] = updated;
      return updated;
    });
  } catch (error) {
    if (stored) await store.remove(attachmentId).catch(() => undefined);
    throw error;
  }
}

/** Remove um anexo (e o arquivo guardado, se houver). */
export async function removeEffortAttachment(id: string, attachmentId: string, viewer: Viewer): Promise<Initiative> {
  if (!UUID.test(attachmentId)) throw notFound("Anexo");
  let removed: EffortAttachment | undefined;
  const updated = await getRepository().transaction((db) => {
    const index = db.initiatives.findIndex((i) => i.id === id);
    if (index < 0) throw notFound("Iniciativa");
    const before = db.initiatives[index];
    const track = EFFORT_TRACKS.find((t) => before.effortEvidence[t].some((a) => a.id === attachmentId));
    if (!track) throw notFound("Anexo");
    assertTrack(viewer, db.people, track);
    removed = before.effortEvidence[track].find((a) => a.id === attachmentId);
    const now = new Date().toISOString();
    const what = removed?.kind === "file" ? `Arquivo "${removed.name}"` : `Link ${removed?.name}`;
    const next: Initiative = {
      ...before,
      effortEvidence: { ...before.effortEvidence, [track]: before.effortEvidence[track].filter((a) => a.id !== attachmentId) },
      updatedAt: now,
      history: [historyEntry(`${what} removido da justificativa de ${EFFORT_TRACK_LABEL[track]}${byline(viewer)}.`, now), ...before.history].slice(
        0,
        200,
      ),
    };
    db.initiatives[index] = next;
    return next;
  });
  if (removed?.kind === "file") await getAttachmentStore().remove(attachmentId).catch(() => undefined);
  return updated;
}

/** Apaga os arquivos de uma iniciativa excluída. */
export async function discardEvidenceFiles(initiative: Initiative): Promise<void> {
  const store = getAttachmentStore();
  const files = EFFORT_TRACKS.flatMap((t) => initiative.effortEvidence[t]).filter((a) => a.kind === "file");
  await Promise.all(files.map((a) => store.remove(a.id).catch(() => undefined)));
}

export async function readEffortAttachment(attachmentId: string): Promise<StoredAttachment | null> {
  if (!UUID.test(attachmentId)) return null;
  return getAttachmentStore().read(attachmentId);
}
