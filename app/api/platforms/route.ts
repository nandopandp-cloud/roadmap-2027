import { handle } from "@/lib/http/handle";
import { createPlatform } from "@/lib/services/roadmap-service";

export function POST(request: Request) {
  return handle(async () => createPlatform(await request.json()), 201);
}
