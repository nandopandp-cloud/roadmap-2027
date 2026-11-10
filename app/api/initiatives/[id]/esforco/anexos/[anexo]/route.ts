import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { removeEffortAttachment } from "@/lib/services/effort-attachments";

type Ctx = { params: Promise<{ id: string; anexo: string }> };

/** Remove um anexo da justificativa do esforço (checagem por frente no serviço). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const { id, anexo } = await params;
  return handle(async () => removeEffortAttachment(id, anexo, await requireViewer()));
}
