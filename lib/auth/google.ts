import "server-only";
import { ALLOWED_DOMAIN } from "@/lib/auth/config";
import { fromBase64Url } from "@/lib/auth/session";

/** Login com Google (OpenID Connect, fluxo de código com PKCE). */

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = ["https://accounts.google.com", "accounts.google.com"];

export interface GoogleConfig {
  clientId: string;
  clientSecret: string;
}

export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function callbackUrl(origin: string): string {
  return `${origin}/api/auth/callback/google`;
}

function randomString(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...data)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function createPkce(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomString(48);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  const challenge = btoa(String.fromCharCode(...digest)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

export function newState(): string {
  return randomString(24);
}

export function authorizeUrl(config: GoogleConfig, origin: string, state: string, challenge: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: callbackUrl(origin),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    // Sugere ao seletor de contas apenas contas do domínio (a checagem real é no retorno).
    hd: ALLOWED_DOMAIN,
    prompt: "select_account",
  });
  return `${AUTHORIZE_URL}?${params}`;
}

export interface GoogleIdentity {
  email: string;
  emailVerified: boolean;
  hostedDomain: string;
  name: string;
  picture: string;
}

/**
 * Troca o código pelo id_token. O token chega direto do Google por TLS, então
 * a OpenID Connect dispensa verificar a assinatura (Core 1.0, §3.1.3.7, item 6);
 * emissor, público e validade são conferidos aqui.
 */
export async function exchangeCode(config: GoogleConfig, origin: string, code: string, verifier: string): Promise<GoogleIdentity> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: callbackUrl(origin),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`Google recusou a troca do código (${response.status}).`);
  const { id_token: idToken } = (await response.json()) as { id_token?: string };
  const part = idToken?.split(".")[1];
  if (!part) throw new Error("Resposta do Google sem id_token.");
  const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(part))) as Record<string, unknown>;

  if (!ISSUERS.includes(String(claims.iss))) throw new Error("Emissor do token inválido.");
  if (claims.aud !== config.clientId) throw new Error("Token emitido para outro aplicativo.");
  if (typeof claims.exp !== "number" || claims.exp < Date.now() / 1000) throw new Error("Token expirado.");

  return {
    email: typeof claims.email === "string" ? claims.email.toLowerCase() : "",
    emailVerified: claims.email_verified === true || claims.email_verified === "true",
    hostedDomain: typeof claims.hd === "string" ? claims.hd.toLowerCase() : "",
    name: typeof claims.name === "string" ? claims.name : "",
    picture: typeof claims.picture === "string" ? claims.picture : "",
  };
}
