import { handle } from "@/lib/http/handle";
import { DomainError } from "@/lib/services/errors";
import { fetchRemoteImage } from "@/lib/services/remote-image";
import { remoteImageRequestSchema } from "@/lib/validation/schemas";

/** Baixa uma imagem a partir de um link da web para ser ajustada no editor. */
export function POST(request: Request) {
  return handle(async () => {
    const parsed = remoteImageRequestSchema.safeParse(await request.json());
    if (!parsed.success) throw new DomainError(400, "Informe o link da imagem.", { url: "Informe o link da imagem." });
    return fetchRemoteImage(parsed.data.url);
  });
}
