/**
 * Tokens assinados (HMAC-SHA256 com AUTH_SECRET) para a sessão e para o estado
 * do login no Google. Usa apenas Web Crypto: roda no proxy e nas rotas.
 */
import { isAllowedEmail, type Role } from "@/lib/auth/config";
import type { AccessLevel } from "@/lib/domain/types";

export interface SessionUser {
  email: string;
  name: string;
  picture: string;
}

/** Pessoa conectada com a permissão lida do cadastro a cada requisição (lib/auth/server.ts). */
export interface Viewer extends SessionUser {
  role: Role;
  access: AccessLevel;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Segredo de assinatura; null quando ausente ou curto demais (login fica indisponível). */
export function authSecret(): string | null {
  const secret = process.env.AUTH_SECRET?.trim();
  return secret && secret.length >= 32 ? secret : null;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

/** Assina um objeto com validade (`exp`, em segundos desde a época). */
export async function signToken(payload: Record<string, unknown>, ttlSeconds: number): Promise<string> {
  const secret = authSecret();
  if (!secret) throw new Error("AUTH_SECRET ausente ou com menos de 32 caracteres.");
  const body = toBase64Url(encoder.encode(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await hmacKey(secret), encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

/** Devolve o conteúdo se a assinatura confere e a validade não passou; senão null. */
export async function verifyToken(token: string | undefined): Promise<Record<string, unknown> | null> {
  const secret = authSecret();
  if (!secret || !token) return null;
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra !== undefined) return null;
  try {
    const sig = fromBase64Url(signature);
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(secret), sig as Uint8Array<ArrayBuffer>, encoder.encode(body));
    if (!ok) return null;
    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as Record<string, unknown>;
    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSessionToken(user: SessionUser, ttlSeconds: number): Promise<string> {
  return signToken({ email: user.email, name: user.name, picture: user.picture }, ttlSeconds);
}

/**
 * Lê o cookie de sessão. Revalida o domínio: um token antigo não sobrevive a mudança de regra.
 * A permissão não fica no cookie: é lida do cadastro a cada requisição, então mudar vale na hora.
 */
export async function readSession(token: string | undefined): Promise<SessionUser | null> {
  const payload = await verifyToken(token);
  if (!payload || typeof payload.email !== "string" || !isAllowedEmail(payload.email)) return null;
  const email = payload.email.toLowerCase();
  return {
    email,
    name: typeof payload.name === "string" && payload.name ? payload.name : email,
    picture: typeof payload.picture === "string" ? payload.picture : "",
  };
}
