import { handle } from "@/lib/http/handle";
import { replacePerson } from "@/lib/services/org-service";

type Ctx = { params: Promise<{ id: string }> };

/** Substituir um colaborador por outro (existente ou novo). */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => replacePerson(id, await request.json()));
}
