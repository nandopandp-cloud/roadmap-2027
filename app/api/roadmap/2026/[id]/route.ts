import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { patchRoadmap2026Item, removeRoadmap2026Item } from "@/lib/services/roadmap-2026";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Iniciativa do Roadmap 2026. Quem altera é definido pelo cargo em Times & Squads (Head de
 * Produto, Head de Engenharia, tech leads e coordenação de design) — checado no serviço; por
 * isso o proxy deixa estas rotas passarem para perfis de consulta.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => patchRoadmap2026Item(id, await request.json(), await requireViewer()));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => removeRoadmap2026Item(id, await requireViewer()));
}
