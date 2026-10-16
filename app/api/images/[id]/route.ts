import { getImageStore } from "@/lib/repositories";

export const dynamic = "force-dynamic";

/** Entrega a imagem. Os ids são únicos e imutáveis, então o cache pode ser longo. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Não encontrada.", { status: 404 });
  const data = await getImageStore().read(id);
  if (!data) return new Response("Não encontrada.", { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: { "Content-Type": "image/jpeg", "X-Content-Type-Options": "nosniff", "Cache-Control": "public, max-age=31536000, immutable" },
  });
}
