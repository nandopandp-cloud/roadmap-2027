"use client";

import { useState } from "react";
import { Avatar } from "@/components/org/avatar";
import { cn, formatDate, formatDateTime } from "@/lib/client/cn";
import { useCanEdit, useRoadmap } from "@/lib/client/store";
import { personForEmail } from "@/lib/domain/access";
import { initials } from "@/lib/domain/org";
import { isPrdReviewer } from "@/lib/domain/prd-review";
import type { Actor } from "@/lib/domain/types";

/** Quem está conectado revisa PRDs (aprova os que estão em revisão). */
export function useIsPrdReviewer(): boolean {
  const { data } = useRoadmap();
  return useCanEdit() && isPrdReviewer(data.viewer?.email);
}

/** Nome exibido: o do cadastro em Times & Squads, quando existe; senão o da conta Google. */
export function useActorName() {
  const { data } = useRoadmap();
  return (actor: Actor) => personForEmail(data.people, actor.email)?.name ?? (actor.name || actor.email);
}

/** Foto de quem fez a alteração: a do cadastro em Times & Squads, a da conta Google ou as iniciais. */
export function ActorAvatar({ actor, size = 24, className }: { actor: Actor | undefined; size?: number; className?: string }) {
  const { data } = useRoadmap();
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size };
  if (!actor) {
    return (
      <span
        aria-hidden
        className={cn("inline-flex shrink-0 items-center justify-center rounded-full bg-[#eef2fa] font-extrabold text-subtle ring-2 ring-white", className)}
        style={{ ...style, fontSize: Math.max(10, Math.round(size * 0.4)) }}
      >
        ?
      </span>
    );
  }
  const person = personForEmail(data.people, actor.email);
  if (person?.photo) return <Avatar person={person} size={size} className={className} />;
  if (actor.picture && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- foto da conta Google (domínio externo)
      <img
        src={actor.picture}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)}
        style={style}
      />
    );
  }
  if (person) return <Avatar person={person} size={size} className={className} />;
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full bg-violet font-extrabold text-white ring-2 ring-white", className)}
      style={{ ...style, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {initials(actor.name || actor.email)}
    </span>
  );
}

/**
 * "Criado por [foto] Nome · data e hora". Sem autor (registros anteriores à autoria), mostra só a
 * data e avisa que o autor não foi registrado — nunca um nome presumido.
 */
export function Authorship({
  label,
  actor,
  at,
  size = 22,
  className,
}: {
  label: string;
  actor: Actor | undefined;
  at: string | undefined;
  size?: number;
  className?: string;
}) {
  const nameOf = useActorName();
  const when = at ? (at.length > 10 ? formatDateTime(at) : formatDate(at)) : "";
  return (
    <p className={cn("flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[12.5px] text-muted", className)}>
      <span>{label}</span>
      {actor ? (
        <>
          <ActorAvatar actor={actor} size={size} />
          <span className="font-bold text-ink" title={actor.email}>
            {nameOf(actor)}
          </span>
        </>
      ) : (
        <span className="italic text-subtle">autor não registrado</span>
      )}
      {when && <span>· {when}</span>}
    </p>
  );
}

export interface TimelineItem {
  key: string;
  /** Data e hora (ISO) ou só a data (AAAA-MM-DD) dos registros antigos. */
  at: string;
  by?: Actor;
  /** Etiqueta curta antes do texto (ex.: "v1.2"). */
  tag?: string;
  text: string;
}

/** Linha do tempo com foto, nome, data e hora de cada alteração (mais recente primeiro). */
export function ActivityTimeline({ items, limit = 6, empty = "Nenhuma alteração registrada." }: { items: TimelineItem[]; limit?: number; empty?: string }) {
  const nameOf = useActorName();
  const [all, setAll] = useState(false);
  if (!items.length) return <p className="text-[14px] italic text-subtle">{empty}</p>;
  const shown = all ? items : items.slice(0, limit);
  return (
    <div>
      <ol className="flex flex-col">
        {shown.map((item, idx) => (
          <li key={item.key} className="relative flex gap-3 pb-4 last:pb-0">
            {idx < shown.length - 1 && <span aria-hidden className="absolute bottom-0 left-[13px] top-8 w-0.5 bg-line" />}
            <ActorAvatar actor={item.by} size={28} className="relative z-[1]" />
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="flex flex-wrap items-baseline gap-x-1.5 text-[12.5px]">
                {item.by ? (
                  <span className="font-extrabold text-ink" title={item.by.email}>
                    {nameOf(item.by)}
                  </span>
                ) : (
                  <span className="font-semibold italic text-subtle">Autor não registrado</span>
                )}
                <span className="text-subtle">· {item.at.length > 10 ? formatDateTime(item.at) : formatDate(item.at)}</span>
              </p>
              <p className="mt-0.5 text-[13.5px] leading-snug text-ink">
                {item.tag && <span className="mr-1.5 font-bold text-navy">{item.tag}</span>}
                {item.text}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {items.length > limit && (
        <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 text-[13px] font-bold text-blue hover:underline" aria-expanded={all}>
          {all ? "Mostrar menos" : `Ver linha do tempo completa (${items.length})`}
        </button>
      )}
    </div>
  );
}

/** Versões de um documento como itens da linha do tempo. */
export const versionTimeline = (versions: { version: string; date: string; note: string; at?: string; by?: Actor }[]): TimelineItem[] =>
  versions.map((v, idx) => ({
    key: `${v.at ?? v.date}-${idx}`,
    at: v.at ?? v.date,
    by: v.by,
    tag: v.version ? `v${v.version}` : undefined,
    text: v.note || "Versão registrada.",
  }));
