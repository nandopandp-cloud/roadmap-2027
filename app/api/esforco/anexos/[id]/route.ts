import { opensInline } from "@/lib/domain/effort-attachments";
import { readEffortAttachment } from "@/lib/services/effort-attachments";

export const dynamic = "force-dynamic";

/** Nome no cabeçalho Content-Disposition (RFC 6266/5987), com alternativa ASCII. */
function disposition(name: string, inline: boolean) {
  const ascii = name.normalize("NFD").replace(/[^\x20-\x7e]/g, "").replace(/["\\]/g, "_") || "anexo";
  return `${inline ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

/**
 * Entrega um arquivo da justificativa do esforço a quem está conectado (o proxy exige
 * sessão). Imagens e PDFs abrem no navegador; os demais tipos são sempre baixados.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const file = await readEffortAttachment(id);
  if (!file) return new Response("Anexo não encontrado.", { status: 404 });
  const inline = opensInline(file.name);
  const headers: Record<string, string> = {
    "Content-Type": file.contentType,
    "Content-Disposition": disposition(file.name, inline),
    "X-Content-Type-Options": "nosniff",
    // Ids são únicos e o arquivo não muda; privado porque exige login.
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  // Imagens não executam nada, mas isolamos por garantia (o leitor de PDF do Chrome não funciona com sandbox).
  if (!file.contentType.startsWith("application/pdf")) headers["Content-Security-Policy"] = "sandbox; default-src 'none'; img-src 'self'";
  return new Response(new Uint8Array(file.data), { headers });
}
