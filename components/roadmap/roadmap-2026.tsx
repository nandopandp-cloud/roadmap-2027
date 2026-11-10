"use client";

import { AlertTriangle, Check, ChevronDown, CircleDashed, ExternalLink, GripVertical, Layers, Pencil } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { Badge } from "@/components/ui/badges";
import { Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { ACCENT_TONE, STATUS_2026_TONE, TRANSVERSAL_TONE, WORK_2026_TONE } from "@/lib/client/tones";
import { ROADMAP_2026_WEEK_COUNT, ROADMAP_2026_WORK } from "@/lib/domain/constants";
import {
  CYCLE_2026_MONTHS,
  CYCLE_2026_QUARTERS,
  STATUS_2026_LABEL,
  WAVE_2026_LABEL,
  WORK_2026_LABEL,
  cycle2026DatePosition,
  editableEnd,
  editableQuarter,
  overdueWeeks,
  weekLabel,
  weekPosition,
  workPeriod,
} from "@/lib/domain/roadmap-2026";
import type { Platform, Roadmap2026Item, Roadmap2026Source, Roadmap2026Work } from "@/lib/domain/types";

const formatDate = (iso: string) => iso.split("-").reverse().join("/");
const WEEKS = ROADMAP_2026_WEEK_COUNT;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Pessoas e situação das frentes, como escritas na planilha. */
function people(item: Roadmap2026Item) {
  return [
    ["Design", item.design],
    ["Engenharia", item.engineering],
    ["QA", item.qa],
  ].filter(([, value]) => value) as [string, string][];
}

/** Squad da planilha com o ícone e a cor da plataforma correspondente. */
export function SquadPill({ item, platforms }: { item: Pick<Roadmap2026Item, "platformId" | "squad">; platforms: Platform[] }) {
  const platform = item.platformId ? platforms.find((p) => p.id === item.platformId) : undefined;
  if (!platform) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: TRANSVERSAL_TONE.bg, color: TRANSVERSAL_TONE.fg }}>
        <Layers size={12} aria-hidden />
        {item.squad}
      </span>
    );
  }
  const Glyph = PLATFORM_GLYPHS[platform.icon];
  const tone = ACCENT_TONE[platform.accent];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: tone.soft, color: tone.fg }}>
      <Glyph size={12} aria-hidden />
      {platform.name}
    </span>
  );
}

export function StatusBadge2026({ status, size = "sm" }: { status: Roadmap2026Item["status"]; size?: "sm" | "md" }) {
  return (
    <Badge tone={STATUS_2026_TONE[status]} dot size={size}>
      {STATUS_2026_LABEL[status]}
    </Badge>
  );
}

/** Fonte dos dados: planilha do time (link real) e data da importação. */
export function Roadmap2026Source({ source, editable }: { source: Roadmap2026Source; editable: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      Importado da
      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand underline-offset-2 hover:underline">
        planilha “{source.title}”, aba {source.sheet}
        <ExternalLink size={12} aria-hidden />
      </a>
      <span>em {formatDate(source.importedAt)}{editable ? " · as alterações feitas aqui valem a partir de agora" : ""}</span>
    </span>
  );
}

