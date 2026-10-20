import { handle } from "@/lib/http/handle";
import { createPerson } from "@/lib/services/org-service";

export function POST(request: Request) {
  return handle(async () => createPerson(await request.json()), 201);
}
