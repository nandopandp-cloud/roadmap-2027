import { handle } from "@/lib/http/handle";
import { analyzePrd } from "@/lib/services/roadmap-service";

/** Identifica no texto de um PRD os campos de uma nova iniciativa (não grava nada). */
export function POST(request: Request) {
  return handle(async () => analyzePrd(await request.json()));
}
