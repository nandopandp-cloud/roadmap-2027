import { handle } from "@/lib/http/handle";
import { deletePlatform, updatePlatform } from "@/lib/services/roadmap-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updatePlatform(id, await request.json()));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => deletePlatform(id));
}
