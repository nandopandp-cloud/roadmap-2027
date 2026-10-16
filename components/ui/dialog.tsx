"use client";

import { X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button, IconButton } from "@/components/ui/button";
import { cn } from "@/lib/client/cn";

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Prende o foco dentro de um contêiner enquanto ativo, fecha com Esc e
 * devolve o foco ao elemento anterior ao fechar.
 */
export function useFocusTrap(active: boolean, onEscape?: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const escapeRef = useRef(onEscape);
  escapeRef.current = onEscape;

  useEffect(() => {
    if (!active) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first = node?.querySelector<HTMLElement>("[data-autofocus]") ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus({ preventScroll: true });

    function onKey(event: KeyboardEvent) {
      if (!node) return;
      if (event.key === "Escape" && escapeRef.current) {
        // Somente o diálogo mais ao topo responde ao Esc.
        const layers = document.querySelectorAll("[data-layer]");
        if (layers[layers.length - 1] !== node) return;
        event.stopPropagation();
        escapeRef.current();
      }
      if (event.key !== "Tab") return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const [head, tail] = [items[0], items[items.length - 1]];
      if (event.shiftKey && document.activeElement === head) {
        event.preventDefault();
        tail.focus();
      } else if (!event.shiftKey && document.activeElement === tail) {
        event.preventDefault();
        head.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [active]);

  return ref;
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  /** Conteúdo sem padding interno (ex.: formulários com layout próprio). */
  bare?: boolean;
}

const SIZE = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-6xl" };

export function Modal({ open, onClose, title, description, children, footer, size = "md", bare }: ModalProps) {
  const ref = useFocusTrap(open, onClose);
  const titleId = useId();
  const descId = useId();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div className="absolute inset-0 animate-fade-in bg-[#171b4d]/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={ref}
        data-layer
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative flex max-h-[100dvh] w-full animate-pop-in flex-col overflow-hidden bg-surface shadow-[var(--shadow-raised)] sm:max-h-[92dvh] sm:rounded-3xl",
          "rounded-t-3xl",
          SIZE[size],
        )}
      >
        <header className="flex items-start gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-extrabold text-navy">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm text-muted">
                {description}
              </p>
            )}
          </div>
          <IconButton label="Fechar" onClick={onClose} className="-mr-2 -mt-1">
            <X size={20} />
          </IconButton>
        </header>
        <div className={cn("min-h-0 flex-1 overflow-y-auto", !bare && "px-6 py-5")}>{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line px-6 py-4">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Confirmação (substitui window.confirm) ---------- */

interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;
const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) => new Promise<boolean>((resolve) => setState({ ...options, resolve })),
    [],
  );

  const close = (value: boolean) => {
    state?.resolve(value);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Modal
        open={!!state}
        onClose={() => close(false)}
        title={state?.title}
        size="sm"
        footer={
          <>
            <Button onClick={() => close(false)} data-autofocus>
              {state?.cancelLabel ?? "Cancelar"}
            </Button>
            <Button variant={state?.tone === "danger" ? "danger" : "primary"} onClick={() => close(true)}>
              {state?.confirmLabel ?? "Confirmar"}
            </Button>
          </>
        }
      >
        <div className="text-[15px] leading-relaxed text-[#2b3163]">{state?.message}</div>
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm deve ser usado dentro de <ConfirmProvider>.");
  return ctx;
}
