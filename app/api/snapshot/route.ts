import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { getSnapshot } from "@/lib/services/roadmap-service";

export const dynamic = "force-dynamic";

/** Dados da aplicação + quem está conectado. `writable` já considera o perfil da pessoa. */
export function GET() {
  return handle(async () => {
    const viewer = await requireViewer();
    const snapshot = await getSnapshot();
    const canEdit = viewer.role === "editor";
    return {
      ...snapshot,
      writable: snapshot.writable && canEdit,
      readOnlyReason: !snapshot.writable ? "armazenamento" : canEdit ? null : "perfil",
      viewer,
    };
  });
}
