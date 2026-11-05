import { NextResponse, type NextRequest } from "next/server";
import { OAUTH_COOKIE, OAUTH_TTL_SECONDS, safeNextPath } from "@/lib/auth/config";
import { authorizeUrl, createPkce, googleConfig, newState } from "@/lib/auth/google";
import { authSecret, signToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Início do login: GET /api/auth/google?next=/caminho → tela de contas do Google. */
export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  const config = googleConfig();
  if (!config || !authSecret()) {
    return NextResponse.redirect(new URL("/login?erro=config", origin), 303);
  }

  const state = newState();
  const { verifier, challenge } = await createPkce();
  const response = NextResponse.redirect(authorizeUrl(config, origin, state, challenge), 303);
  response.cookies.set(OAUTH_COOKIE, await signToken({ state, verifier, next }, OAUTH_TTL_SECONDS), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: OAUTH_TTL_SECONDS,
  });
  return response;
}
