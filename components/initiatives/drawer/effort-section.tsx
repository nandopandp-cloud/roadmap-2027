"use client";

import { AlertTriangle, CheckCircle2, Pencil, Timer } from "lucide-react";
import { useState } from "react";
import { DrawerSection, Prose } from "@/components/initiatives/drawer/parts";
import { EFFORT_TRACK_ICON, EffortDialog } from "@/components/roadmap/effort-dialog";
import { JustificationChips } from "@/components/roadmap/effort-justification";
import { Button } from "@/components/ui/button";
import { useEffortTracks, useRoadmap } from "@/lib/client/store";
import { EFFORT_TONE } from "@/lib/client/tones";
import { describeEffortStart, EFFORT_TRACK_LABEL, EFFORT_TRACKS, formatWeeks, hasEffort, lastDay, planEffort } from "@/lib/domain/effort";
import { QUARTER_LABEL } from "@/lib/domain/labels";
import type { Initiative } from "@/lib/domain/types";

const fmt = (iso: string) => iso.split("-").reverse().join("/");

/** Aba Roadmap: semanas de Design e Engenharia, com responsáveis e se cabem no quarter. */
export function EffortSection({ initiative: i }: { initiative: Initiative }) {
  const { data } = useRoadmap();
  const canEdit = useEffortTracks().length > 0;
  const [editing, setEditing] = useState(false);
  const plan = planEffort(i.effort, i.quarter);
  const any = hasEffort(i.effort) || EFFORT_TRACKS.some((t) => i.effortEvidence[t].length > 0);
  const ownerName = (id: string | null) => (id ? data.people.find((p) => p.id === id)?.name : undefined);

  return (
    <DrawerSection
      icon={Timer}
      color="#C2307F"
      title="Esforço estimado"
      action={
        canEdit && (
          <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => setEditing(true)}>
            {any ? "Editar" : "Estimar"}
          </Button>
        )
      }
    >
      {!any ? (
        <Prose
          empty={
            canEdit
              ? "Ainda sem estimativa. Os responsáveis de design e de engenharia informam aqui (ou no Gantt) quantas semanas cada frente deve levar."
              : "Ainda sem estimativa de design e engenharia."
          }
        />
      ) : (
        <>
          <ul className="mt-1 flex flex-col gap-2.5">
            {EFFORT_TRACKS.map((track) => {
              const estimate = i.effort[track];
              const tone = EFFORT_TONE[track];
              const Icon = EFFORT_TRACK_ICON[track];
              const placed = plan.tracks.find((t) => t.track === track);
              const owner = estimate ? ownerName(estimate.ownerId) : undefined;
              return (
                <li key={track} className="flex items-start gap-3 rounded-xl border border-line px-3 py-2.5">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={estimate ? { background: tone.solid, color: "#fff" } : { background: tone.soft, color: tone.fg }}
                    aria-hidden
                  >
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <span className="text-[14px] font-extrabold text-navy">{EFFORT_TRACK_LABEL[track]}</span>
                      <span className="text-[14px] font-extrabold" style={{ color: estimate ? tone.fg : undefined }}>
                        {estimate ? formatWeeks(estimate.weeks) : <span className="font-semibold italic text-subtle">Não estimado</span>}
                      </span>
                    </span>
                    {estimate && (
                      <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted">
                        {owner ? `Responsável: ${owner}` : "Responsável a definir"}
                        {" · "}
                        {placed ? `${fmt(placed.start)} a ${fmt(lastDay(placed.end))}` : `começa ${describeEffortStart(track, estimate)}`}
                      </span>
                    )}
                    {(estimate || i.effortEvidence[track].length > 0) && <JustificationChips items={i.effortEvidence[track]} />}
                  </span>
                </li>
              );
            })}
          </ul>
          {i.quarter && plan.end ? (
            plan.overflowWeeks > 0 ? (
              <p className="mt-3 flex gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-[13px] font-semibold text-[#8a4b00]">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                Ultrapassa o {QUARTER_LABEL[i.quarter]} em {formatWeeks(plan.overflowWeeks)} (termina em {fmt(lastDay(plan.end))}).
              </p>
            ) : (
              <p className="mt-3 flex gap-2 rounded-xl bg-[#e6f6ec] px-3 py-2 text-[13px] font-semibold text-[#1b6b3a]">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
                Cabe no {QUARTER_LABEL[i.quarter]} (termina em {fmt(lastDay(plan.end))}).
              </p>
            )
          ) : (
            !i.quarter && (
              <p className="mt-3 text-[13px] text-muted">Sem quarter definido: só frentes com data de início aparecem no Gantt.</p>
            )
          )}
        </>
      )}
      {editing && <EffortDialog initiative={i} onClose={() => setEditing(false)} />}
    </DrawerSection>
  );
}
