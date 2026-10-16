import { cn } from "@/lib/client/cn";

/** Barra de progresso derivada das etapas concluídas (null = sem etapas definidas). */
export function ProgressBar({ value, className, showLabel = true }: { value: number | null; className?: string; showLabel?: boolean }) {
  if (value === null) {
    return <span className={cn("text-[12.5px] font-semibold text-subtle", className)}>Sem etapas definidas</span>;
  }
  return (
    <span className={cn("flex items-center gap-3", className)}>
      <span
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Progresso das etapas"
        className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#E6EBF5]"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,#2868E8,#5B8CFF)] transition-[width] duration-300"
          style={{ width: `${value}%` }}
        />
      </span>
      {showLabel && <span className="w-9 shrink-0 text-right text-[13px] font-semibold text-muted">{value}%</span>}
    </span>
  );
}

export function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-8 items-center rounded-[10px] bg-[#EEF2F9] px-3 text-[13px] font-semibold text-[#3b4470]">{children}</span>
  );
}
