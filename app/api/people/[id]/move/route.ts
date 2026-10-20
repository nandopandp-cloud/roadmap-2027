import { handle } from "@/lib/http/handle";
import { movePerson } from "@/lib/services/org-service";

type Ctx = { params: Promise<{ id: string }> };

/** Realocar no organograma: squad de destino e posição. */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => movePerson(id, await request.json()));
}
