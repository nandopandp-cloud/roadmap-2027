import type { ReactNode } from "react";
import { cn } from "@/lib/client/cn";

/** Estado vazio contextualizado, com ação opcional. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  compact,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-2xl border border-dashed border-line-strong bg-[#fafbfe] text-center",
        compact ? "gap-2 px-4 py-5" : "gap-3 px-6 py-10",
        className,
      )}
    >
      {icon && (
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-soft text-violet" aria-hidden>
          {icon}
        </span>
      )}
      <div>
        <p className="text-[15px] font-extrabold text-navy">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted">{description}</p>}
      </div>
      {action && <div className="mt-1 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-xl bg-[#e8edf6]", className)} />;
}

export function ErrorBanner({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#f3c6cb] bg-[#fdf1f2] px-4 py-3 text-sm text-[#8a1f2b]">
      <p className="flex-1 font-semibold">{message}</p>
      {action}
    </div>
  );
}