export function Roadmap2026Legend({ canEdit }: { canEdit: boolean }) {
  return (
    <>
      {ROADMAP_2026_WORK.map((work) => (
        <span key={work} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-5 rounded-[3px]" style={{ background: WORK_2026_TONE[work].solid }} />
          {WORK_2026_LABEL[work]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-5 rounded-[3px] bg-[#64708A] ring-2 ring-[#E25858] ring-offset-1" /> Atrasada
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="h-2.5 w-5 rounded-[3px] bg-[#64708A] opacity-45" /> Concluída
      </span>
      {canEdit && (
        <span className="flex items-center gap-1.5">
          <GripVertical size={13} aria-hidden /> Arraste a barra para mover e a borda direita para mudar a duração
        </span>
      )}
    </>
  );
}

/* ------------------------------ Atrasadas ------------------------------ */

/** Destaque das iniciativas atrasadas e das que passaram do fim projetado sem conclusão. */
export function Delayed2026({
  items,
  platforms,
  canEdit,
  onEdit,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  canEdit: boolean;
  onEdit: (id: string) => void;
}) {
  const [showOverdue, setShowOverdue] = useState(false);
  const late = items.filter((i) => i.status === "atrasada");
  const overdue = items.filter((i) => i.status !== "atrasada" && overdueWeeks(i) > 0);
  if (!late.length && !overdue.length) return null;

  const row = (i: Roadmap2026Item) => {
    const end = editableEnd(i);
    const past = overdueWeeks(i);
    const Tag = canEdit ? "button" : "div";
    return (
      <li key={i.id}>
        <Tag
          {...(canEdit ? { type: "button" as const, onClick: () => onEdit(i.id) } : {})}
          className={cn(
            "flex h-full w-full items-start gap-3 rounded-xl border border-[#f3c9c9] bg-surface px-3 py-2.5 text-left",
            canEdit && "transition-colors hover:border-[#e25858]",
          )}
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-navy">{i.title}</span>
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <SquadPill item={i} platforms={platforms} />
              {i.status !== "atrasada" && <StatusBadge2026 status={i.status} />}
              <span className="text-[12px] font-semibold text-muted">
                {end === null ? "Sem semanas projetadas" : `Fim projetado: ${weekLabel(end - 1)}`}
                {past > 0 && <span className="font-bold text-[#a1262b]"> · há {plural(past, "semana", "semanas")}</span>}
              </span>
            </span>
          </span>
          {canEdit && <Pencil size={14} className="mt-1 shrink-0 text-subtle" aria-hidden />}
        </Tag>
      </li>
    );
  };

  return (
    <section aria-labelledby="atrasadas-2026" className="mt-6 rounded-[24px] border border-[#f3c9c9] bg-[#fff6f6] p-4">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fdecec] text-[#c9363b]" aria-hidden>
          <AlertTriangle size={17} />
        </span>
        <h2 id="atrasadas-2026" className="text-[17px] font-black text-navy">
          Atrasadas <span className="text-[#c9363b]">· {late.length}</span>
        </h2>
        <p className="text-[13px] text-muted">Iniciativas com o status Atrasada.{canEdit ? " Clique para ajustar status e prazos." : ""}</p>
      </header>
      {late.length > 0 ? (
        <ul className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{late.map(row)}</ul>
      ) : (
        <p className="mt-3 text-[13px] text-muted">Nenhuma iniciativa com o status Atrasada.</p>
      )}
      {overdue.length > 0 && (
        <div className="mt-3 border-t border-[#f3d6d6] pt-3">
          <button
            type="button"
            aria-expanded={showOverdue}
            onClick={() => setShowOverdue((v) => !v)}
            className="flex items-center gap-1.5 text-[13px] font-bold text-[#8a4b00] hover:underline"
          >
            <ChevronDown size={15} className={cn("transition-transform", showOverdue && "rotate-180")} aria-hidden />
            {plural(overdue.length, "iniciativa passou", "iniciativas passaram")} do fim projetado sem estar concluída
          </button>
          {showOverdue && <ul className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{overdue.map(row)}</ul>}
        </div>
      )}
    </section>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

function Card2026({ item, platforms, onEdit }: { item: Roadmap2026Item; platforms: Platform[]; onEdit?: () => void }) {
  const who = people(item);
  const Tag = onEdit ? "button" : "article";
  return (
    <Tag
      {...(onEdit ? { type: "button" as const, onClick: onEdit } : {})}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-2xl border bg-surface p-4 text-left shadow-[var(--shadow-card)]",
        item.status === "atrasada" ? "border-[#f0b4b4]" : "border-line",
        onEdit && "transition-all hover:-translate-y-px hover:border-line-strong",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <SquadPill item={item} platforms={platforms} />
        <span className="flex items-center gap-2">
          {item.wave && <span className="text-[11.5px] font-extrabold text-subtle">{WAVE_2026_LABEL[item.wave]}</span>}
          {onEdit && <Pencil size={13} className="text-subtle" aria-hidden />}
        </span>
      </span>
      <span>
        <span className="block text-[15.5px] font-extrabold leading-snug text-navy">{item.title}</span>
        {item.subtitle && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{item.subtitle}</span>}
      </span>
      <span className="flex flex-wrap gap-1.5">
        <StatusBadge2026 status={item.status} />
        {item.backlog && (
          <Badge tone={{ bg: "#F3F1EE", fg: "#665947", dot: "#A8987F" }} size="sm">
            Backlog
          </Badge>
        )}
      </span>
      {who.length > 0 && (
        <span className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[12.5px]">
          {who.map(([label, value]) => (
            <span key={label} className="contents">
              <span className="font-bold text-muted">{label}</span>
              <span className="truncate text-ink" title={value}>
                {value}
              </span>
            </span>
          ))}
        </span>
      )}
      {item.segments.length > 0 && (
        <span className="flex flex-col gap-1 border-t border-line pt-2">
          {item.segments.map((s) => (
            <span key={s.id} className="flex items-start gap-1.5 text-[12.5px] text-muted">
              <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-[2px]" style={{ background: WORK_2026_TONE[s.work].solid }} />
              <span>
                <span className="font-bold" style={{ color: WORK_2026_TONE[s.work].fg }}>
                  {WORK_2026_LABEL[s.work]}
                </span>{" "}
                · {workPeriod(s)}
              </span>
            </span>
          ))}
        </span>
      )}
    </Tag>
  );
}

/** Cards por trimestre de entrega (onde termina a última semana projetada). */
export function Roadmap2026Board({
  items,
  platforms,
  loading,
  canEdit,
  onEdit,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (id: string) => void;
}) {
  const unscheduled = items.filter((i) => editableQuarter(i) === null);
  const card = (item: Roadmap2026Item) => (
    <li key={item.id}>
      <Card2026 item={item} platforms={platforms} onEdit={canEdit ? () => onEdit(item.id) : undefined} />
    </li>
  );
  return (
    <>
      <div className="@container mt-6">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {CYCLE_2026_QUARTERS.map((q) => {
            const cards = items.filter((i) => editableQuarter(i) === q.key);
            return (
              <section
                key={q.key}
                aria-labelledby={`col-${q.key}`}
                className="flex flex-col rounded-[24px] border border-[#e3e9f4] bg-white/70 p-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)] backdrop-blur"
              >
                <header className="flex items-baseline justify-between gap-2 px-2 pb-3 pt-1">
                  <div>
                    <h2 id={`col-${q.key}`} className="text-[18px] font-black text-navy">
                      {q.label}
                    </h2>
                    <p className="text-[12.5px] font-semibold text-muted">{q.months}</p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-brand">{plural(cards.length, "entrega", "entregas")}</span>
                </header>
                {loading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {cards.map(card)}
                    {cards.length === 0 && (
                      <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                        <CircleDashed size={20} aria-hidden />
                        Nenhuma entrega prevista em {q.label}.
                      </li>
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {!loading && unscheduled.length > 0 && (
        <section aria-labelledby="sem-semanas-2026" className="mt-8 p-3">
          <h2 id="sem-semanas-2026" className="px-1 text-[18px] font-black text-navy">
            Sem semanas projetadas
          </h2>
          <p className="px-1 text-[13px] text-muted">Iniciativas ainda sem semanas na linha do tempo.</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{unscheduled.map(card)}</ul>
        </section>
      )}
    </>
  );
}

/* ---------------------------------- Gantt ---------------------------------- */

const ROW = "grid grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[290px_minmax(0,1fr)]";

/** Semanas (bem claras), meses e, mais fortes, as divisões entre trimestres (a cada 3 meses = 30%). */
const TIMELINE_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #d5deee 1px, transparent 1px), linear-gradient(to right, #e6ebf5 1px, transparent 1px), linear-gradient(to right, #f3f5fa 1px, transparent 1px)",
  backgroundSize: "30% 100%, 10% 100%, 2.5% 100%",
};

function TodayLine() {
  const left = cycle2026DatePosition(new Date());
  if (left === null) return null;
  return <span aria-hidden className="absolute inset-y-0 w-0.5 bg-action/70" style={{ left: `${left}%` }} />;
}

interface DragState {
  segId: string;
  mode: "move" | "resize";
  startX: number;
  delta: number;
}

/** Aplica o arraste a uma fase: mover mantém a duração; redimensionar mantém o início. */
function applyDelta(s: Roadmap2026Work, mode: DragState["mode"], delta: number): Roadmap2026Work {
  return mode === "move" ? { ...s, start: clamp(s.start + delta, 0, WEEKS - s.weeks) } : { ...s, weeks: clamp(s.weeks + delta, 1, WEEKS - s.start) };
}

function GanttRow2026({
  item,
  timelineWidth,
  canEdit,
  onEdit,
  onChange,
}: {
  item: Roadmap2026Item;
  timelineWidth: number;
  canEdit: boolean;
  onEdit: () => void;
  onChange: (item: Roadmap2026Item) => void;
}) {
  const who = people(item);
  const [drag, setDrag] = useState<DragState | null>(null);
  const active = drag;
  const weekPx = timelineWidth / WEEKS || 1;
  const late = item.status === "atrasada";
  const done = item.status === "concluida";

  const commit = (segId: string, mode: DragState["mode"], delta: number) => {
    if (!delta) return;
    onChange({ ...item, segments: item.segments.map((s) => (s.id === segId ? applyDelta(s, mode, delta) : s)) });
  };

  const onPointerDown = (e: PointerEvent<HTMLElement>, segId: string, mode: DragState["mode"]) => {
    if (!canEdit || e.button !== 0) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ segId, mode, startX: e.clientX, delta: 0 });
  };
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!drag) return;
    const delta = Math.round((e.clientX - drag.startX) / weekPx);
    if (delta !== drag.delta) setDrag({ ...drag, delta });
  };
  const onPointerUp = () => {
    if (!drag) return;
    commit(drag.segId, drag.mode, drag.delta);
    setDrag(null);
  };

  /** Teclado: ←/→ movem uma semana; Shift + ←/→ diminuem/aumentam a duração; Enter abre a edição. */
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, segId: string) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    commit(segId, e.shiftKey ? "resize" : "move", e.key === "ArrowLeft" ? -1 : 1);
  };

  return (
    <li className={cn(ROW, "border-t border-line", late && "bg-[#fff8f8]")}>
      <div className={cn("sticky left-0 z-10 flex flex-col justify-center gap-1 border-r border-line px-4 py-2.5", late ? "bg-[#fff8f8] shadow-[inset_3px_0_0_#e25858]" : "bg-surface")}>
        <span className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-navy" title={item.title}>
          {item.title}
        </span>
        {item.subtitle && <span className="line-clamp-1 text-[12px] text-muted">{item.subtitle}</span>}
        <span className="flex flex-wrap items-center gap-1.5">
          {canEdit ? (
            <button type="button" onClick={onEdit} className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet" title="Editar status, nome e prazos">
              <StatusBadge2026 status={item.status} />
            </button>
          ) : (
            <StatusBadge2026 status={item.status} />
          )}
          {item.wave && <span className="text-[11.5px] font-semibold text-muted">{WAVE_2026_LABEL[item.wave]}</span>}
          {item.backlog && <span className="text-[11.5px] font-semibold text-muted">· Backlog</span>}
        </span>
        {who.length > 0 && (
          <span className="truncate text-[11.5px] text-subtle" title={who.map(([l, v]) => `${l}: ${v}`).join(" · ")}>
            {who.map(([l, v]) => `${l}: ${v}`).join(" · ")}
          </span>
        )}
      </div>
      <div className="relative min-h-[72px]" style={TIMELINE_BG}>
        <TodayLine />
        {item.segments.length === 0 ? (
          <span className="absolute left-3 top-1/2 flex -translate-y-1/2 items-center gap-2 text-[12.5px] font-semibold italic text-subtle">
            Sem semanas projetadas
            {canEdit && (
              <button type="button" onClick={onEdit} className="rounded-md border border-dashed border-[#c5cfe4] bg-surface px-2 py-0.5 text-[11.5px] font-bold not-italic text-muted hover:border-violet hover:text-brand">
                Planejar semanas
              </button>
            )}
          </span>
        ) : (
          item.segments.map((original) => {
            const dragging = active?.segId === original.id;
            const s = dragging ? applyDelta(original, active.mode, active.delta) : original;
            const tone = WORK_2026_TONE[s.work];
            const width = weekPosition(s.weeks);
            const label = WORK_2026_LABEL[s.work];
            const fits = (width / 100) * timelineWidth >= label.length * 7 + 22;
            const Tag = canEdit ? "button" : "span";
            return (
              <Tag
                key={s.id}
                {...(canEdit
                  ? {
                      type: "button" as const,
                      onPointerDown: (e: PointerEvent<HTMLElement>) => onPointerDown(e, s.id, "move"),
                      onPointerMove,
                      onPointerUp,
                      onPointerCancel: () => setDrag(null),
                      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => onKey(e, s.id),
                      onDoubleClick: onEdit,
                      "aria-label": `${label} de ${item.title}: ${workPeriod(s)}. Setas movem uma semana; Shift com setas muda a duração; clique duplo edita.`,
                    }
                  : { "aria-hidden": true })}
                title={`${label}: ${workPeriod(s)}`}
                className={cn(
                  "absolute top-1/2 flex h-[26px] -translate-y-1/2 touch-none items-center overflow-visible rounded-md text-[11.5px] font-extrabold text-white shadow-[0_2px_6px_rgba(23,27,77,0.14)]",
                  canEdit && "cursor-grab select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet active:cursor-grabbing",
                  late && "ring-2 ring-[#E25858] ring-offset-1",
                  done && "opacity-50",
                  dragging && "z-10 cursor-grabbing shadow-[0_8px_20px_rgba(23,27,77,0.28)] ring-2 ring-white",
                )}
                style={{ left: `calc(${weekPosition(s.start)}% + 1px)`, width: `calc(${width}% - 2px)`, background: tone.solid }}
              >
                {fits && (
                  <span className="flex min-w-0 items-center gap-1 truncate px-2">
                    {done && <Check size={12} className="shrink-0" aria-hidden />}
                    <span className="truncate">{label}</span>
                  </span>
                )}
                {canEdit && (
                  <span
                    aria-hidden
                    onPointerDown={(e) => onPointerDown(e, s.id, "resize")}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="absolute inset-y-0 right-0 flex w-2.5 cursor-ew-resize items-center justify-center rounded-r-md bg-black/15"
                  >
                    <span className="h-3 w-0.5 rounded-full bg-white/80" />
                  </span>
                )}
                {dragging && (
                  <span className="pointer-events-none absolute bottom-full left-0 mb-1.5 whitespace-nowrap rounded-lg bg-navy px-2 py-1 text-[11.5px] font-bold text-white shadow-lg">
                    {workPeriod(s)}
                  </span>
                )}
              </Tag>
            );
          })
        )}
      </div>
    </li>
  );
}

/** Linha do tempo de julho/2026 a abril/2027, semana a semana, agrupada por squad. */
export function Roadmap2026Gantt({
  items,
  platforms,
  loading,
  canEdit,
  onEdit,
  onChange,
  fill = false,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (id: string) => void;
  onChange: (item: Roadmap2026Item) => void;
  /** Tela cheia: rola por dentro e fixa o cabeçalho dos meses. */
  fill?: boolean;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setTimelineWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Grupos na ordem da planilha.
  const groups: { squad: string; items: Roadmap2026Item[] }[] = [];
  for (const item of items) {
    const group = groups.find((g) => g.squad === item.squad);
    if (group) group.items.push(item);
    else groups.push({ squad: item.squad, items: [item] });
  }
  const groupName = (squad: string, sample: Roadmap2026Item) => (sample.platformId && platforms.find((p) => p.id === sample.platformId)?.name) || squad;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#e3e9f4] bg-surface shadow-[0_2px_10px_rgba(23,27,77,0.04)]",
        fill ? "min-h-0 overflow-auto overscroll-contain [scrollbar-width:thin]" : "mt-6 overflow-x-auto",
      )}
    >
      <div className="min-w-[960px]">
        <div className={cn(ROW, "bg-[#fbfcff]", fill && "sticky top-0 z-20 shadow-[0_1px_0_#e3e9f4]")}>
          <div className="sticky left-0 z-10 flex items-end border-r border-line bg-[#fbfcff] px-4 pb-2 text-[12.5px] font-extrabold text-muted">Iniciativa</div>
          <div ref={timelineRef}>
            <div className="grid grid-cols-[3fr_3fr_3fr_1fr]">
              {CYCLE_2026_QUARTERS.map((q) => (
                <div key={q.key} className="truncate border-l border-[#d5deee] px-2 pb-1 pt-3 text-[14px] font-black text-navy first:border-l-0 sm:px-3" title={`${q.label} · ${q.months}`}>
                  {q.label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10">
              {CYCLE_2026_MONTHS.map((m, idx) => (
                <div key={m.short} className={cn("px-2 pb-2 text-[11.5px] font-bold text-subtle", idx % 3 === 0 ? "border-l border-[#d5deee] first:border-l-0" : "border-l border-[#edf1f8]")}>
                  {m.short}
                  {(idx === 0 || m.month === 1) && <span className="font-semibold text-[#9aa5c2]"> {String(m.year).slice(2)}</span>}
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
        ) : items.length === 0 ? (
          <p className="border-t border-line px-4 py-10 text-center text-[13.5px] text-muted">Nenhuma iniciativa para exibir com o filtro atual.</p>
        ) : (
          groups.map((g) => (
            <section key={g.squad} aria-label={groupName(g.squad, g.items[0])}>
              <h3 className="sticky left-0 border-t border-line bg-[#fbfcff] px-4 py-2 text-[12.5px] font-extrabold text-muted">
                {groupName(g.squad, g.items[0])} · {plural(g.items.length, "iniciativa", "iniciativas")}
              </h3>
              <ul>
                {g.items.map((item) => (
                  <GanttRow2026
                    key={item.id}
                    item={item}
                    timelineWidth={timelineWidth}
                    canEdit={canEdit}
                    onEdit={() => onEdit(item.id)}
                    onChange={onChange}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

