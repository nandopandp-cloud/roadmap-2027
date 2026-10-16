"use client";

import { ChevronRight } from "lucide-react";
import { InitiativeIllustration } from "@/components/initiatives/initiative-illustration";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { Badge, QuarterBadge, StatusBadge, TransversalBadge } from "@/components/ui/badges";
import { cn } from "@/lib/client/cn";
import { isTransversal } from "@/lib/client/filtering";
import { ACCENT_TONE } from "@/lib/client/tones";
import type { Initiative, Platform } from "@/lib/domain/types";

interface Props {
  initiative: Initiative;
  platforms: Platform[];
  selected: boolean;
  compact: boolean;
  onOpen: () => void;
}

/** Card do catálogo: identifica e compara iniciativas sem expor o conteúdo completo. */
export function InitiativeCard({ initiative: i, platforms, selected, compact, onOpen }: Props) {
  const impacted = i.platformIds.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  const single = !isTransversal(i) ? impacted[0] : undefined;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      aria-label={`${i.title} — abrir detalhes`}
      className={cn(
        "group relative flex w-full items-center gap-5 rounded-[20px] border bg-surface p-4 text-left transition-all duration-150 sm:p-[18px]",
        selected
          ? "border-[#3f6fe6] shadow-[0_0_0_1px_#3f6fe6,var(--shadow-card)]"
          : "border-line shadow-[var(--shadow-card)] hover:-translate-y-px hover:border-line-strong hover:shadow-[var(--shadow-raised)]",
      )}
    >
      <InitiativeIllustration
        id={i.id}
        illustration={i.illustration}
        className={cn("hidden sm:block", compact ? "h-[88px] w-[84px]" : "h-[108px] w-[104px]")}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <span className="block min-w-[13rem] flex-1 text-[18px] font-extrabold leading-snug text-navy sm:text-[19px]">{i.title}</span>
          <div className="flex shrink-0 flex-wrap gap-2">
            <QuarterBadge quarter={i.quarter} size="sm" />
            {isTransversal(i) ? (
              <TransversalBadge size="sm" />
            ) : single ? (
              <Badge tone={{ bg: ACCENT_TONE[single.accent].soft, fg: ACCENT_TONE[single.accent].fg, dot: "" }} size="sm">
                {single.name}
              </Badge>
            ) : null}
          </div>
        </div>

        {i.summary && <span className="mt-1 line-clamp-2 text-[14.5px] leading-relaxed text-muted">{i.summary}</span>}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {impacted.map((p) => (
            <PlatformChip key={p.id} platform={p} />
          ))}
          {impacted.length === 0 && <span className="text-xs font-semibold text-subtle">Plataformas a definir</span>}
          {i.tags.length > 0 && !compact && (
            <span className="ml-1 hidden text-xs font-semibold text-subtle 2xl:inline">
              {i.tags.slice(0, 3).map((t) => `#${t}`).join("  ")}
            </span>
          )}
          <span className="ml-auto flex items-center gap-2.5">
            <StatusBadge status={i.status} size="sm" />
            <span className="text-[11.5px] font-extrabold tracking-wide text-subtle">{i.id}</span>
          </span>
        </div>
      </div>

      <ChevronRight
        size={22}
        aria-hidden
        className={cn("shrink-0 transition-transform group-hover:translate-x-0.5", selected ? "text-[#3f6fe6]" : "text-navy")}
      />
    </button>
  );
}
