import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { readSession } from "@/lib/auth/session";

/**
 * Porta de entrada: toda página, API e protótipo exige sessão Google do domínio.
 * Alterações (qualquer método além de GET/HEAD) exigem perfil de edição.
 * As rotas de API repetem a checagem de edição (lib/http/handle.ts → handleEdit).
 */

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function isPublic(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/api/auth/");
}

function jsonError(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const viewer = await readSession(request.cookies.get(SESSION_COOKIE)?.value);

  if (isPublic(pathname)) {
    // Quem já está conectado não precisa ver a tela de login.
    if (pathname === "/login" && viewer) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  if (!viewer) {
    if (isApi) return jsonError(401, "Sessão expirada. Entre novamente com sua conta Google.");
    const login = new URL("/login", request.url);
    if (pathname !== "/") login.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (!READ_METHODS.has(request.method)) {
    // Bloqueia envios de outros sites (o cookie SameSite=Lax já impede a maioria).
    const origin = request.headers.get("origin");
    if (origin && origin !== request.nextUrl.origin) return jsonError(403, "Origem da requisição não permitida.");
    if (viewer.role !== "editor") return jsonError(403, "Seu perfil é somente de consulta. Peça acesso de edição ao time de Produto.");
  }

  return NextResponse.next();
}

export const config = {
  // Arquivos estáticos públicos (marca, ilustrações, ícone) ficam fora; o resto passa aqui.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|brand/|illustrations/).*)"],
};
