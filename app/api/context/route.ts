import { handle } from "@/lib/http/handle";
import { updateContext } from "@/lib/services/roadmap-service";

export function PUT(request: Request) {
  return handle(async () => updateContext(await request.json()));
}
