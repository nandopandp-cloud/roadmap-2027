"use client";

import { MoreHorizontal, MoreVertical, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/client/cn";

export interface MenuAction {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  danger?: boolean;
}

/**
 * Menu de ações ("⋯") acessível: setas navegam entre os itens, Esc fecha e devolve o foco
 * ao botão, clique fora fecha.
 */
export function ActionMenu({
  label,
  actions,
  vertical,
  className,
}: {
  /** Rótulo acessível do botão (ex.: "Ações de Letícia Almeida"). */
  label: string;
  actions: MenuAction[];
  vertical?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const idx = items.indexOf(document.activeElement as HTMLElement);
    items[(idx + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const Icon = vertical ? MoreVertical : MoreHorizontal;
  return (
    <div ref={ref} className={cn("relative", className)} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        title="Mais ações"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-[#eef2fa] hover:text-ink"
      >
        <Icon size={18} />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className="absolute right-0 top-9 z-30 w-56 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 text-left shadow-[var(--shadow-raised)]"
        >
          {actions.map(({ label: itemLabel, icon: ItemIcon, onSelect, danger }) => (
            <button
              key={itemLabel}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect();
              }}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-semibold focus:outline-none",
                danger ? "text-[#b3242f] hover:bg-[#fdf1f2] focus:bg-[#fdf1f2]" : "text-ink hover:bg-[#f2f5fb] focus:bg-[#f2f5fb]",
              )}
            >
              <ItemIcon size={16} aria-hidden />
              {itemLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
