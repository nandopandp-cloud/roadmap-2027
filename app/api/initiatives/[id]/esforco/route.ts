import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { patchEffort } from "@/lib/services/roadmap-service";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Esforço estimado (semanas de Design e Engenharia). Além dos editores, tech leads e a
 * coordenação de design podem salvar a sua frente — a checagem por frente fica no serviço.
 * O proxy deixa esta rota passar para perfis de consulta justamente por isso.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => patchEffort(id, await request.json(), await requireViewer()));
}
