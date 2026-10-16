import { handle } from "@/lib/http/handle";
import { getImageStore, storageKind } from "@/lib/repositories";
import { READ_ONLY_MESSAGE } from "@/lib/repositories/json-file-repository";
import { DomainError } from "@/lib/services/errors";

const MAX_BYTES = 3 * 1024 * 1024;

/** Recebe um JPEG (corpo binário) e devolve o identificador da imagem. */
export function POST(request: Request) {
  return handle(async () => {
    const data = Buffer.from(await request.arrayBuffer());
    if (data.length === 0) throw new DomainError(400, "Nenhuma imagem foi enviada.");
    if (data.length > MAX_BYTES) throw new DomainError(413, "A imagem é grande demais (máximo de 3 MB).");
    // Somente JPEG (o editor sempre exporta nesse formato): confere a assinatura do arquivo.
    if (!(data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff)) throw new DomainError(415, "Formato de imagem inválido.");
    const id = crypto.randomUUID();
    try {
      await getImageStore().save(id, data);
    } catch (error) {
      if (storageKind() === "arquivo" && (error as NodeJS.ErrnoException).code) throw new DomainError(503, READ_ONLY_MESSAGE);
      throw error;
    }
    return { id };
  }, 201);
}
