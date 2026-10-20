import { handle } from "@/lib/http/handle";
import { createSquad } from "@/lib/services/org-service";

export function POST(request: Request) {
  return handle(async () => createSquad(await request.json()), 201);
}
