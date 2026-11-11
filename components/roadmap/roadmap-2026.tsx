"use client";

import { AlertTriangle, ArrowDownToLine, Check, ChevronDown, CircleDashed, Code2, Expand, GripVertical, Layers, PenTool, Pencil, ShieldCheck, Shrink, type LucideIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { Avatar } from "@/components/org/avatar";
import { useCardDrag, type DropTarget } from "@/components/ui/use-card-drag";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { Badge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { ACCENT_TONE, STATUS_2026_TONE, TRANSVERSAL_TONE, WORK_2026_TONE } from "@/lib/client/tones";
import { ROADMAP_2026_WEEK_COUNT, ROADMAP_2026_WORK } from "@/lib/domain/constants";
import {
  CYCLE_2026_MONTHS,
  CYCLE_2026_QUARTERS,
  OWNER_TRACK_LABEL,
  OWNER_TRACKS_2026,
  STATUS_2026_LABEL,
  TRACK_STATUS_LABEL,
  TRACK_STATUS_SHORT,
  WORK_2026_LABEL,
  cycle2026DatePosition,
  editableEnd,
  editableQuarter,
  effectiveStatus,
  lateReason,
  statusReason,
  overdueWeeks,
  weekLabel,
  weekPosition,
  workPeriod,
  type OwnerTrack2026,
  type Owners2026,
  type TrackStatus2026,
  type TrackStatuses2026,
} from "@/lib/domain/roadmap-2026";
import type { Person, Platform, Roadmap2026Item, Roadmap2026Work } from "@/lib/domain/types";

const WEEKS = ROADMAP_2026_WEEK_COUNT;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Responsáveis de cada iniciativa (por frente) e o organograma, fornecidos pela página. */
export const Owners2026Context = createContext<{
  ownersOf: (item: Roadmap2026Item) => Owners2026;
  trackStatusOf: (item: Roadmap2026Item) => TrackStatuses2026;
  people: Person[];
  /** Mostra as frentes (Design, Engenharia, QA) com andamento e responsáveis ("Expandir todos"). */
  showTracks: boolean;
}>({
  ownersOf: () => ({ design: [], engineering: [], qa: [] }),
  trackStatusOf: () => ({ design: "nao_iniciado", engineering: "nao_iniciado", qa: "nao_iniciado" }),
  people: [],
  showTracks: true,
});

/** Tons do andamento por frente (texto com contraste AA sobre o fundo suave). */
export const TRACK_STATUS_TONE: Record<TrackStatus2026, { bg: string; fg: string; dot: string }> = {
  nao_iniciado: { bg: "#F1F3F8", fg: "#5F6C8F", dot: "#B4BCD3" },
  andamento: { bg: "#FFF2E5", fg: "#934400", dot: "#F28A1F" },
  concluido: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "#22A05A" },
};

/** Status da frente em pílula pequena (bolinha + texto). */
function TrackStatusPill({ status, short = false }: { status: TrackStatus2026; short?: boolean }) {
  const tone = TRACK_STATUS_TONE[status];
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-px text-[11px] font-bold" style={{ background: tone.bg, color: tone.fg }}>
      {status === "concluido" ? <Check size={11} strokeWidth={3} aria-hidden /> : <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />}
      {short ? TRACK_STATUS_SHORT[status] : TRACK_STATUS_LABEL[status]}
    </span>
  );
}

/** Gantt: uma pílula por frente (Design, Engenharia e QA), com o andamento e os avatares de quem a toca. */
function TrackChips({ item }: { item: Roadmap2026Item }) {
  const { ownersOf, trackStatusOf, people } = useContext(Owners2026Context);
  const owners = ownersOf(item);
  const statuses = trackStatusOf(item);
  // Frentes retiradas (não se aplicam) não aparecem.
  const tracks = OWNER_TRACKS_2026.filter((t) => !(item.skippedTracks as string[]).includes(t));
  return (
    <span className="flex flex-wrap items-center gap-1">
      {tracks.map((track) => {
        const Icon = OWNER_TRACK_ICON[track];
        const list = owners[track].map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p);
        const status = statuses[track];
        const label = `${OWNER_TRACK_LABEL[track]}${status ? `: ${TRACK_STATUS_LABEL[status]}` : ""}${list.length ? ` · ${list.map((p) => p.name).join(", ")}` : " · sem responsável"}`;
        return (
          <span key={track} title={label} aria-label={label} role="img" className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-surface py-px pl-1.5", list.length ? "pr-px" : "pr-1.5")}>
            <Icon size={12} aria-hidden style={{ color: OWNER_TRACK_COLOR[track] }} />
            {status && <TrackStatusPill status={status} short />}
            {list.length > 0 ? (
              <span className="flex items-center">
                {list.slice(0, 2).map((p, idx) => (
                  <Avatar key={p.id} person={p} size={18} className={idx > 0 ? "-ml-1.5" : undefined} />
                ))}
                {list.length > 2 && <span className="ml-0.5 text-[10.5px] font-bold text-muted">+{list.length - 2}</span>}
              </span>
            ) : null}
          </span>
        );
      })}
    </span>
  );
}

