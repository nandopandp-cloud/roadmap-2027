import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth/config";

/** Encerra a sessão: POST /api/auth/logout (formulário da sidebar). */
export function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login?saiu=1", request.nextUrl.origin), 303);
  response.cookies.delete({ name: SESSION_COOKIE, path: "/" });
  return response;
}
