"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/client/cn";

interface Option {
  value: string;
  label: ReactNode;
  text: string;
  disabled: boolean;
}

/** Lê os `<option>` filhos (inclusive dentro de fragmentos e listas) para manter a API do select nativo. */
function readOptions(children: ReactNode): Option[] {
  const out: Option[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
    if (el.type === "option") {
      const label = el.props.children;
      const text = Children.toArray(label).filter((c) => typeof c === "string" || typeof c === "number").join("");
      out.push({ value: String(el.props.value ?? text), label, text, disabled: !!el.props.disabled });
    } else if (el.props.children) {
      out.push(...readOptions(el.props.children));
    }
  });
  return out;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Classe do texto do valor selecionado. */
  valueClassName?: string;
  /** Tamanho do ícone de seta. */
  chevronSize?: number;
  "aria-label"?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  "aria-required"?: boolean;
  "data-autofocus"?: boolean;
}

/**
 * Select com a identidade visual do produto (substitui o `<select>` nativo). Aceita `<option>`
 * como filhos. Acessível como combobox: setas, Home/End, Enter/Espaço, Esc e busca por digitação.
 */
export function Select({
  value,
  onChange,
  children,
  id,
  disabled,
  className,
  valueClassName,
  chevronSize = 16,
  required,
  ...aria
}: SelectProps) {
  const options = useMemo(() => readOptions(children), [children]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; maxHeight: number; up: boolean } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const listId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];

  const place = useCallback(() => {
    const r = buttonRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 220 && above > below;
    setPos({ top: up ? r.top - 6 : r.bottom + 6, left: r.left, width: r.width, maxHeight: Math.min(320, up ? above : below), up });
  }, []);

  function openList(index = selectedIndex) {
    if (disabled) return;
    place();
    setActive(index >= 0 ? index : options.findIndex((o) => !o.disabled));
    setOpen(true);
  }

  function close(focus = true) {
    setOpen(false);
    if (focus) buttonRef.current?.focus({ preventScroll: true });
  }

  function choose(index: number) {
    const opt = options[index];
    if (!opt || opt.disabled) return;
    if (opt.value !== value) onChange(opt.value);
    close();
  }

  function move(from: number, step: 1 | -1) {
    for (let i = from + step; i >= 0 && i < options.length; i += step) if (!options[i].disabled) return i;
    return from;
  }

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !listRef.current?.contains(t)) close(false);
    };
    // Esc fecha só a lista, sem fechar o modal/drawer por trás.
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      close();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  useEffect(() => {
    if (open && active >= 0) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function typeahead(key: string) {
    const now = Date.now();
    typed.current = { text: (now - typed.current.at > 600 ? "" : typed.current.text) + key.toLowerCase(), at: now };
    const start = open ? active : selectedIndex;
    const n = options.length;
    for (let k = 1; k <= n; k++) {
      const i = (start + (typed.current.text.length > 1 ? k - 1 : k) + n) % n;
      if (!options[i].disabled && options[i].text.toLowerCase().startsWith(typed.current.text)) {
        if (open) setActive(i);
        else if (options[i].value !== value) onChange(options[i].value);
        return;
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((a) => move(a, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((a) => move(a, -1));
        break;
      case "Home":
        e.preventDefault();
        setActive(move(-1, 1));
        break;
      case "End":
        e.preventDefault();
        setActive(move(options.length, -1));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        choose(active);
        break;
      case "Tab":
        close(false);
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        aria-required={required || aria["aria-required"]}
        aria-label={aria["aria-label"]}
        aria-describedby={aria["aria-describedby"]}
        aria-invalid={aria["aria-invalid"]}
        data-autofocus={aria["data-autofocus"]}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "group relative flex w-full cursor-pointer items-center gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
      >
        <span className={cn("min-w-0 flex-1 truncate", !selected && "text-subtle", valueClassName)}>{selected ? selected.label : "Selecione…"}</span>
        <ChevronDown
          size={chevronSize}
          aria-hidden
          className={cn("shrink-0 text-muted transition-transform duration-150 group-hover:text-ink", open && "rotate-180 text-violet")}
        />
      </button>
      {open &&
        pos &&
        createPortal(
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={aria["aria-label"]}
            tabIndex={-1}
            style={{
              position: "fixed",
              left: pos.left,
              minWidth: pos.width,
              maxWidth: `min(${Math.max(pos.width, 320)}px, calc(100vw - ${pos.left + 12}px))`,
              maxHeight: pos.maxHeight,
              ...(pos.up ? { bottom: window.innerHeight - pos.top } : { top: pos.top }),
            }}
            className={cn(
              "z-[80] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface p-1.5 shadow-[0_18px_40px_-12px_rgba(23,27,77,0.28),0_2px_6px_rgba(23,27,77,0.06)]",
              "animate-[select-in_120ms_ease-out]",
            )}
          >
            {options.map((o, i) => {
              const isSelected = o.value === value;
              return (
                <li
                  key={`${o.value}-${i}`}
                  id={`${listId}-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={o.disabled || undefined}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => !o.disabled && active !== i && setActive(i)}
                  onClick={() => choose(i)}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-[14px] font-semibold text-ink",
                    i === active && "bg-brand-soft text-brand-strong",
                    isSelected && "text-brand-strong",
                    o.disabled && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{o.label}</span>
                  <Check size={15} strokeWidth={3} aria-hidden className={cn("shrink-0 text-violet", !isSelected && "invisible")} />
                </li>
              );
            })}
            {options.length === 0 && <li className="px-3 py-2 text-[13px] text-muted">Nenhuma opção disponível.</li>}
          </ul>,
          document.body,
        )}
    </>
  );
}
