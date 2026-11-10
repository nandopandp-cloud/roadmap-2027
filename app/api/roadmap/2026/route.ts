import { requireViewer } from "@/lib/auth/server";
import { handle } from "@/lib/http/handle";
import { getRoadmap2026 } from "@/lib/services/roadmap-2026";

export const dynamic = "force-dynamic";

/** Roadmap 2026 (projeção importada da planilha, somente leitura). */
export function GET() {
  return handle(async () => {
    await requireViewer();
    return getRoadmap2026();
  });
}
