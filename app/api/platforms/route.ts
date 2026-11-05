import { handleEdit } from "@/lib/http/handle";
import { createPlatform } from "@/lib/services/roadmap-service";

export function POST(request: Request) {
  return handleEdit(async () => createPlatform(await request.json()), 201);
}
