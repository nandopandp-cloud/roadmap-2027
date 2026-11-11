"use client";

import { Layers, Target, type LucideIcon } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@/lib/client/cn";
import { ROADMAP_YEARS } from "@/lib/domain/constants";
import type { RoadmapYear } from "@/lib/domain/types";

const YEAR_INFO: Record<RoadmapYear, { icon: LucideIcon; label: string }> = {
  2026: { icon: Target, label: "Execução e entregas" },
  2027: { icon: Layers, label: "Planejamento e priorização" },
};

/** Estrela de destaque do ano selecionado. */
function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" fill="#FFC83D" />
    </svg>
  );
}

/**
 * Navegação entre os roadmaps (2026: execução; 2027: planejamento). Grupo de opções com
 * setas no teclado. `compact`: versão menor para o cabeçalho da tela cheia.
 */
export function YearSwitch({ year, onChange, compact = false }: { year: RoadmapYear; onChange: (year: RoadmapYear) => void; compact?: boolean }) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
    e.preventDefault();
    const step = e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1;
    const next = ROADMAP_YEARS[(ROADMAP_YEARS.indexOf(year) + step + ROADMAP_YEARS.length) % ROADMAP_YEARS.length];
    onChange(next);
    document.getElementById(`roadmap-year-${next}${compact ? "-compact" : ""}`)?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label="Roadmap"
      className={cn(
        "flex w-full max-w-full border border-[#e3e6f5] bg-white/90 shadow-[0_6px_24px_rgba(70,50,160,0.10)] backdrop-blur sm:w-max",
        compact ? "rounded-[16px] p-1" : "rounded-[24px] p-1.5",
      )}
    >
      {ROADMAP_YEARS.map((y) => {
        const { icon: Icon, label } = YEAR_INFO[y];
        const on = year === y;
        return (
          <button
            key={y}
            id={`roadmap-year-${y}${compact ? "-compact" : ""}`}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(y)}
            onKeyDown={onKey}
            className={cn(
              "relative flex min-w-0 flex-1 items-center text-left transition-[background,box-shadow,color] duration-200 sm:flex-none",
              compact ? "gap-2.5 rounded-[12px] px-3.5 py-1.5" : "gap-3 rounded-[18px] px-4 py-3 sm:min-w-[280px] sm:gap-5 sm:px-7 sm:py-4",
              on
                ? "bg-[linear-gradient(135deg,#7b4dff_0%,#5b34e0_55%,#4a2bc6_100%)] text-white shadow-[0_12px_28px_rgba(91,52,224,0.35)]"
                : "text-navy hover:bg-[#f6f4ff]",
            )}
          >
            <Icon
              aria-hidden
              strokeWidth={1.9}
              className={cn("shrink-0", compact ? "h-[18px] w-[18px]" : "hidden h-8 w-8 min-[420px]:block sm:h-9 sm:w-9", on ? "text-white" : "text-navy")}
            />
            <span className="min-w-0">
              <span className={cn("block font-black leading-none", compact ? "text-[16px]" : "text-[24px] sm:text-[30px]")}>{y}</span>
              <span
                className={cn(
                  "block font-semibold leading-snug",
                  compact ? "mt-0.5 text-[11.5px]" : "mt-1 text-[13px] sm:mt-1.5 sm:text-[16.5px]",
                  on ? "text-white/95" : "text-muted",
                )}
              >
                {label}
              </span>
            </span>
            {on && <Sparkle className={cn("pointer-events-none absolute", compact ? "-top-1.5 right-2 h-3.5 w-3.5" : "-top-3 right-4 h-6 w-6 sm:h-7 sm:w-7")} />}
          </button>
        );
      })}
    </div>
  );
}
