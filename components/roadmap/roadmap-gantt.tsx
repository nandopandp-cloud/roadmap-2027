"use client";

import { GitFork } from "lucide-react";
import type { CSSProperties } from "react";
import { Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { STATUS_TONE } from "@/lib/client/tones";
import { QUARTERS, ROADMAP_YEAR } from "@/lib/domain/constants";
import { QUARTER_LABEL, STATUS_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { Initiative, Milestone, Quarter } from "@/lib/domain/types";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const ROW = "grid grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[290px_minmax(0,1fr)]";

/** Linhas dos meses e, mais fortes, as divisões entre quarters. */
const TIMELINE_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #d5deee 1px, transparent 1px), linear-gradient(to right, #edf1f8 1px, transparent 1px)",
  backgroundSize: "25% 100%, calc(100% / 12) 100%",
};

const quarterStart = (q: Quarter) => QUARTERS.indexOf(q) * 25;

/** Posição (0–100) de uma data do ano do roadmap; null se a data não for desse ano. */
function datePosition(date: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match || Number(match[1]) !== ROADMAP_YEAR) return null;
  const month = Number(match[2]) - 1;
  const days = new Date(ROADMAP_YEAR, month + 1, 0).getDate();
  return ((month + (Number(match[3]) - 1) / days) / 12) * 100;
}

const formatDate = (date: string) => date.split("-").reverse().join("/");

/**
 * Marcos com data aparecem no dia; sem data, são distribuídos dentro do próprio quarter
 * (posição aproximada, sinalizada com contorno tracejado).
 */
function placeMilestones(milestones: Milestone[]) {
  return milestones.map((m) => {
    const exact = datePosition(m.date);
    if (exact !== null) return { milestone: m, left: exact, exact: true };
    const undated = milestones.filter((x) => x.quarter === m.quarter && datePosition(x.date) === null);
    const slot = undated.indexOf(m) + 1;
    return { milestone: m, left: quarterStart(m.quarter) + (25 * slot) / (undated.length + 1), exact: false };
  });
}

function TodayLine() {
  const now = new Date();
  if (now.getFullYear() !== ROADMAP_YEAR) return null;
  const left = datePosition(now.toISOString().slice(0, 10));
  return <span aria-hidden className="absolute inset-y-0 w-0.5 bg-action/70" style={{ left: `${left}%` }} />;
}

