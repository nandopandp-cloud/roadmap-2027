import { PRD_REVIEWER_EMAILS } from "@/lib/auth/config";
import { DOCUMENT_STATUS_LABEL } from "@/lib/domain/labels";
import type { Actor, DocumentRef, Person } from "@/lib/domain/types";

/**
 * Revisão de PRDs. PRD criado por quem não revisa entra "Em revisão"; só quem revisa
 * (PRD_REVIEWER_EMAILS) aprova; e um PRD aprovado alterado por outra pessoa volta para revisão.
 * Vale no servidor (regra) e na interface (o que mostrar).
 */

const normalize = (email: string) => email.trim().toLowerCase();

export const isPrdReviewer = (email: string | null | undefined) => !!email && PRD_REVIEWER_EMAILS.includes(normalize(email));

/** Nome de quem revisa, pelo cadastro de Times & Squads; null quando ninguém está cadastrado. */
export function reviewerNames(people: Pick<Person, "email" | "name">[]): string | null {
  const names = PRD_REVIEWER_EMAILS.map((e) => people.find((p) => p.email && normalize(p.email) === e)?.name).filter(Boolean);
  return names.length ? names.join(" ou ") : null;
}

/** "Fernando Rodrigues" ou, sem cadastro, "o revisor de PRDs". */
export const reviewerLabel = (people: Pick<Person, "email" | "name">[]) => reviewerNames(people) ?? "o revisor de PRDs";

export class PrdReviewError extends Error {}

/**
 * Status de um PRD depois de uma alteração feita por `actor`. `before` é o documento antes
 * (ausente quando o PRD é novo) e `changed` indica se texto, versão ou dados mudaram.
 * Lança PrdReviewError quando quem não revisa tenta aprovar.
 */
export function reviewedStatus(
  before: Pick<DocumentRef, "kind" | "status"> | undefined,
  next: Pick<DocumentRef, "kind" | "status">,
  actor: Pick<Actor, "email">,
  changed: boolean,
): DocumentRef["status"] {
  if (next.kind !== "prd" || isPrdReviewer(actor.email)) return next.status;
  // PRD novo entra em revisão, qualquer que seja o status escolhido.
  if (!before || before.kind !== "prd") return "em_revisao";
  if (next.status === "aprovado" && before.status !== "aprovado") {
    throw new PrdReviewError(`Só quem revisa PRDs aprova um PRD. Ele fica como “${DOCUMENT_STATUS_LABEL.em_revisao}” até a revisão.`);
  }
  if (changed && before.status === "aprovado") return "em_revisao";
  return next.status;
}
