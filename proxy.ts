import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { readSession } from "@/lib/auth/session";

/**
 * Porta de entrada: toda página, API e protótipo exige sessão Google do domínio, e alterações
 * (qualquer método além de GET/HEAD) só são aceitas da própria origem. O perfil (Administração,
 * Edição, Consulta) fica no cadastro de Times & Squads e é conferido em cada rota que altera dados
 * (lib/http/handle.ts → handleEdit; esforço, justificativa e Roadmap 2026 conferem pelo cargo no serviço).
 */

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Aviso de alteração enviado pela planilha (Apps Script): autenticado pelo segredo na própria rota. */
const SHEET_NOTICE = "/api/roadmap/2026/sincronizar";

function isPublic(pathname: string): boolean {
  return pathname === "/login" || pathname.startsWith("/api/auth/") || pathname === SHEET_NOTICE;
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
  }

  return NextResponse.next();
}

export const config = {
  // Arquivos estáticos públicos (marca, ilustrações, ícone) ficam fora; o resto passa aqui.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|robots.txt|brand/|illustrations/).*)"],
};
