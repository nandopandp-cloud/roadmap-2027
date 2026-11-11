"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/client/cn";

export interface MultiOption {
  value: string;
  label: string;
  /** Contagem exibida ao lado do rótulo (opcional). */
  count?: number;
}

/**
 * Seleção múltipla em lista suspensa com caixas de seleção. Nada marcado = todos.
 * Mesmo visual do `Select`; Esc ou clique fora fecham; setas percorrem as opções.
 */
export function MultiSelect({
  label,
  options,
  value,
  onChange,
  allLabel = "Todos",
  allCount,
  className,
}: {
  /** Rótulo acessível do campo. */
  label: string;
  options: MultiOption[];
  value: string[];
  onChange: (value: string[]) => void;
  allLabel?: string;
  allCount?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  const chosen = options.filter((o) => value.includes(o.value));
  const withCount = (text: string, count?: number) => (count === undefined ? text : `${text} (${count})`);
  const summary = !chosen.length
    ? withCount(allLabel, allCount)
    : chosen.length === 1
      ? withCount(chosen[0].label, chosen[0].count)
      : `${chosen.map((o) => o.label).join(", ")} (${chosen.reduce((n, o) => n + (o.count ?? 0), 0)})`;

  const focusItem = (step: number) => {
    const items = [...(ref.current?.querySelectorAll<HTMLElement>("[data-multi-item]") ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    items[(index + step + items.length) % items.length]?.focus();
  };
  const onListKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      focusItem(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  };

  const item = (key: string, text: string, checked: boolean, onClick: () => void) => (
    <button
      key={key}
      type="button"
      role="menuitemcheckbox"
      aria-checked={checked}
      data-multi-item
      onClick={onClick}
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[14px] font-semibold text-ink transition-colors hover:bg-[#f3f1fd] focus:bg-[#f3f1fd] focus:outline-none"
    >
      <span
        aria-hidden
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-2",
          checked ? "border-action bg-action text-white" : "border-line-strong bg-surface",
        )}
      >
        {checked && <Check size={12} strokeWidth={3.2} />}
      </span>
      {text}
    </button>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={`${label}: ${summary}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => focusItem(1));
          }
        }}
        className={cn(
          "group flex h-10 w-full min-w-[180px] items-center gap-2 rounded-xl border bg-surface px-3 text-left text-[14px] font-semibold text-ink transition-colors hover:border-line-strong focus:outline-none focus-visible:border-violet focus-visible:ring-4 focus-visible:ring-[#6045d8]/12",
          open ? "border-violet ring-4 ring-[#6045d8]/12" : "border-line",
        )}
      >
        <span className="min-w-0 flex-1 truncate">{summary}</span>
        <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-muted transition-transform", open && "rotate-180 text-violet")} />
      </button>
      {open && (
        <div
          id={listId}
          role="menu"
          aria-label={label}
          onKeyDown={onListKey}
          className="absolute left-0 top-full z-40 mt-2 w-full min-w-[220px] rounded-2xl border border-line bg-surface p-1.5 shadow-[0_18px_40px_rgba(23,27,77,0.18)]"
        >
          {item("__all", withCount(allLabel, allCount), value.length === 0, () => onChange([]))}
          <div aria-hidden className="mx-2 my-1 border-t border-line" />
          {options.map((o) => item(o.value, withCount(o.label, o.count), value.includes(o.value), () => toggle(o.value)))}
        </div>
      )}
    </div>
  );
}
