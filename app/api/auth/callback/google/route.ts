import { NextResponse, type NextRequest } from "next/server";
import { ALLOWED_DOMAIN, OAUTH_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS, isAllowedEmail, safeNextPath } from "@/lib/auth/config";
import { exchangeCode, googleConfig } from "@/lib/auth/google";
import { createSessionToken, verifyToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Retorno do Google: confere estado, domínio e cria a sessão. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const params = request.nextUrl.searchParams;
  const fail = (erro: string) => {
    const response = NextResponse.redirect(new URL(`/login?erro=${erro}`, origin), 303);
    response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
    return response;
  };

  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "cancelado" : "falha");

  const config = googleConfig();
  if (!config) return fail("config");

  const pending = await verifyToken(request.cookies.get(OAUTH_COOKIE)?.value);
  const code = params.get("code");
  if (!pending || !code || typeof pending.state !== "string" || pending.state !== params.get("state") || typeof pending.verifier !== "string") {
    return fail("expirado");
  }

  let identity;
  try {
    identity = await exchangeCode(config, origin, code, pending.verifier);
  } catch (error) {
    console.error("[auth] falha no retorno do Google:", error instanceof Error ? error.message : error);
    return fail("falha");
  }

  if (!identity.emailVerified || identity.hostedDomain !== ALLOWED_DOMAIN || !isAllowedEmail(identity.email)) {
    return fail("dominio");
  }

  const next = safeNextPath(typeof pending.next === "string" ? pending.next : "/");
  const response = NextResponse.redirect(new URL(next, origin), 303);
  response.cookies.delete({ name: OAUTH_COOKIE, path: "/api/auth" });
  response.cookies.set(
    SESSION_COOKIE,
    await createSessionToken({ email: identity.email, name: identity.name, picture: identity.picture }, SESSION_TTL_SECONDS),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    },
  );
  return response;
}
