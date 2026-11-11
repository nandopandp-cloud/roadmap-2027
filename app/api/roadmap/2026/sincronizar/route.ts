import { createHash, timingSafeEqual } from "node:crypto";
import { handle } from "@/lib/http/handle";
import { DomainError } from "@/lib/services/errors";
import { syncRoadmap2026FromNotice, syncSecret } from "@/lib/services/roadmap-2026-sync";

export const dynamic = "force-dynamic";
// Leitura da planilha e até duas novas tentativas (o Google pode demorar a refletir a alteração).
export const maxDuration = 60;

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Aviso de alteração enviado pela planilha (Apps Script, scripts/planilha-roadmap-2026.gs).
 * Não usa sessão Google: autentica pelo segredo `ROADMAP_SYNC_SECRET` no cabeçalho
 * `Authorization: Bearer <segredo>`. Só dispara a leitura da planilha; não recebe dados.
 */
export function POST(request: Request) {
  return handle(async () => {
    const secret = syncSecret();
    if (!secret) throw new DomainError(503, "Aviso da planilha não configurado (ROADMAP_SYNC_SECRET).");
    const sent = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "")?.[1]?.trim() ?? "";
    if (!sent || !timingSafeEqual(digest(sent), digest(secret))) throw new DomainError(401, "Segredo inválido.");
    const result = await syncRoadmap2026FromNotice();
    if (!result.ok) throw new DomainError(502, result.error ?? "Não foi possível ler a planilha.");
    return result;
  });
}
