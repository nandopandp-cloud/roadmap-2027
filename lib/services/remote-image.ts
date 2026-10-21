import "server-only";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { DomainError } from "@/lib/services/errors";

const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;
const ALLOWED_TYPES = /^image\/(jpeg|png|webp|gif)$/;

/** Bloqueia endereços internos (loopback, rede privada, link-local) para evitar SSRF. */
function isPrivateAddress(address: string) {
  if (isIP(address) === 6) {
    const a = address.toLowerCase();
    if (a.startsWith("::ffff:")) return isPrivateAddress(a.slice(7));
    return a === "::1" || a === "::" || a.startsWith("fc") || a.startsWith("fd") || a.startsWith("fe80");
  }
  const [a, b] = address.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
}

async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new DomainError(400, "Link inválido.", { url: "Informe um endereço completo, começando com https://." });
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new DomainError(400, "Use um link http ou https.");
  const addresses = await lookup(url.hostname, { all: true }).catch(() => {
    throw new DomainError(400, "Não foi possível encontrar esse endereço.");
  });
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new DomainError(400, "Esse endereço não é permitido.");
  return url;
}

/**
 * Baixa uma imagem pública pelo servidor (o navegador não pode desenhar imagens de outra origem
 * no canvas sem CORS) e devolve como data URL para o editor de imagem.
 */
export async function fetchRemoteImage(raw: string): Promise<{ dataUrl: string }> {
  let url = await assertPublicUrl(raw.trim());
  let response: Response | null = null;
  // Segue até 3 redirecionamentos, validando cada destino.
  for (let hop = 0; hop < 4; hop++) {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(TIMEOUT_MS), headers: { Accept: "image/*" } }).catch(() => {
      throw new DomainError(502, "Não foi possível baixar a imagem desse link.");
    });
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    break;
  }
  if (!response || !response.ok) throw new DomainError(502, "Não foi possível baixar a imagem desse link.");
  const type = (response.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.test(type)) throw new DomainError(415, "O link não aponta para uma imagem JPG, PNG, WebP ou GIF.");
  const declared = Number(response.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new DomainError(413, "A imagem é grande demais (máximo de 8 MB).");
  const data = Buffer.from(await response.arrayBuffer());
  if (data.length > MAX_BYTES) throw new DomainError(413, "A imagem é grande demais (máximo de 8 MB).");
  return { dataUrl: `data:${type};base64,${data.toString("base64")}` };
}
