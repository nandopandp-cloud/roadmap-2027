import { handleEdit } from "@/lib/http/handle";
import { updateContext } from "@/lib/services/roadmap-service";

export function PUT(request: Request) {
  return handleEdit(async () => updateContext(await request.json()));
}
