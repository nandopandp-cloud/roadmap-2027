import { handle } from "@/lib/http/handle";
import { artifactExists, writeDocument } from "@/lib/services/artifacts";
import { createInitiativeFromPrd } from "@/lib/services/roadmap-service";
import { DOCUMENT_EXTENSIONS } from "@/lib/validation/paths";

/** Cria uma iniciativa a partir de um PRD, gravando o texto original como prd.md. */
export function POST(request: Request) {
  return handle(
    async () => createInitiativeFromPrd(await request.json(), writeDocument, (p) => artifactExists(p, DOCUMENT_EXTENSIONS)),
    201,
  );
}
