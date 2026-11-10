import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { uploadAttachmentPart } from "@/lib/services/effort-attachments";

type Ctx = { params: Promise<{ upload: string; part: string }> };

/**
 * Parte de um arquivo da justificativa do esforço (corpo binário, até 3 MB). O arquivo
 * só passa a existir quando o envio é concluído em /api/initiatives/<id>/esforco/anexos.
 */
export async function PUT(request: Request, { params }: Ctx) {
  const { upload, part } = await params;
  return handle(async () => {
    await uploadAttachmentPart(upload, Number(part), Buffer.from(await request.arrayBuffer()), await requireViewer());
    return { ok: true };
  });
}
