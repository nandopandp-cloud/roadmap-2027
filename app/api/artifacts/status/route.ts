import { handle } from "@/lib/http/handle";
import { artifactExists } from "@/lib/services/artifacts";
import { DOCUMENT_EXTENSIONS, PROTOTYPE_EXTENSIONS } from "@/lib/validation/paths";

export const dynamic = "force-dynamic";

/** Verifica se arquivos referenciados existem: GET /api/artifacts/status?path=a&path=b */
export function GET(request: Request) {
  return handle(async () => {
    const paths = new URL(request.url).searchParams.getAll("path").slice(0, 50);
    const exts = [...DOCUMENT_EXTENSIONS, ...PROTOTYPE_EXTENSIONS];
    const entries = await Promise.all(paths.map(async (p) => [p, await artifactExists(p, exts)] as const));
    return Object.fromEntries(entries);
  });
}
