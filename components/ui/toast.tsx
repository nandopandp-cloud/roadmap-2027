"use client";

import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

type Notify = (kind: ToastKind, message: string) => void;
const ToastContext = createContext<Notify | null>(null);

const ICON = { success: CheckCircle2, error: TriangleAlert, info: Info };
const COLOR = { success: "#00857c", error: "#c42b3a", info: "#2868e8" };

/** Mensagens discretas de sucesso/erro (sem alert()). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const notify = useCallback<Notify>(
    (kind, message) => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-3), { id, kind, message }]);
      setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0">
        {toasts.map((t) => {
          const Icon = ICON[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex animate-toast-in items-start gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-sm font-semibold text-ink shadow-[var(--shadow-raised)]"
            >
              <Icon size={18} className="mt-0.5 shrink-0" style={{ color: COLOR[t.kind] }} aria-hidden />
              <p className="flex-1 leading-snug">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="-mr-1 rounded-md p-0.5 text-subtle hover:text-ink"
                aria-label="Dispensar mensagem"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): Notify {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>.");
  return ctx;
}
