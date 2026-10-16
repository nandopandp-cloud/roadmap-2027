import { handle } from "@/lib/http/handle";
import { getSnapshot } from "@/lib/services/roadmap-service";

export const dynamic = "force-dynamic";

export function GET() {
  return handle(getSnapshot);
}
