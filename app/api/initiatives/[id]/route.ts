import { handle } from "@/lib/http/handle";
import { documentFiles } from "@/lib/services/artifacts";
import { deleteInitiative, patchPlanning, updateInitiative } from "@/lib/services/roadmap-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => updateInitiative(id, await request.json(), documentFiles));
}

/** Alteração rápida de planejamento (quarter, prioridade, status). */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => patchPlanning(id, await request.json()));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(() => deleteInitiative(id));
}
