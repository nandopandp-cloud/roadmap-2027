"use client";

import { ArrowDownToLine, ChevronDown, ChevronsDownUp, ChevronsUpDown, GripVertical, Plus, Trash2 } from "lucide-react";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { useCardDrag, type ActiveDrag } from "@/components/ui/use-card-drag";
import { cn } from "@/lib/client/cn";

interface Props<T extends { id: string }> {
  /** Identificador da lista (zona de arraste). */
  zone: string;
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel: string;
  empty: string;
  itemLabel: (item: T, idx: number) => string;
  /** Linha de resumo exibida no cabeçalho recolhido (tipo, status, origem…). */
  itemSummary: (item: T) => string;
  icon: ReactNode;
  /** O item tem erro de validação: fica sempre aberto para mostrar o campo. */
  hasError: (idx: number) => boolean;
  render: (item: T, update: (patch: Partial<T>) => void, idx: number) => ReactNode;
}

/**
 * Lista do formulário com itens recolhíveis e ordem alterável: arrastar pela alça
 * (mouse ou toque longo) ou, com a alça em foco, usar as setas para cima/baixo.
 * A ordem da lista é a ordem exibida nos detalhes da iniciativa.
 */
export function SortableRepeater<T extends { id: string }>({
  zone,
  items,
  onChange,
  create,
  addLabel,
  empty,
  itemLabel,
  itemSummary,
  icon,
  hasError,
  render,
}: Props<T>) {
  // Com um único item, ele já começa aberto; com vários, recolhidos para facilitar a ordenação.
  const [open, setOpen] = useState<Set<string>>(() => new Set(items.length === 1 ? [items[0].id] : []));
  const [announcement, setAnnouncement] = useState("");

  const isOpen = (item: T, idx: number) => open.has(item.id) || hasError(idx);
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOpen = items.length > 0 && items.every((item, idx) => isOpen(item, idx));

  function move(id: string, index: number) {
    const from = items.findIndex((x) => x.id === id);
    if (from < 0 || index < 0 || index >= items.length || index === from) return;
    const next = items.filter((x) => x.id !== id);
    next.splice(index, 0, items[from]);
    onChange(next);
    setAnnouncement(`${itemLabel(items[from], from)} movido para a posição ${index + 1} de ${items.length}.`);
  }

  const { drag, onPointerDown } = useCardDrag({
    enabled: items.length > 1,
    onDrop: (id, target) => target.zone === zone && move(id, target.index),
  });

  function onHandleKey(e: KeyboardEvent<HTMLButtonElement>, id: string, idx: number) {
    const delta = e.key === "ArrowUp" ? -1 : e.key === "ArrowDown" ? 1 : 0;
    if (!delta) return;
    e.preventDefault();
    move(id, idx + delta);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-drag-handle="${zone}:${id}"]`)?.focus());
  }

  const dragged = drag ? items.find((x) => x.id === drag.id) : undefined;
  const visible = items.filter((x) => x.id !== drag?.id);
  const slotAt = drag && drag.target.zone === zone ? drag.target.index : -1;

  const header = (item: T, idx: number, opts: { ghost?: boolean } = {}) => {
    const expanded = !opts.ghost && isOpen(item, idx);
    const bodyId = `${zone}-${item.id}-campos`;
    return (
      <div className="flex items-center gap-1.5 p-2 pr-2.5">
        <button
          type="button"
          data-drag-handle={`${zone}:${item.id}`}
          aria-label={`Reordenar ${itemLabel(item, idx)} (posição ${idx + 1} de ${items.length}). Arraste ou use as setas para cima e para baixo.`}
          title="Arraste para mudar a ordem"
          disabled={items.length < 2}
          onPointerDown={(e) => onPointerDown(item.id, e)}
          onKeyDown={(e) => onHandleKey(e, item.id, idx)}
          className="flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-subtle transition-colors hover:bg-[#eef2fa] hover:text-ink active:cursor-grabbing disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <GripVertical size={18} />
        </button>
        <button
          type="button"
          onClick={() => toggle(item.id)}
          aria-expanded={expanded}
          aria-controls={bodyId}
          disabled={hasError(idx)}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-[#f5f7fd] disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-violet" aria-hidden>
            {icon}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14.5px] font-extrabold text-navy">{itemLabel(item, idx)}</span>
            <span className="block truncate text-[12.5px] text-muted">{itemSummary(item)}</span>
          </span>
          {hasError(idx) && <span className="shrink-0 rounded-full bg-[#fdecec] px-2 py-0.5 text-[11.5px] font-bold text-[#b3242f]">Revisar</span>}
          <ChevronDown size={18} aria-hidden className={cn("shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
        </button>
        <IconButton label={`Remover ${itemLabel(item, idx)}`} onClick={() => onChange(items.filter((x) => x.id !== item.id))}>
          <Trash2 size={17} />
        </IconButton>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-3">
      {items.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12.5px] text-muted">Arraste pela alça para definir a ordem exibida nos detalhes da iniciativa.</p>
          <Button
            size="sm"
            variant="ghost"
            icon={allOpen ? <ChevronsDownUp size={15} /> : <ChevronsUpDown size={15} />}
            onClick={() => setOpen(allOpen ? new Set() : new Set(items.map((x) => x.id)))}
          >
            {allOpen ? "Recolher todos" : "Expandir todos"}
          </Button>
        </div>
      )}
      {items.length === 0 && <p className="rounded-xl bg-[#f7f9fd] px-4 py-3 text-[13.5px] text-muted">{empty}</p>}
      {items.length > 0 && (
        <ol data-drop-zone={zone} className="flex flex-col gap-2.5">
          {items.map((item, idx) => {
            const position = visible.indexOf(item);
            const expanded = isOpen(item, idx);
            return [
              position === slotAt && drag ? <DropSlot key="slot" drag={drag} position={slotAt + 1} /> : null,
              <li
                key={item.id}
                data-drag-card={item.id}
                className={cn("min-w-0 rounded-2xl border border-line bg-surface", expanded && "border-line-strong", drag?.id === item.id && "hidden")}
              >
                {/* min-w-0: por padrão o fieldset cresce até caber o conteúdo (caminhos longos) e estoura a largura. */}
                <fieldset className="min-w-0">
                  <legend className="sr-only">{itemLabel(item, idx)}</legend>
                  {header(item, idx)}
                  {expanded && (
                    <div id={`${zone}-${item.id}-campos`} className="border-t border-line px-4 pb-4 pt-4">
                      {render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))), idx)}
                    </div>
                  )}
                </fieldset>
              </li>,
            ];
          })}
          {drag && slotAt === visible.length && <DropSlot drag={drag} position={slotAt + 1} />}
        </ol>
      )}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
      <div>
        <Button
          size="sm"
          icon={<Plus size={15} />}
          onClick={() => {
            const item = create();
            onChange([...items, item]);
            setOpen((prev) => new Set(prev).add(item.id));
          }}
        >
          {addLabel}
        </Button>
      </div>
      {drag && dragged && (
        <div
          aria-hidden
          className="pointer-events-none fixed left-0 top-0 z-[70] rounded-2xl border border-violet bg-surface shadow-[0_18px_40px_rgba(23,27,77,0.22)]"
          style={{ width: drag.width, transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px) rotate(1deg)` }}
        >
          {header(dragged, items.indexOf(dragged), { ghost: true })}
        </div>
      )}
    </div>
  );
}

function DropSlot({ drag, position }: { drag: ActiveDrag; position: number }) {
  return (
    <li
      aria-hidden
      className="flex animate-fade-in items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-violet bg-brand-soft/70 px-3 text-[13px] font-bold text-brand"
      style={{ height: Math.min(drag.height, 64) }}
    >
      <ArrowDownToLine size={16} className="shrink-0" />
      Soltar na posição {position}
    </li>
  );
}
