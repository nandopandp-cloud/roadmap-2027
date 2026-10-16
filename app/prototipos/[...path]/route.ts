import { readPrototypeFile } from "@/lib/services/artifacts";

export const dynamic = "force-dynamic";

/**
 * Serve protótipos HTML locais (initiatives/<pasta>/prototype/...) de forma isolada.
 * O cabeçalho CSP `sandbox` faz o navegador tratar o conteúdo como origem opaca,
 * mesmo quando aberto em nova aba: o protótipo não acessa cookies, storage
 * nem o DOM da aplicação principal.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const relPath = ["initiatives", ...path].join("/");
  const file = await readPrototypeFile(relPath);
  if (!file) {
    return new Response("Protótipo não encontrado.", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.type,
      "Content-Security-Policy": "sandbox allow-scripts allow-forms allow-modals allow-popups allow-downloads",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Cache-Control": "no-store",
    },
  });
}
