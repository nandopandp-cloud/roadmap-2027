import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/config";
import { cache } from "react";
import { readSession, type Viewer } from "@/lib/auth/session";
import { accessFor } from "@/lib/domain/access";
import { getRepository } from "@/lib/repositories";
import { DomainError } from "@/lib/services/errors";

/**
 * Pessoa conectada na requisição atual (rotas e componentes de servidor), com a permissão lida do
 * cadastro de Times & Squads — mudar a permissão vale na próxima requisição, sem novo login.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const store = await cookies();
  const user = await readSession(store.get(SESSION_COOKIE)?.value);
  if (!user) return null;
  // Sem acesso ao armazenamento, só os administradores de origem são reconhecidos.
  const people = await getRepository()
    .readPeople()
    .catch((error) => {
      console.error("[roadmap] não foi possível ler as permissões:", error);
      return [];
    });
  const access = accessFor(user.email, people);
  return { ...user, access, role: access === "consulta" ? "leitor" : "editor" };
});

export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) throw new DomainError(401, "Sessão expirada. Entre novamente com sua conta Google.");
  return viewer;
}

/** Barreira das rotas que alteram dados (o proxy confere sessão e origem; o perfil é conferido aqui). */
export async function requireEditor(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== "editor") throw new DomainError(403, "Seu perfil é somente de consulta. Peça acesso de edição a um administrador.");
  return viewer;
}
