"use client";

import { ArrowDownToLine, CircleDashed, Flag, GitFork, GripVertical } from "lucide-react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { useCardDrag, type ActiveDrag, type DropTarget } from "@/components/roadmap/use-card-drag";
import { PriorityBadge, StatusBadge, TransversalBadge } from "@/components/ui/badges";
import { Skeleton } from "@/components/ui/feedback";
import { ProgressBar } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn, plural } from "@/lib/client/cn";
import { isTransversal } from "@/lib/client/filtering";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { QUARTERS } from "@/lib/domain/constants";
import { QUARTER_LABEL, QUARTER_MONTHS } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { Initiative, Milestone, Platform, Quarter } from "@/lib/domain/types";

/** Chave da coluna "Sem quarter definido" nas zonas de soltura. */
const UNSCHEDULED = "sem";
const zoneOf = (q: Quarter | null) => q ?? UNSCHEDULED;
const quarterOf = (zone: string) => (zone === UNSCHEDULED ? null : (zone as Quarter));
const zoneLabel = (zone: string) => {
  const q = quarterOf(zone);
  return q ? QUARTER_LABEL[q] : "Sem quarter definido";
};

function PlatformDots({ ids, platforms }: { ids: string[]; platforms: Platform[] }) {
  const list = ids.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  if (!list.length) return <span className="text-[12px] font-semibold text-subtle">Plataformas a definir</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((p) => {
        const Glyph = PLATFORM_GLYPHS[p.icon];
        const tone = ACCENT_TONE[p.accent];
        return (
          <span key={p.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: tone.soft, color: tone.fg }}>
            <Glyph size={12} aria-hidden />
            {p.name}
          </span>
        );
      })}
    </span>
  );
}

interface CardProps {
  initiative: Initiative;
  platforms: Platform[];
  milestones: Milestone[];
  blockedBy: Initiative[];
  draggable: boolean;
}

function CardContent({ initiative: i, platforms, milestones, blockedBy, draggable }: CardProps) {
  return (
    <>
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-extrabold tracking-wide text-subtle">{i.id}</span>
        <span className="flex items-center gap-1.5">
          {isTransversal(i) && <TransversalBadge size="sm" />}
          {draggable && <GripVertical size={15} className="-mr-1 text-subtle" aria-hidden />}
        </span>
      </span>
      <span className="text-[15.5px] font-extrabold leading-snug text-navy">{i.title}</span>
      <span className="flex flex-wrap gap-1.5">
        <StatusBadge status={i.status} size="sm" />
        <PriorityBadge priority={i.priority} size="sm" />
      </span>
      <PlatformDots ids={i.platformIds} platforms={platforms} />
      <ProgressBar value={progressOf(i.phases)} />
      {milestones.length > 0 && (
        <span className="flex flex-col gap-1 border-t border-line pt-2">
          {milestones.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Flag size={12} className="shrink-0 text-teal" aria-hidden />
              <span className={cn(m.done && "line-through")}>{m.title}</span>
            </span>
          ))}
        </span>
      )}
      {blockedBy.length > 0 && (
        <span className="flex items-start gap-1.5 rounded-lg bg-[#fff6e5] px-2 py-1.5 text-[12px] font-semibold text-[#7a4b00]">
          <GitFork size={13} className="mt-0.5 shrink-0" aria-hidden />
          Depende de {blockedBy.map((b) => b.id).join(", ")}
        </span>
      )}
      {!i.planningValidated && <span className="text-[11.5px] font-semibold text-subtle">Planejamento a validar</span>}
    </>
  );
}

const CARD_CLASS = "flex w-full flex-col gap-2.5 rounded-2xl border bg-surface p-4 text-left";

function RoadmapCard({
  selected,
  onOpen,
  onPointerDown,
  onKeyDown,
  ...props
}: CardProps & {
  selected: boolean;
  onOpen: () => void;
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      aria-pressed={selected}
      aria-describedby={props.draggable ? "roadmap-drag-hint" : undefined}
      className={cn(
        CARD_CLASS,
        "transition-all [-webkit-touch-callout:none]",
        props.draggable && "cursor-grab select-none active:cursor-grabbing",
        selected ? "border-[#3f6fe6] shadow-[0_0_0_1px_#3f6fe6]" : "border-line shadow-[var(--shadow-card)] hover:-translate-y-px hover:border-line-strong",
      )}
    >
      <CardContent {...props} />
    </button>
  );
}

