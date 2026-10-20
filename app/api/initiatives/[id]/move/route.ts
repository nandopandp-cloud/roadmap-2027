import { handle } from "@/lib/http/handle";
import { moveInitiative } from "@/lib/services/roadmap-service";

type Ctx = { params: Promise<{ id: string }> };

/** Arrastar no roadmap: quarter de destino e posição na coluna. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => moveInitiative(id, await request.json()));
}