function GanttRow({
  initiative: i,
  showMilestones,
  selected,
  onOpen,
}: {
  initiative: Initiative;
  showMilestones: boolean;
  selected: boolean;
  onOpen: () => void;
}) {
  const progress = progressOf(i.phases);
  const tone = STATUS_TONE[i.status];
  const marks = showMilestones ? placeMilestones(i.milestones) : [];
  const barStart = i.quarter ? quarterStart(i.quarter) : null;
  // Linha que liga a barra aos marcos em outros quarters (mesmo registro, sem duplicar a iniciativa).
  const outside = marks.filter((m) => m.milestone.quarter !== i.quarter);
  const points = [...marks.map((m) => m.left), ...(barStart === null ? [] : [barStart, barStart + 25])];
  const span = outside.length && points.length > 1 ? { from: Math.min(...points), to: Math.max(...points) } : null;
  const label = [
    `${i.id} ${i.title}`,
    i.quarter ? QUARTER_LABEL[i.quarter] : "Sem quarter definido",
    STATUS_LABEL[i.status],
    progress === null ? "sem etapas definidas" : `${progress}% concluído`,
    marks.length ? plural(marks.length, "marco", "marcos") : "",
    i.dependsOn.length ? `depende de ${i.dependsOn.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={selected}
        aria-label={label}
        className={cn(ROW, "group w-full border-t border-line text-left transition-colors", selected ? "bg-[#f1f5ff]" : "hover:bg-[#f8faff]")}
      >
        <span
          className={cn(
            "sticky left-0 z-10 flex min-h-[72px] flex-col justify-center gap-0.5 border-r border-line px-4 py-3 transition-colors",
            selected ? "bg-[#f1f5ff] shadow-[inset_3px_0_0_#3f6fe6]" : "bg-surface group-hover:bg-[#f8faff]",
          )}
        >
          <span className="text-[11px] font-extrabold tracking-wide text-subtle">{i.id}</span>
          <span className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-navy">{i.title}</span>
          {i.dependsOn.length > 0 && (
            <span className="flex items-center gap-1 text-[11.5px] font-semibold text-[#7a4b00]">
              <GitFork size={11} className="shrink-0" aria-hidden />
              <span className="truncate">Depende de {i.dependsOn.join(", ")}</span>
            </span>
          )}
        </span>

        <span className="relative block min-h-[72px]" style={TIMELINE_BG}>
          <TodayLine />
          {span && (
            <span
              aria-hidden
              className="absolute top-[52px] border-t-2 border-dashed border-[#b9c6e4]"
              style={{ left: `${span.from}%`, width: `${span.to - span.from}%` }}
            />
          )}
          {barStart !== null ? (
            <span
              aria-hidden
              className="absolute top-3 h-[30px] overflow-hidden rounded-lg border"
              style={{ left: `calc(${barStart}% + 4px)`, width: "calc(25% - 8px)", background: tone.bg, borderColor: tone.dot }}
            >
              {progress !== null && (
                <span className="absolute inset-y-0 left-0 opacity-30" style={{ width: `${progress}%`, background: tone.dot }} />
              )}
              <span className="relative flex h-full items-center truncate px-2.5 text-[12px] font-bold" style={{ color: tone.fg }}>
                {STATUS_LABEL[i.status]} · {progress === null ? "sem etapas" : `${progress}%`}
              </span>
            </span>
          ) : (
            <span aria-hidden className="absolute left-3 top-4 text-[12.5px] font-semibold italic text-subtle">
              Sem quarter definido
            </span>
          )}
          {marks.map(({ milestone: m, left, exact }) => (
            <span
              key={m.id}
              title={`${m.title} — ${exact ? formatDate(m.date) : `${QUARTER_LABEL[m.quarter]}, sem data`}${m.done ? " (concluído)" : ""}`}
              className={cn(
                "absolute top-[52px] h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-teal",
                m.done ? "bg-teal" : "bg-surface",
                !exact && "border-dashed",
              )}
              style={{ left: `${left}%` }}
            />
          ))}
        </span>
      </button>
    </li>
  );
}

export function RoadmapGantt({
  visible,
  showMilestones,
  loading,
  selectedId,
  onOpen,
}: {
  /** Iniciativas após o filtro de plataforma, na ordem do roadmap. */
  visible: Initiative[];
  showMilestones: boolean;
  loading: boolean;
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  const scheduled = QUARTERS.flatMap((q) => visible.filter((i) => i.quarter === q));
  const unscheduled = visible.filter((i) => !i.quarter);
  const row = (i: Initiative) => (
    <GanttRow key={i.id} initiative={i} showMilestones={showMilestones} selected={selectedId === i.id} onOpen={() => onOpen(i.id)} />
  );

  return (
    <div className="mt-6 overflow-x-auto rounded-[24px] border border-[#e3e9f4] bg-surface shadow-[0_2px_10px_rgba(23,27,77,0.04)]">
      <div className="min-w-[860px]">
        <div className={cn(ROW, "bg-[#fbfcff]")}>
          <div className="sticky left-0 z-10 flex items-end border-r border-line bg-[#fbfcff] px-4 pb-2 text-[12.5px] font-extrabold text-muted">
            Iniciativa
          </div>
          <div>
            <div className="grid grid-cols-4">
              {QUARTERS.map((q) => (
                <div key={q} className="border-l border-[#d5deee] px-3 pb-1 pt-3 text-[15px] font-black text-navy first:border-l-0">
                  {QUARTER_LABEL[q]}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12">
              {MONTHS.map((m, idx) => (
                <div key={m} className={cn("px-2 pb-2 text-[11.5px] font-bold text-subtle", idx % 3 === 0 ? "border-l border-[#d5deee] first:border-l-0" : "border-l border-[#edf1f8]")}>
                  {m}
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 border-t border-line p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : visible.length === 0 ? (
          <p className="border-t border-line px-4 py-10 text-center text-[13.5px] text-muted">Nenhuma iniciativa para exibir com o filtro atual.</p>
        ) : (
          <>
            <ul>{scheduled.map(row)}</ul>
            {unscheduled.length > 0 && (
              <>
                <div className="sticky left-0 border-t border-line bg-[#fbfcff] px-4 py-2 text-[12.5px] font-extrabold text-muted">
                  Sem quarter definido
                </div>
                <ul>{unscheduled.map(row)}</ul>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
