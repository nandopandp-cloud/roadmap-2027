import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { readSession, type Viewer } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";

/** Pessoa conectada na requisição atual (rotas e componentes de servidor). */
export async function getViewer(): Promise<Viewer | null> {
  const store = await cookies();
  return readSession(store.get(SESSION_COOKIE)?.value);
}

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new DomainError(401, "Sessão expirada. Entre novamente com sua conta Google.");
  return viewer;
}

/** Barreira das rotas que alteram dados (o proxy também bloqueia; esta é a segunda camada). */
export async function requireEditor(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== "editor") throw new DomainError(403, "Seu perfil é somente de consulta. Peça acesso de edição ao time de Produto.");
  return viewer;
}
