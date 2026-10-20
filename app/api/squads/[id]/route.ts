import { handle } from "@/lib/http/handle";
import { deleteSquad, updateSquad } from "@/lib/services/org-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updateSquad(id, await request.json()));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => deleteSquad(id));
}
