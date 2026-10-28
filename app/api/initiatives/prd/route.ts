import { handle } from "@/lib/http/handle";
import { documentFiles } from "@/lib/services/artifacts";
import { createInitiativeFromPrd } from "@/lib/services/roadmap-service";

/** Cria uma iniciativa a partir de um PRD, gravando o texto original como prd.md. */
export function POST(request: Request) {
  return handle(async () => createInitiativeFromPrd(await request.json(), documentFiles), 201);
}
