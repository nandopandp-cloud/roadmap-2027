import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { moveRoadmap2026Item } from "@/lib/services/roadmap-2026";

type Ctx = { params: Promise<{ id: string }> };

/** Ordem da iniciativa no Gantt do 2026 (dentro do squad). Quem pode: checado no serviço. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => moveRoadmap2026Item(id, await request.json(), await requireViewer()));
}
