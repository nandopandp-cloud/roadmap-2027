import { handleEdit } from "@/lib/http/handle";
import { documentFiles } from "@/lib/services/artifacts";
import { createUpcomingInitiative } from "@/lib/services/roadmap-service";

/** Sinaliza uma iniciativa "em breve" (só nome e descrição). */
export function POST(request: Request) {
  return handleEdit(async () => createUpcomingInitiative(await request.json(), documentFiles), 201);
}
