import { handleEdit } from "@/lib/http/handle";
import { artifactExists, writeDocument } from "@/lib/services/artifacts";
import { DomainError } from "@/lib/services/errors";
import { createRepoDocument, reviewDocument } from "@/lib/services/roadmap-service";
import { DOCUMENT_EXTENSIONS } from "@/lib/validation/paths";

type Ctx = { params: Promise<{ id: string }> };

/** Cria um documento Markdown (PRD ou decisões) a partir de um modelo na pasta da iniciativa. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit(async (viewer) => {
    const body = (await request.json()) as { kind?: string };
    if (body.kind !== "prd" && body.kind !== "decisoes") throw new DomainError(400, "Tipo de documento inválido.");
    return createRepoDocument(id, body.kind, writeDocument, (p) => artifactExists(p, DOCUMENT_EXTENSIONS), viewer);
  }, 201);
}

/** Revisão de um PRD: { documentId, decision: "aprovar" } — só quem revisa PRDs. */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit(async (viewer) => reviewDocument(id, await request.json(), viewer));
}
