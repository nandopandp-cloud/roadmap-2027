import { handle } from "@/lib/http/handle";
import { createInitiative } from "@/lib/services/roadmap-service";

export function POST(request: Request) {
  return handle(async () => createInitiative(await request.json()), 201);
}
