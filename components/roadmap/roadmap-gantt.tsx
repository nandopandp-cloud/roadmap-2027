"use client";

import { AlertTriangle, Code2, GitFork, PenTool, Plus } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { EFFORT_TONE, STATUS_TONE } from "@/lib/client/tones";
import { QUARTERS, ROADMAP_YEAR } from "@/lib/domain/constants";
import { EFFORT_TRACK_LABEL, EFFORT_TRACKS, formatWeeks, formatWeeksShort, lastDay, planEffort, quarterEndDate, type EffortTrack } from "@/lib/domain/effort";
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

/** Posição de uma data limitada ao ano do roadmap (esforço que passa de dezembro para no fim). */
const clampedPosition = (date: string) => datePosition(date) ?? (Number(date.slice(0, 4)) > ROADMAP_YEAR ? 100 : 0);

const TRACK_ICON: Record<EffortTrack, typeof PenTool> = { design: PenTool, engineering: Code2 };
/** Faixas (px a partir do topo da linha). */
const LANE_TOP: Record<EffortTrack, number> = { design: 48, engineering: 76 };

/**
 * Barras de esforço de Design e Engenharia, sob a barra do quarter. Para quem edita, as barras e
 * os espaços "não estimado" abrem a estimativa.
 */
function EffortLanes({
  initiative: i,
  effortTracks,
  onEdit,
  timelineWidth,
}: {
  initiative: Initiative;
  /** Frentes que a pessoa conectada pode estimar (vazio = só consulta). */
  effortTracks: EffortTrack[];
  onEdit: () => void;
  /** Largura da linha do tempo em px, para decidir se o rótulo cabe dentro da barra. */
  timelineWidth: number;
}) {
  const canEdit = effortTracks.length > 0;
  const plan = planEffort(i.effort, i.quarter);
  const qEnd = i.quarter ? clampedPosition(quarterEndDate(i.quarter)) : 100;
  const qStart = i.quarter ? quarterStart(i.quarter) : null;

  if (!plan.tracks.length) {
    if (!canEdit || qStart === null) return null;
    return (
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Estimar esforço de design e engenharia de ${i.title}`}
        className="pointer-events-auto absolute flex h-[24px] items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed border-[#c5cfe4] bg-surface/80 px-2.5 text-[11.5px] font-bold text-muted transition-colors hover:border-violet hover:bg-brand-soft hover:text-brand"
        style={{ top: LANE_TOP.design, left: `calc(${qStart}% + 4px)` }}
      >
        <Plus size={13} aria-hidden /> Estimar esforço
      </button>
    );
  }

  return (
    <>
      {plan.overflowWeeks > 0 && (
        <span
          aria-hidden
          className="absolute border-l-2 border-dashed border-[#e08a1e]"
          style={{ left: `${qEnd}%`, top: LANE_TOP.design - 4, height: 60 }}
        />
      )}
      {EFFORT_TRACKS.map((track) => {
        const tone = EFFORT_TONE[track];
        const placed = plan.tracks.find((t) => t.track === track);
        const Icon = TRACK_ICON[track];
        const Tag = canEdit ? "button" : "span";
        if (!placed) {
          // Frente vazia: só vira atalho para quem pode estimá-la.
          const editable = effortTracks.includes(track);
          const Slot = editable ? "button" : "span";
          // Frente sem estimativa: espaço tracejado onde a barra apareceria.
          const designEnd = plan.tracks.find((t) => t.track === "design")?.end;
          const left = track === "engineering" && designEnd ? clampedPosition(designEnd) : (qStart ?? clampedPosition(plan.start!));
          return (
            <Slot
              key={track}
              {...(editable ? { type: "button" as const, onClick: onEdit, "aria-label": `Estimar esforço de ${EFFORT_TRACK_LABEL[track]} de ${i.title}` } : {})}
              className={cn(
                "absolute flex h-[22px] items-center gap-1 whitespace-nowrap rounded-md border border-dashed bg-surface/80 px-2 text-[11px] font-bold",
                editable && "pointer-events-auto transition-colors hover:bg-surface",
              )}
              style={{ top: LANE_TOP[track], left: `calc(${left}% + 4px)`, borderColor: tone.line, color: tone.fg }}
            >
              {editable && <Plus size={12} aria-hidden />}
              {EFFORT_TRACK_LABEL[track]} não estimado
            </Slot>
          );
        }
        const left = clampedPosition(placed.start);
        const width = clampedPosition(placed.end) - left;
        const label = `${EFFORT_TRACK_LABEL[track]} · ${formatWeeksShort(placed.estimate.weeks)}`;
        // Rótulo que não cabe na barra vai ao lado (à esquerda, quando a barra chega ao fim do ano).
        const narrow = (width / 100) * timelineWidth < label.length * 5.6 + 26;
        const labelLeft = left + width > 82;
        return (
          <Tag
            key={track}
            {...(canEdit ? { type: "button" as const, onClick: onEdit } : {})}
            title={`${EFFORT_TRACK_LABEL[track]}: ${formatWeeks(placed.estimate.weeks)} (${formatDate(placed.start)} a ${formatDate(lastDay(placed.end))})${canEdit ? " — clique para editar" : ""}`}
            aria-label={canEdit ? `Editar esforço de ${EFFORT_TRACK_LABEL[track]} de ${i.title}: ${formatWeeks(placed.estimate.weeks)}` : undefined}
            className={cn(
              "absolute flex h-[22px] items-center rounded-md text-[11.5px] font-extrabold text-white shadow-[0_2px_6px_rgba(23,27,77,0.16)]",
              canEdit && "pointer-events-auto transition-[filter,box-shadow] hover:brightness-110 hover:shadow-[0_4px_12px_rgba(23,27,77,0.22)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
            )}
            style={{ top: LANE_TOP[track], left: `${left}%`, width: `max(${width}%, 10px)`, background: tone.solid }}
          >
            {!narrow && (
              <span className="flex min-w-0 items-center gap-1 truncate px-2">
                <Icon size={12} className="shrink-0" aria-hidden />
                <span className="truncate">{label}</span>
              </span>
            )}
            {narrow && (
              <span
                className={cn("absolute flex items-center gap-1 whitespace-nowrap", labelLeft ? "right-full mr-1.5" : "left-full ml-1.5")}
                style={{ color: tone.fg }}
              >
                <Icon size={12} aria-hidden />
                {label}
              </span>
            )}
          </Tag>
        );
      })}
      {/* Passou de dezembro: sem espaço à direita; o aviso fica só ao lado do nome da iniciativa. */}
      {plan.overflowWeeks > 0 && plan.end && qEnd < 99 && (
        <span
          className="absolute flex h-[18px] items-center gap-1 whitespace-nowrap rounded-full bg-[#fff1df] px-1.5 text-[10.5px] font-extrabold text-[#8a4b00] ring-1 ring-[#f3c58a]"
          style={{ left: `calc(${qEnd}% + 6px)`, top: LANE_TOP.design + 2 }}
        >
          <AlertTriangle size={11} aria-hidden />+{formatWeeksShort(plan.overflowWeeks)}
        </span>
      )}
    </>
  );
}

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
  showEffort,
  effortTracks,
  selected,
  onOpen,
  onEditEffort,
  timelineWidth,
}: {
  initiative: Initiative;
  showMilestones: boolean;
  showEffort: boolean;
  timelineWidth: number;
  effortTracks: EffortTrack[];
  selected: boolean;
  onOpen: () => void;
  onEditEffort: () => void;
}) {
  const plan = planEffort(i.effort, i.quarter);
  const canEdit = effortTracks.length > 0;
  // Com esforço visível, a linha ganha as faixas de Design e Engenharia; os marcos descem.
  const lanes = showEffort && (plan.tracks.length > 0 || (canEdit && !!i.quarter));
  const markTop = lanes ? 116 : 52;
  const rowHeight = lanes ? 132 : 72;
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
    ...plan.tracks.map((t) => `${EFFORT_TRACK_LABEL[t.track]}: ${formatWeeks(t.estimate.weeks)}`),
    plan.overflowWeeks ? `ultrapassa o quarter em ${formatWeeks(plan.overflowWeeks)}` : "",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <li className="relative">
      <button
        type="button"
        onClick={onOpen}
        aria-pressed={selected}
        aria-label={label}
        className={cn(ROW, "group w-full border-t border-line text-left transition-colors", selected ? "bg-[#f1f5ff]" : "hover:bg-[#f8faff]")}
      >
        <span
          className={cn(
            "sticky left-0 z-10 flex flex-col justify-center gap-0.5 border-r border-line px-4 py-3 transition-colors",
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
          {showEffort && i.quarter && plan.overflowWeeks > 0 && (
            <span className="mt-1 flex items-center gap-1 text-[11.5px] font-bold text-[#8a4b00]">
              <AlertTriangle size={11} className="shrink-0" aria-hidden />
              <span className="truncate">
                Ultrapassa o {QUARTER_LABEL[i.quarter]} em {formatWeeks(plan.overflowWeeks)}
              </span>
            </span>
          )}
        </span>

        <span className="relative block" style={{ ...TIMELINE_BG, minHeight: rowHeight }}>
          <TodayLine />
          {span && (
            <span
              aria-hidden
              className="absolute border-t-2 border-dashed border-[#b9c6e4]"
              style={{ top: markTop, left: `${span.from}%`, width: `${span.to - span.from}%` }}
            />
          )}
          {barStart !== null ? (
            <span
              aria-hidden
              className="absolute top-3 h-[28px] overflow-hidden rounded-lg border"
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
                "absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[3px] border-2 border-teal",
                m.done ? "bg-teal" : "bg-surface",
                !exact && "border-dashed",
              )}
              style={{ top: markTop, left: `${left}%` }}
            />
          ))}
        </span>
      </button>
      {lanes && (
        // Camada das barras de esforço por cima da linha: clicáveis (edição) sem aninhar botões.
        <div aria-hidden={!canEdit} className={cn(ROW, "pointer-events-none absolute inset-0")}>
          <span />
          <span className="relative block">
            <EffortLanes initiative={i} effortTracks={effortTracks} onEdit={onEditEffort} timelineWidth={timelineWidth} />
          </span>
        </div>
      )}
    </li>
  );
}

export function RoadmapGantt({
  visible,
  showMilestones,
  showEffort,
  effortTracks,
  loading,
  selectedId,
  onOpen,
  onEditEffort,
  fill = false,
}: {
  showEffort: boolean;
  /** Tela cheia: limita a altura à janela, rola por dentro e fixa o cabeçalho dos meses. */
  fill?: boolean;
  /** Frentes de esforço que a pessoa conectada pode estimar. */
  effortTracks: EffortTrack[];
  onEditEffort: (id: string) => void;
  /** Iniciativas após o filtro de plataforma, na ordem do roadmap. */
  visible: Initiative[];
  showMilestones: boolean;
  loading: boolean;
  selectedId: string | null;
  onOpen: (id: string) => void;
}) {
  const scheduled = QUARTERS.flatMap((q) => visible.filter((i) => i.quarter === q));
  const unscheduled = visible.filter((i) => !i.quarter);
  // Largura real da linha do tempo (muda com a janela e com a sidebar recolhida).
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setTimelineWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const row = (i: Initiative) => (
    <GanttRow
      key={i.id}
      initiative={i}
      showMilestones={showMilestones}
      showEffort={showEffort}
      effortTracks={effortTracks}
      selected={selectedId === i.id}
      onOpen={() => onOpen(i.id)}
      onEditEffort={() => onEditEffort(i.id)}
      timelineWidth={timelineWidth}
    />
  );

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#e3e9f4] bg-surface shadow-[0_2px_10px_rgba(23,27,77,0.04)]",
        fill ? "min-h-0 overflow-auto overscroll-contain [scrollbar-width:thin]" : "mt-6 overflow-x-auto",
      )}
    >
      <div className="min-w-[860px]">
        <div className={cn(ROW, "bg-[#fbfcff]", fill && "sticky top-0 z-20 shadow-[0_1px_0_#e3e9f4]")}>
          <div className="sticky left-0 z-10 flex items-end border-r border-line bg-[#fbfcff] px-4 pb-2 text-[12.5px] font-extrabold text-muted">
            Iniciativa
          </div>
          <div ref={timelineRef}>
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
