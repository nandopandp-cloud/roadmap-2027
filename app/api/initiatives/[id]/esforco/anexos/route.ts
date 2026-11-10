import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { addEffortAttachment } from "@/lib/services/effort-attachments";

type Ctx = { params: Promise<{ id: string }> };

/** Anexa um link ou conclui o envio de um arquivo na justificativa de uma frente (checagem por frente no serviço). */
export async function POST(request: Request, { params }: Ctx) {
  const { id } = await params;
  return handle(async () => addEffortAttachment(id, await request.json(), await requireViewer()), 201);
}
