import { handleEdit } from "@/lib/http/handle";
import { documentFiles } from "@/lib/services/artifacts";
import { deleteInitiative, patchPlanning, updateInitiative } from "@/lib/services/roadmap-service";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit(async (viewer) => updateInitiative(id, await request.json(), documentFiles, viewer));
}

/** Alteração rápida de planejamento (quarter, prioridade, status). */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit(async (viewer) => patchPlanning(id, await request.json(), viewer));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handleEdit((viewer) => deleteInitiative(id, viewer));
}
