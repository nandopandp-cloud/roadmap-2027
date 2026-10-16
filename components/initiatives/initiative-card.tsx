"use client";

import { ChevronRight } from "lucide-react";
import { InitiativeIllustration } from "@/components/initiatives/initiative-illustration";
import { PlatformPill } from "@/components/platforms/platform-icon";
import { StatusBadge } from "@/components/ui/badges";
import { ProgressBar, TagChip } from "@/components/ui/progress";
import { cn } from "@/lib/client/cn";
import { QUARTER_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { Initiative, Platform } from "@/lib/domain/types";

interface Props {
  initiative: Initiative;
  platforms: Platform[];
  selected: boolean;
  layout: "list" | "grid";
  onOpen: () => void;
}

/** Card do catálogo: identifica e compara iniciativas sem expor o conteúdo completo. */
export function InitiativeCard({ initiative: i, platforms, selected, layout, onOpen }: Props) {
  const impacted = i.platformIds.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  const progress = progressOf(i.phases);
  const quarter = i.quarter ? QUARTER_LABEL[i.quarter] : "Sem quarter";

  const frame = cn(
    "group relative w-full rounded-[22px] border bg-surface text-left transition-all duration-150",
    selected
      ? "border-[#4a78ec] shadow-[0_0_0_1.5px_#4a78ec,0_10px_30px_rgba(40,104,232,0.12)]"
      : "border-[#e6ebf5] shadow-[0_2px_4px_rgba(23,27,77,0.03),0_10px_28px_rgba(23,27,77,0.05)] hover:-translate-y-0.5 hover:border-line-strong hover:shadow-[0_14px_34px_rgba(23,27,77,0.09)]",
  );

  const platformsRow =
    impacted.length > 0 ? (
      impacted.map((p) => <PlatformPill key={p.id} platform={p} />)
    ) : (
      <span className="text-[12.5px] font-semibold text-subtle">Plataformas a definir</span>
    );

  if (layout === "grid") {
    return (
      <button type="button" onClick={onOpen} aria-pressed={selected} aria-label={`${i.title} — abrir detalhes`} className={cn(frame, "flex h-full flex-col overflow-hidden")}>
        <InitiativeIllustration id={i.id} illustration={i.illustration} customImage={i.customImage} className="h-44 w-full rounded-none rounded-t-[21px]" />
        <span className="flex flex-1 flex-col p-5">
          <span className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-semibold text-muted">{quarter}</span>
            <StatusBadge status={i.status} size="sm" />
          </span>
          <span className="mt-2.5 block text-[18px] font-extrabold leading-snug text-navy">{i.title}</span>
          {i.summary && <span className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-muted">{i.summary}</span>}
          <ProgressBar value={progress} className="mt-4" />
          <span className="mt-4 flex flex-wrap gap-2">{platformsRow}</span>
          <span className="mt-3 text-[11.5px] font-extrabold tracking-wide text-subtle">{i.id}</span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      aria-label={`${i.title} — abrir detalhes`}
      className={cn(frame, "flex items-center gap-5 p-4 pr-5")}
    >
      <InitiativeIllustration id={i.id} illustration={i.illustration} customImage={i.customImage} className="hidden h-[112px] w-[110px] sm:block" />

      <span className="block min-w-0 flex-1">
        <span className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
          <span className="block min-w-0 flex-1">
            <span className="block text-[18px] font-extrabold leading-snug tracking-[-0.005em] text-navy sm:text-[19px]">{i.title}</span>
            {i.summary && <span className="mt-1 line-clamp-2 text-[14.5px] leading-relaxed text-muted">{i.summary}</span>}
          </span>
          <span className="flex w-full shrink-0 flex-col gap-3 md:w-[200px]">
            <span className="flex items-center gap-3">
              <span className="whitespace-nowrap text-[14px] font-semibold text-muted">{quarter}</span>
              <StatusBadge status={i.status} size="sm" />
            </span>
            <ProgressBar value={progress} />
          </span>
        </span>

        <span className="mt-3.5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <span className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11.5px] font-extrabold tracking-wide text-subtle">{i.id}</span>
            {i.tags.slice(0, 3).map((t) => (
              <TagChip key={t}>{t}</TagChip>
            ))}
          </span>
          <span className="flex flex-wrap gap-2">{platformsRow}</span>
        </span>
      </span>

      <ChevronRight
        size={22}
        aria-hidden
        className={cn("shrink-0 transition-transform group-hover:translate-x-0.5", selected ? "text-[#4a78ec]" : "text-navy")}
      />
    </button>
  );
}
