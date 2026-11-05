/**
 * Regras de acesso. Só contas Google do domínio institucional entram; apenas os
 * e-mails de edição podem criar, alterar, mover ou remover conteúdo. Os demais
 * entram em modo consulta.
 */

export const ALLOWED_DOMAIN = "jovensgenios.com";

/** Pessoas com permissão de edição (sempre em minúsculas). */
export const EDITOR_EMAILS: readonly string[] = ["fernando.rodrigues@jovensgenios.com", "joaofigueroa@jovensgenios.com"];

export type Role = "editor" | "leitor";

export const ROLE_LABEL: Record<Role, string> = { editor: "Edição", leitor: "Somente consulta" };

export function isAllowedEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

/** O perfil é calculado a cada requisição: mudar a lista vale sem novo login. */
export function roleFor(email: string): Role {
  return EDITOR_EMAILS.includes(email.trim().toLowerCase()) ? "editor" : "leitor";
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
