/**
 * Regras de acesso. Só contas Google do domínio institucional entram. O nível de cada pessoa
 * (Administração, Edição, Consulta) fica no cadastro de Times & Squads e é alterado pelos
 * administradores na própria plataforma (lib/domain/access.ts).
 */

export const ALLOWED_DOMAIN = "jovensgenios.com";

/**
 * Administradores de origem (sempre em minúsculas): o acesso de edição de antes da permissão por
 * pessoa. Valem como administradores enquanto não estão cadastrados em Times & Squads e sempre que
 * não houver nenhum administrador cadastrado. Cadastrados, vale o nível gravado no cadastro.
 */
export const FOUNDING_ADMIN_EMAILS: readonly string[] = ["fernando.rodrigues@jovensgenios.com", "joaofigueroa@jovensgenios.com"];

/** Pode alterar conteúdo (Administração ou Edição) ou só consultar. */
export type Role = "editor" | "leitor";

export function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

export const SESSION_COOKIE = "jg_session";
export const OAUTH_COOKIE = "jg_oauth";
/** Duração da sessão: 7 dias. */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
/** Janela para concluir o login no Google: 10 minutos. */
export const OAUTH_TTL_SECONDS = 60 * 10;

/** Caminho interno seguro para voltar depois do login (evita redirecionamento aberto). */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return "/";
  if (value.startsWith("/login") || value.startsWith("/api/")) return "/";
  return value;
}
