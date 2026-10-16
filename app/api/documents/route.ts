import { handle } from "@/lib/http/handle";
import { readDocument, writeDocument } from "@/lib/services/artifacts";
import { DomainError } from "@/lib/services/errors";
import { recordDocumentRevision } from "@/lib/services/roadmap-service";
import { documentContentSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/** Lê um documento Markdown do repositório: GET /api/documents?path=initiatives/.../prd.md */
export function GET(request: Request) {
  return handle(async () => {
    const path = new URL(request.url).searchParams.get("path") ?? "";
    const doc = await readDocument(path);
    if (!doc) throw new DomainError(404, "O arquivo deste documento não foi encontrado no repositório.");
    return { path, ...doc };
  });
}

/**
 * Salva o conteúdo de um documento e, quando informado, registra a revisão
 * (versão, data e nota) no documento associado à iniciativa.
 */
export function PUT(request: Request) {
  return handle(async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const parsed = documentContentSchema.safeParse(body);
    if (!parsed.success) throw new DomainError(422, parsed.error.issues[0]?.message ?? "Dados inválidos.");
    const { modifiedAt } = await writeDocument(parsed.data.path, parsed.data.content);
    const initiativeId = typeof body.initiativeId === "string" ? body.initiativeId : null;
    const documentId = typeof body.documentId === "string" ? body.documentId : null;
    const initiative =
      initiativeId && documentId
        ? await recordDocumentRevision(initiativeId, documentId, {
            version: typeof body.version === "string" ? body.version : undefined,
            note: typeof body.note === "string" ? body.note : undefined,
          })
        : null;
    return { path: parsed.data.path, modifiedAt, initiative };
  });
}
