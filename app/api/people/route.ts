import { handleEdit } from "@/lib/http/handle";
import { createPerson } from "@/lib/services/org-service";

export function POST(request: Request) {
  return handleEdit(async (viewer) => createPerson(viewer, await request.json()), 201);
}
