import "server-only";
import { after } from "next/server";
import { isPrdReviewer } from "@/lib/domain/prd-review";
import type { Actor } from "@/lib/domain/types";

/**
 * Alerta por e-mail das alterações em iniciativas e PRDs feitas por quem não revisa PRDs
 * (PRD_REVIEWER_EMAILS em lib/auth/config.ts). Enviado pelo Resend (https://resend.com) depois
 * da resposta, sem atrasar quem salvou; uma falha no envio só é registrada no log.
 *
 * Variáveis: RESEND_API_KEY e ALERT_EMAIL_TO (destinatários separados por vírgula) ligam os
 * alertas; ALERT_EMAIL_FROM é o remetente (padrão: o de testes do Resend, que só entrega para
 * o e-mail da própria conta do Resend); APP_URL monta os links (padrão: produção).
 */

const DEFAULT_FROM = "Roadmap JG <onboarding@resend.dev>";
const DEFAULT_APP_URL = "https://roadmap-2027.vercel.app";

export interface ChangeAlert {
  /** Ex.: "criou a iniciativa", "atualizou o PRD". */
  action: string;
  initiative: { id: string; title: string };
  /** O que mudou (as mesmas descrições do histórico). */
  details: string[];
  /** Documento afetado, para o link direto. */
  documentId?: string;
  at: string;
}

let warned = false;

function config() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = (process.env.ALERT_EMAIL_TO ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  if (!apiKey || !to.length) return null;
  const from = process.env.ALERT_EMAIL_FROM?.trim() || DEFAULT_FROM;
  const appUrl = (process.env.APP_URL?.trim() || DEFAULT_APP_URL).replace(/\/+$/, "");
  return { apiKey, to, from, appUrl };
}

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const when = (iso: string) =>
  new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));

/** Assunto, texto e HTML do alerta. */
export function alertMessage(actor: Actor, alert: ChangeAlert, appUrl: string) {
  const name = actor.name || actor.email;
  const subject = `[Roadmap JG] ${name} ${alert.action}: ${alert.initiative.id} ${alert.initiative.title}`;
  const link = alert.documentId
    ? `${appUrl}/iniciativas/${alert.initiative.id}/documentos/${encodeURIComponent(alert.documentId)}`
    : `${appUrl}/iniciativas?iniciativa=${alert.initiative.id}&aba=roadmap`;
  const details = alert.details.length ? alert.details : ["Sem detalhes registrados."];
  const text = [
    `${name} (${actor.email}) ${alert.action}.`,
    `Iniciativa: ${alert.initiative.id} — ${alert.initiative.title}`,
    `Quando: ${when(alert.at)} (horário de Brasília)`,
    "",
    "O que mudou:",
    ...details.map((d) => `- ${d}`),
    "",
    `Abrir: ${link}`,
  ].join("\n");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#171b4d;font-size:14px;line-height:1.5">
<p><strong>${escape(name)}</strong> (${escape(actor.email)}) ${escape(alert.action)}.</p>
<p><strong>Iniciativa:</strong> ${escape(alert.initiative.id)} — ${escape(alert.initiative.title)}<br>
<strong>Quando:</strong> ${escape(when(alert.at))} (horário de Brasília)</p>
<p><strong>O que mudou:</strong></p>
<ul>${details.map((d) => `<li>${escape(d)}</li>`).join("")}</ul>
<p><a href="${escape(link)}" style="color:#1f55c4;font-weight:bold">Abrir no Roadmap JG</a></p>
</div>`;
  return { subject, text, html };
}

async function send(actor: Actor, alert: ChangeAlert) {
  const cfg = config();
  if (!cfg) {
    if (!warned) console.warn("[roadmap] alertas por e-mail desligados: defina RESEND_API_KEY e ALERT_EMAIL_TO.");
    warned = true;
    return;
  }
  const { subject, text, html } = alertMessage(actor, alert, cfg.appUrl);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: cfg.from, to: cfg.to, subject, text, html, reply_to: actor.email }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) console.error(`[roadmap] alerta por e-mail recusado (${response.status}):`, (await response.text()).slice(0, 300));
  } catch (error) {
    console.error("[roadmap] não foi possível enviar o alerta por e-mail:", error);
  }
}

/** Agenda o alerta (depois da resposta). Alterações de quem revisa PRDs não geram alerta. */
export function alertChange(actor: Actor, alert: ChangeAlert) {
  if (isPrdReviewer(actor.email)) return;
  try {
    after(() => send(actor, alert));
  } catch {
    // Fora de uma requisição (scripts), envia na hora.
    void send(actor, alert);
  }
}
