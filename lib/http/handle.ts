import "server-only";
import { NextResponse } from "next/server";
import { requireEditor } from "@/lib/auth/server";
import type { Viewer } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";

/** Executa um handler de rota convertendo erros de domínio em respostas JSON padronizadas. */
export async function handle<T>(fn: () => Promise<T>, status = 200): Promise<NextResponse> {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true }, { status });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.message, fields: error.fields }, { status: error.status });
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
    }
    console.error("[roadmap] erro inesperado:", error);
    // Código técnico (ex.: ENOENT) para diagnóstico, sem expor caminhos ou stack.
    const code = (error as { code?: unknown })?.code ?? (error as Error)?.name;
    return NextResponse.json(
      { error: "Erro inesperado ao processar a solicitação.", code: typeof code === "string" ? code : undefined },
      { status: 500 },
    );
  }
}

/** Como `handle`, mas só para quem tem perfil de edição (rotas que alteram dados). Recebe quem está conectado. */
export async function handleEdit<T>(fn: (viewer: Viewer) => Promise<T>, status = 200): Promise<NextResponse> {
  return handle(async () => fn(await requireEditor()), status);
}
