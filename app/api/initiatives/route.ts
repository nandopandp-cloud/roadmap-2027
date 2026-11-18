import { handleEdit } from "@/lib/http/handle";
import { documentFiles } from "@/lib/services/artifacts";
import { createInitiative } from "@/lib/services/roadmap-service";

export function POST(request: Request) {
  return handleEdit(async (viewer) => createInitiative(await request.json(), documentFiles, viewer), 201);
}
