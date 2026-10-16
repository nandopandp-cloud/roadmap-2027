import { handle } from "@/lib/http/handle";
import { artifactExists, writeDocument } from "@/lib/services/artifacts";
import { DomainError } from "@/lib/services/errors";
import { createRepoDocument } from "@/lib/services/roadmap-service";
import { DOCUMENT_EXTENSIONS } from "@/lib/validation/paths";

type Ctx = { params: Promise<{ id: string }> };

/** Cria um documento Markdown (PRD ou decisões) a partir de um modelo na pasta da iniciativa. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => {
    const body = (await request.json()) as { kind?: string };
    if (body.kind !== "prd" && body.kind !== "decisoes") throw new DomainError(400, "Tipo de documento inválido.");
    return createRepoDocument(id, body.kind, writeDocument, (p) => artifactExists(p, DOCUMENT_EXTENSIONS));
  }, 201);
}