/** Marco de uma iniciativa em outro quarter — mesmo registro, sem duplicar a iniciativa. */
function MilestoneCard({ initiative, milestone, onOpen }: { initiative: Initiative; milestone: Milestone; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-2xl border border-dashed border-[#b9c6e4] bg-[#f8faff] p-3 text-left transition-colors hover:border-violet hover:bg-surface"
    >
      <Flag size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden />
      <span className="min-w-0">
        <span className={cn("block text-[13.5px] font-bold text-ink", milestone.done && "line-through")}>{milestone.title}</span>
        <span className="block text-[12px] text-muted">
          Marco de {initiative.id} · {initiative.title}
        </span>
      </span>
    </button>
  );
}

/** Lugar exato onde o card arrastado será inserido. */
function DropSlot({ drag, position, zone }: { drag: ActiveDrag; position: number; zone: string }) {
  return (
    <li
      aria-hidden
      className="flex animate-fade-in items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet bg-brand-soft/70 px-3 text-center text-[13px] font-bold text-brand"
      style={{ height: drag.height }}
    >
      <ArrowDownToLine size={16} className="shrink-0" />
      Soltar em {zoneLabel(zone)} · posição {position}
    </li>
  );
}

/** Card que acompanha o ponteiro durante o arraste. */
function DragGhost({ drag, children }: { drag: ActiveDrag; children: ReactNode }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[60]"
      style={{ width: drag.width, transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)` }}
    >
      <div className={cn(CARD_CLASS, "rotate-[1.5deg] border-violet shadow-[0_18px_40px_rgba(23,27,77,0.22)]", !drag.over && "opacity-70")}>
        {children}
      </div>
    </div>
  );
}

export function RoadmapBoard({
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
  const { data, moveInitiative } = useRoadmap();
  const notify = useToast();
  const canMove = data.writable && !loading;

  const byId = (id: string) => data.initiatives.find((i) => i.id === id);
  const column = (zone: string, exceptId?: string) => visible.filter((i) => zoneOf(i.quarter) === zone && i.id !== exceptId);

  /** Converte a posição entre os cards visíveis em vizinhos, que valem mesmo com filtro de plataforma. */
  async function move(id: string, zone: string, index: number) {
    const cards = column(zone, id);
    const beforeId = cards[index]?.id ?? null;
    const afterId = beforeId ? null : (cards[index - 1]?.id ?? null);
    const fromZone = zoneOf(byId(id)?.quarter ?? null);
    try {
      await moveInitiative(id, { quarter: quarterOf(zone), beforeId, afterId });
      notify("success", fromZone === zone ? `Ordem de ${zoneLabel(zone)} atualizada.` : `${id} movida para ${zoneLabel(zone)}.`);
      return true;
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível mover a iniciativa.");
      return false;
    }
  }

  const { drag, onPointerDown } = useCardDrag({
    enabled: canMove,
    onDrop: (id, target: DropTarget, origin: DropTarget) => {
      if (target.zone === origin.zone && target.index === origin.index) return;
      void move(id, target.zone, target.index);
    },
  });

  /** Alt + setas: ←/→ trocam o quarter (vai para o fim da coluna), ↑/↓ mudam a posição. */
  async function onCardKey(e: KeyboardEvent<HTMLButtonElement>, i: Initiative) {
    if (!canMove || !e.altKey || !e.key.startsWith("Arrow")) return;
    const zones = [...QUARTERS, UNSCHEDULED];
    const zone = zoneOf(i.quarter);
    const index = column(zone).findIndex((x) => x.id === i.id);
    let target: DropTarget | null = null;
    if (e.key === "ArrowUp" && index > 0) target = { zone, index: index - 1 };
    if (e.key === "ArrowDown" && index < column(zone).length - 1) target = { zone, index: index + 1 };
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      const next = zones[zones.indexOf(zone) + (e.key === "ArrowLeft" ? -1 : 1)];
      if (next) target = { zone: next, index: column(next, i.id).length };
    }
    e.preventDefault();
    if (!target) return;
    if (await move(i.id, target.zone, target.index)) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-drag-card="${i.id}"] button`)?.focus());
    }
  }

  const cardProps = (i: Initiative, q: Quarter | null): CardProps => ({
    initiative: i,
    platforms: data.platforms,
    milestones: showMilestones && q ? i.milestones.filter((m) => m.quarter === q) : [],
    blockedBy: i.dependsOn.map(byId).filter((x): x is Initiative => !!x),
    draggable: canMove,
  });

  /**
   * Cards da coluna com o espaço de soltura na posição de destino. O card arrastado continua
   * no DOM (oculto): no toque, os eventos seguem indo para o elemento onde o toque começou.
   */
  const renderCards = (zone: string) => {
    const q = quarterOf(zone);
    const cards = column(zone);
    const items: ReactNode[] = cards.map((i) => (
      <li key={i.id} data-drag-card={i.id} className={cn(drag?.id === i.id && "hidden")}>
        <RoadmapCard
          {...cardProps(i, q)}
          selected={selectedId === i.id}
          onOpen={() => onOpen(i.id)}
          onPointerDown={(e) => onPointerDown(i.id, e)}
          onKeyDown={(e) => void onCardKey(e, i)}
        />
      </li>
    ));
    if (drag && drag.target.zone === zone) {
      const anchor = column(zone, drag.id)[drag.target.index];
      items.splice(anchor ? cards.indexOf(anchor) : cards.length, 0, (
        <DropSlot key="slot" drag={drag} zone={zone} position={drag.target.index + 1} />
      ));
    }
    return items;
  };

  /** Coluna sem cards visíveis (desconsidera o card que está sendo arrastado para fora). */
  const isEmpty = (zone: string) => column(zone, drag?.id).length === 0 && drag?.target.zone !== zone;

  const dragged = drag ? byId(drag.id) : undefined;
  const unscheduled = column(UNSCHEDULED);

  return (
    <>
      <p id="roadmap-drag-hint" className="sr-only">
        Arraste para mudar o quarter ou a posição. No teclado, Alt com seta para a esquerda ou direita troca o quarter e Alt com
        seta para cima ou para baixo muda a posição.
      </p>

      <div className="@container mt-6">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {QUARTERS.map((q) => {
            const main = column(q);
            const markers = showMilestones
              ? visible.flatMap((i) => i.milestones.filter((m) => m.quarter === q && i.quarter !== q).map((m) => ({ initiative: i, milestone: m })))
              : [];
            const isTarget = drag?.over && drag.target.zone === q;
            return (
              <section
                key={q}
                aria-labelledby={`col-${q}`}
                data-drop-zone={q}
                className={cn(
                  "flex flex-col rounded-[24px] border p-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)] backdrop-blur transition-colors",
                  isTarget ? "border-violet bg-[#f6f3ff]/90" : "border-[#e3e9f4] bg-white/70",
                )}
              >
                <header className="flex items-baseline justify-between gap-2 px-2 pb-3 pt-1">
                  <div>
                    <h2 id={`col-${q}`} className="text-[18px] font-black text-navy">
                      {q}
                    </h2>
                    <p className="text-[12.5px] font-semibold text-muted">{QUARTER_MONTHS[q]}</p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-brand">
                    {plural(main.length, "iniciativa", "iniciativas")}
                  </span>
                </header>
                {loading ? (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-40" />
                  </div>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {renderCards(q)}
                    {markers.map(({ initiative, milestone }) => (
                      <li key={`${initiative.id}-${milestone.id}`}>
                        <MilestoneCard initiative={initiative} milestone={milestone} onOpen={() => onOpen(initiative.id)} />
                      </li>
                    ))}
                    {isEmpty(q) && markers.length === 0 && (
                      <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                        <CircleDashed size={20} aria-hidden />
                        Nenhuma iniciativa em {QUARTER_LABEL[q]}.
                      </li>
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {!loading && (unscheduled.length > 0 || drag) && (
        <section
          aria-labelledby="sem-quarter"
          data-drop-zone={UNSCHEDULED}
          data-drop-grid
          className={cn(
            "mt-8 rounded-[24px] border p-3 transition-colors",
            drag?.over && drag.target.zone === UNSCHEDULED ? "border-violet bg-[#f6f3ff]/90" : "border-transparent",
          )}
        >
          <h2 id="sem-quarter" className="px-1 text-[18px] font-black text-navy">
            Sem quarter definido
          </h2>
          <p className="px-1 text-[13px] text-muted">Iniciativas ainda não posicionadas no ano.</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {renderCards(UNSCHEDULED)}
            {drag && isEmpty(UNSCHEDULED) && (
              <li className="flex items-center justify-center rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                Solte aqui para retirar a iniciativa do planejamento do ano.
              </li>
            )}
          </ul>
        </section>
      )}

      {drag && dragged && (
        <DragGhost drag={drag}>
          <CardContent {...cardProps(dragged, dragged.quarter)} />
        </DragGhost>
      )}
    </>
  );
}