export const OWNER_TRACK_ICON: Record<OwnerTrack2026, LucideIcon> = { design: PenTool, engineering: Code2, qa: ShieldCheck };
const OWNER_TRACK_COLOR: Record<OwnerTrack2026, string> = { design: "#C2307F", engineering: "#2160D9", qa: "#0B776F" };

/** Pessoas responsáveis por frente, na ordem das frentes. */
function useOwners(item: Roadmap2026Item) {
  const { ownersOf, people } = useContext(Owners2026Context);
  const owners = ownersOf(item);
  return OWNER_TRACKS_2026.map((track) => ({
    track,
    people: owners[track].map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p),
  })).filter((g) => g.people.length > 0);
}

/** Responsáveis por frente com nome (cards). */
function OwnerRows({ item }: { item: Roadmap2026Item }) {
  const { trackStatusOf } = useContext(Owners2026Context);
  const statuses = trackStatusOf(item);
  const withOwners = useOwners(item);
  // As três frentes sempre aparecem, com o andamento.
  const groups = OWNER_TRACKS_2026.filter((t) => !(item.skippedTracks as string[]).includes(t)).map(
    (track) => withOwners.find((g) => g.track === track) ?? { track, people: [] as Person[] },
  );
  return (
    <span className="flex flex-col gap-1.5">
      {groups.map(({ track, people }) => {
        const Icon = OWNER_TRACK_ICON[track];
        return (
          <span key={track} className="grid grid-cols-[88px_auto_minmax(0,1fr)] items-center gap-2 text-[12.5px]">
            <span className="flex items-center gap-1.5 font-bold text-muted">
              <Icon size={13} aria-hidden style={{ color: OWNER_TRACK_COLOR[track] }} />
              {OWNER_TRACK_LABEL[track]}
            </span>
            <TrackStatusPill status={statuses[track]} />
            {people.length === 0 ? (
              <span className="truncate text-[12px] text-subtle">—</span>
            ) : (
              <span className="flex min-w-0 items-center" title={people.map((p) => p.name).join(", ")} role="img" aria-label={people.map((p) => p.name).join(", ")}>
                {people.slice(0, 4).map((p, idx) => (
                  <Avatar key={p.id} person={p} size={22} className={idx > 0 ? "-ml-1.5" : undefined} />
                ))}
                {people.length > 4 && <span className="ml-1 text-[11px] font-bold text-muted">+{people.length - 4}</span>}
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
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

export function Roadmap2026Legend() {
  return (
    <>
      {ROADMAP_2026_WORK.filter((work) => work !== "indefinido").map((work) => (
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
    </>
  );
}

/* ------------------------------ Atrasadas ------------------------------ */

/**
 * Atrasadas, de forma discreta: um botão com a contagem que abre a lista (prazo vencido de cada
 * uma). Clicar numa iniciativa abre a edição; "Mostrar só as atrasadas" aplica o filtro de status.
 */
export function LateMenu2026({
  items,
  platforms,
  canEdit,
  onEdit,
  onShowOnly,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  canEdit: boolean;
  onEdit: (id: string) => void;
  onShowOnly: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Posição da lista na tela (fixa), sempre dentro da janela com 16px de margem.
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const late = items.filter((i) => effectiveStatus(i) === "atrasada").sort((a, b) => overdueWeeks(b) - overdueWeeks(a));

  // Fecha ao clicar fora ou com Esc (devolvendo o foco ao botão).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    // A lista é fixa na tela: ao rolar a página (fora dela), fecha.
    const onScroll = (e: Event) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  if (!late.length) return null;
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const rect = ref.current?.getBoundingClientRect();
          if (rect) {
            const width = Math.min(460, window.innerWidth - 32);
            const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
            setPos({ top: rect.bottom + 8, left, width });
          }
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] font-bold transition-colors",
          open ? "border-[#e25858] bg-[#fdecec] text-[#a1262b]" : "border-[#f3c9c9] bg-surface text-[#a1262b] hover:bg-[#fff6f6]",
        )}
      >
        <AlertTriangle size={15} aria-hidden />
        {plural(late.length, "atrasada", "atrasadas")}
        <ChevronDown size={15} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && pos && (
        <div
          role="dialog"
          aria-label="Iniciativas atrasadas"
          className="fixed z-[45] overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_18px_40px_rgba(23,27,77,0.18)]"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <p className="text-[12.5px] text-muted">Fim projetado vencido sem todas as frentes concluídas.</p>
            <button
              type="button"
              onClick={() => {
                onShowOnly();
                setOpen(false);
              }}
              className="shrink-0 text-[12.5px] font-bold text-brand hover:underline"
            >
              Mostrar só as atrasadas
            </button>
          </div>
          <ul className="max-h-[min(420px,60vh)] overflow-y-auto py-1 [scrollbar-width:thin]">
            {late.map((i) => {
              const end = editableEnd(i);
              const Tag = canEdit ? "button" : "div";
              return (
                <li key={i.id}>
                  <Tag
                    {...(canEdit
                      ? {
                          type: "button" as const,
                          onClick: () => {
                            setOpen(false);
                            onEdit(i.id);
                          },
                        }
                      : {})}
                    className={cn("flex w-full items-center gap-3 px-4 py-2 text-left", canEdit && "transition-colors hover:bg-[#f6f4ff]")}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-navy">{i.title}</span>
                      <span className="block text-[12px] text-muted">
                        {platforms.find((p) => p.id === i.platformId)?.name ?? i.squad}
                        {end !== null && ` · fim projetado ${weekLabel(end - 1)}`}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#fdecec] px-2 py-0.5 text-[11.5px] font-bold text-[#a1262b]">
                      há {plural(overdueWeeks(i), "semana", "semanas")}
                    </span>
                  </Tag>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

function Card2026({ item, platforms, onEdit }: { item: Roadmap2026Item; platforms: Platform[]; onEdit?: () => void }) {
  const { showTracks } = useContext(Owners2026Context);
  const Tag = onEdit ? "button" : "article";
  return (
    <Tag
      {...(onEdit ? { type: "button" as const, onClick: onEdit } : {})}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-2xl border bg-surface p-4 text-left shadow-[var(--shadow-card)]",
        effectiveStatus(item) === "atrasada" ? "border-[#f0b4b4]" : "border-line",
        onEdit && "transition-all hover:-translate-y-px hover:border-line-strong",
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <SquadPill item={item} platforms={platforms} />
        {onEdit && <Pencil size={13} className="text-subtle" aria-hidden />}
      </span>
      <span>
        <span className="block text-[15.5px] font-extrabold leading-snug text-navy">{item.title}</span>
        {item.subtitle && <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">{item.subtitle}</span>}
      </span>
      <span className="flex flex-wrap gap-1.5">
        <StatusBadge2026 status={effectiveStatus(item)} />
        {item.backlog && (
          <Badge tone={{ bg: "#F3F1EE", fg: "#665947", dot: "#A8987F" }} size="sm">
            Backlog
          </Badge>
        )}
      </span>
      {showTracks && <OwnerRows item={item} />}
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

const ROW = "grid grid-cols-[230px_minmax(0,1fr)] sm:grid-cols-[380px_minmax(0,1fr)]";

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
  onGrab,
  onReorderKey,
  hidden = false,
}: {
  item: Roadmap2026Item;
  timelineWidth: number;
  canEdit: boolean;
  onEdit: () => void;
  onChange: (item: Roadmap2026Item) => void;
  /** Alça de ordem: começa o arraste da linha (só para quem edita). */
  onGrab?: (e: PointerEvent<HTMLElement>) => void;
  /** Setas na alça: sobe (-1) ou desce (+1) uma posição. */
  onReorderKey?: (step: -1 | 1) => void;
  /** Linha sendo arrastada (continua no DOM para o toque seguir funcionando). */
  hidden?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const active = drag;
  const weekPx = timelineWidth / WEEKS || 1;
  const shown = effectiveStatus(item);
  const { trackStatusOf, showTracks } = useContext(Owners2026Context);
  const trackStatus = trackStatusOf(item);
  const trackDone = (work: Roadmap2026Work["work"]) =>
    (work === "design" && trackStatus.design === "concluido") ||
    (work === "engenharia" && trackStatus.engineering === "concluido") ||
    (work === "qa" && trackStatus.qa === "concluido");
  const late = shown === "atrasada";
  const done = shown === "concluida";

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
    <li data-drag-card={item.id} className={cn(ROW, "border-t border-line", late && "bg-[#fff8f8]", hidden && "hidden")}>
      <div
        className={cn(
          "group/row sticky left-0 z-10 flex flex-col justify-center gap-1 border-r border-line py-2.5 pr-4",
          onGrab ? "pl-8" : "pl-4",
          late ? "bg-[#fff8f8] shadow-[inset_3px_0_0_#e25858]" : "bg-surface",
        )}
      >
        {onGrab && (
          <button
            type="button"
            onPointerDown={onGrab}
            onKeyDown={(e) => {
              if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
              e.preventDefault();
              onReorderKey?.(e.key === "ArrowUp" ? -1 : 1);
            }}
            aria-label={`Mudar a ordem de ${item.title}: arraste ou use as setas para cima e para baixo`}
            title="Arraste para mudar a ordem"
            className="absolute inset-y-0 left-0 flex w-7 cursor-grab touch-none items-center justify-center text-[#b4bcd3] transition-colors hover:bg-[#f3f1fd] hover:text-brand focus-visible:text-brand active:cursor-grabbing"
          >
            <GripVertical size={16} aria-hidden />
          </button>
        )}
        {/* Para quem edita, a coluna inteira (nome, status e responsáveis) abre a edição. */}
        {(() => {
          const lateTitle = statusReason(item);
          const body = (
            <>
              <span className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-navy" title={item.title}>
                {item.title}
              </span>
              {item.subtitle && <span className="line-clamp-1 text-[12px] text-muted">{item.subtitle}</span>}
              <span className="flex flex-wrap items-center gap-1.5">
                <span title={lateTitle}>
                  <StatusBadge2026 status={shown} />
                </span>
                {item.backlog && <span className="text-[11.5px] font-semibold text-muted">Backlog</span>}
              </span>
              {showTracks && <TrackChips item={item} />}
            </>
          );
          return canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              title={lateTitle ? `${lateTitle} Clique para editar.` : "Editar status, nome, responsáveis e prazos"}
              className="-my-1 -mr-2 flex flex-col gap-1 rounded-lg py-1 pr-2 text-left transition-colors hover:bg-[#f6f4ff] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet"
            >
              {body}
            </button>
          ) : (
            body
          );
        })()}
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
                  (done || trackDone(s.work)) && "opacity-50",
                  dragging && "z-10 cursor-grabbing shadow-[0_8px_20px_rgba(23,27,77,0.28)] ring-2 ring-white",
                )}
                style={{ left: `calc(${weekPosition(s.start)}% + 1px)`, width: `calc(${width}% - 2px)`, background: tone.solid }}
              >
                {fits && (
                  <span className="flex min-w-0 items-center gap-1 truncate px-2">
                    {(done || trackDone(s.work)) && <Check size={12} className="shrink-0" aria-hidden />}
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

/** Mostrar/ocultar as frentes de todas as iniciativas do 2026 (Gantt e Cards). */
export function TrackToggle({ expanded, onChange }: { expanded: boolean; onChange: (expanded: boolean) => void }) {
  const Icon = expanded ? Shrink : Expand;
  return (
    <Button
      size="sm"
      icon={<Icon size={15} />}
      aria-pressed={expanded}
      title={expanded ? "Ocultar Design, Engenharia e QA de cada iniciativa" : "Mostrar o andamento e os responsáveis de Design, Engenharia e QA"}
      onClick={() => onChange(!expanded)}
    >
      {expanded ? "Recolher todos" : "Expandir todos"}
    </Button>
  );
}

/** Lugar exato onde a linha arrastada será solta. */
function DropRow({ height, position }: { height: number; position: number }) {
  return (
    <li
      aria-hidden
      className="flex animate-fade-in items-center gap-2 border-y-2 border-dashed border-violet bg-brand-soft/70 px-4 text-[13px] font-bold text-brand"
      style={{ height: Math.max(48, Math.min(height, 72)) }}
    >
      <ArrowDownToLine size={16} className="shrink-0" />
      Soltar aqui · posição {position}
    </li>
  );
}

function GanttRowSlot({ show, height, position, children }: { show: boolean; height: number; position: number; children: React.ReactNode }) {
  return (
    <>
      {show && <DropRow height={height} position={position} />}
      {children}
    </>
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
  onMove,
  fill = false,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  loading: boolean;
  canEdit: boolean;
  onEdit: (id: string) => void;
  onChange: (item: Roadmap2026Item) => void;
  /** Nova posição: antes de `beforeId` (ou depois de `afterId`), entre as linhas visíveis do mesmo squad. */
  onMove?: (id: string, beforeId: string | null, afterId: string | null) => void;
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
  /** Linhas visíveis do squad, sem a que está sendo arrastada. */
  const zoneItems = (squad: string, exceptId?: string) => items.filter((i) => i.squad === squad && i.id !== exceptId);
  const moveTo = (id: string, squad: string, index: number) => {
    const rows = zoneItems(squad, id);
    const beforeId = rows[index]?.id ?? null;
    onMove?.(id, beforeId, beforeId ? null : (rows[index - 1]?.id ?? null));
  };
  const { drag, onPointerDown } = useCardDrag({
    enabled: canEdit && !!onMove && !loading,
    // A ordem vale dentro do squad: soltar em outro grupo não muda nada.
    onDrop: (id, target: DropTarget, origin: DropTarget) => {
      if (target.zone !== origin.zone || target.index === origin.index) return;
      moveTo(id, target.zone, target.index);
    },
  });
  const dragged = drag ? items.find((i) => i.id === drag.id) : undefined;
  const reorderKey = (item: Roadmap2026Item, step: -1 | 1) => {
    const rows = zoneItems(item.squad);
    const index = rows.findIndex((i) => i.id === item.id) + step;
    if (index < 0 || index >= rows.length) return;
    moveTo(item.id, item.squad, index);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-drag-card="${item.id}"] button[aria-label^="Mudar a ordem"]`)?.focus());
  };

  const groupName = (squad: string, sample: Roadmap2026Item) => (sample.platformId && platforms.find((p) => p.id === sample.platformId)?.name) || squad;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#e3e9f4] bg-surface shadow-[0_2px_10px_rgba(23,27,77,0.04)]",
        fill ? "min-h-0 overflow-auto overscroll-contain [scrollbar-width:thin]" : "mt-6 overflow-x-auto",
      )}
    >
      <div className="min-w-[1000px]">
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
              {drag && dragged && dragged.squad === g.squad && (
                <div
                  aria-hidden
                  className="pointer-events-none fixed left-0 top-0 z-[60] w-[280px] rounded-xl border border-violet bg-surface px-4 py-2.5 shadow-[0_18px_40px_rgba(23,27,77,0.22)]"
                  style={{ transform: `translate(${drag.x - 18}px, ${drag.y - 22}px) rotate(1deg)` }}
                >
                  <span className="line-clamp-2 text-[13.5px] font-extrabold text-navy">{dragged.title}</span>
                  <StatusBadge2026 status={effectiveStatus(dragged)} />
                </div>
              )}
              <h3 className="sticky left-0 border-t border-line bg-[#fbfcff] px-4 py-2 text-[12.5px] font-extrabold text-muted">
                {groupName(g.squad, g.items[0])} · {plural(g.items.length, "iniciativa", "iniciativas")}
              </h3>
              <ul data-drop-zone={g.squad}>
                {g.items.map((item, idx) => {
                  const slotHere = drag && drag.origin.zone === g.squad && drag.target.zone === g.squad;
                  const position = slotHere ? zoneItems(g.squad, drag.id).findIndex((i) => i.id === item.id) : -1;
                  return (
                    <GanttRowSlot key={item.id} show={!!slotHere && position === drag!.target.index && item.id !== drag!.id} height={drag?.height ?? 0} position={drag ? drag.target.index + 1 : 0}>
                      <GanttRow2026
                        item={item}
                        timelineWidth={timelineWidth}
                        canEdit={canEdit}
                        onEdit={() => onEdit(item.id)}
                        onChange={onChange}
                        onGrab={canEdit && onMove ? (e) => onPointerDown(item.id, e) : undefined}
                        onReorderKey={(step) => reorderKey(item, step)}
                        hidden={drag?.id === item.id}
                      />
                      {/* Espaço de soltura no fim do grupo. */}
                      {slotHere && idx === g.items.length - 1 && drag!.target.index >= zoneItems(g.squad, drag!.id).length && <DropRow height={drag!.height} position={drag!.target.index + 1} />}
                    </GanttRowSlot>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

