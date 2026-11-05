import { handleEdit } from "@/lib/http/handle";
import { createSquad } from "@/lib/services/org-service";

export function POST(request: Request) {
  return handleEdit(async () => createSquad(await request.json()), 201);
}
