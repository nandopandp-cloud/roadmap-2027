"use client";

import { CircleDashed, Flag, GitFork, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { PageContainer, PageTitle, TopBar } from "@/components/layout/page-header";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { PriorityBadge, StatusBadge, TransversalBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/fields";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { isTransversal, sortInitiatives } from "@/lib/client/filtering";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { QUARTERS } from "@/lib/domain/constants";
import { QUARTER_LABEL, QUARTER_MONTHS } from "@/lib/domain/labels";
import type { Initiative, Milestone, Platform, Quarter } from "@/lib/domain/types";

function PlatformDots({ ids, platforms }: { ids: string[]; platforms: Platform[] }) {
  const list = ids.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  if (!list.length) return <span className="text-[12px] font-semibold text-subtle">Plataformas a definir</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {list.map((p) => {
        const Glyph = PLATFORM_GLYPHS[p.icon];
        const tone = ACCENT_TONE[p.accent];
        return (
          <span key={p.id} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: tone.soft, color: tone.fg }}>
            <Glyph size={12} aria-hidden />
            {p.name}
          </span>
        );
      })}
    </span>
  );
}

function RoadmapCard({
  initiative: i,
  platforms,
  milestones,
  blockedBy,
  selected,
  onOpen,
}: {
  initiative: Initiative;
  platforms: Platform[];
  milestones: Milestone[];
  blockedBy: Initiative[];
  selected: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      className={cn(
        "flex w-full flex-col gap-2.5 rounded-2xl border bg-surface p-4 text-left transition-all",
        selected ? "border-[#3f6fe6] shadow-[0_0_0_1px_#3f6fe6]" : "border-line shadow-[var(--shadow-card)] hover:-translate-y-px hover:border-line-strong",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-extrabold tracking-wide text-subtle">{i.id}</span>
        {isTransversal(i) && <TransversalBadge size="sm" />}
      </span>
      <span className="text-[15.5px] font-extrabold leading-snug text-navy">{i.title}</span>
      <span className="flex flex-wrap gap-1.5">
        <StatusBadge status={i.status} size="sm" />
        <PriorityBadge priority={i.priority} size="sm" />
      </span>
      <PlatformDots ids={i.platformIds} platforms={platforms} />
      {milestones.length > 0 && (
        <span className="flex flex-col gap-1 border-t border-line pt-2">
          {milestones.map((m) => (
            <span key={m.id} className="flex items-center gap-1.5 text-[12.5px] text-muted">
              <Flag size={12} className="shrink-0 text-teal" aria-hidden />
              <span className={cn(m.done && "line-through")}>{m.title}</span>
            </span>
          ))}
        </span>
      )}
      {blockedBy.length > 0 && (
        <span className="flex items-start gap-1.5 rounded-lg bg-[#fff6e5] px-2 py-1.5 text-[12px] font-semibold text-[#7a4b00]">
          <GitFork size={13} className="mt-0.5 shrink-0" aria-hidden />
          Depende de {blockedBy.map((b) => b.id).join(", ")}
        </span>
      )}
      {!i.planningValidated && <span className="text-[11.5px] font-semibold text-subtle">Planejamento a validar</span>}
    </button>
  );
}

/** Marco de uma iniciativa em outro quarter — mesmo registro, sem duplicar a iniciativa. */
function MilestoneCard({ initiative, milestone, onOpen }: { initiative: Initiative; milestone: Milestone; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-2xl border border-dashed border-[#b9c6e4] bg-[#f8faff] p-3 text-left transition-colors hover:border-violet hover:bg-surface"
    >
      <Flag size={16} className="mt-0.5 shrink-0 text-teal" aria-hidden />
      <span className="min-w-0">
        <span className={cn("block text-[13.5px] font-bold text-ink", milestone.done && "line-through")}>{milestone.title}</span>
        <span className="block text-[12px] text-muted">
          Marco de {initiative.id} · {initiative.title}
        </span>
      </span>
    </button>
  );
}

export function RoadmapView() {
  const { load, data, reload, openForm } = useRoadmap();
  const { selectedId, open } = useInitiativeSelection();
  const [platform, setPlatform] = useState("todas");
  const [showMilestones, setShowMilestones] = useState(true);

  const visible = useMemo(
    () => sortInitiatives(data.initiatives.filter((i) => platform === "todas" || i.platformIds.includes(platform)), "prioridade"),
    [data.initiatives, platform],
  );
  const byId = (id: string) => data.initiatives.find((i) => i.id === id);

  const columns = QUARTERS.map((q) => {
    const main = visible.filter((i) => i.quarter === q);
    const markers = showMilestones
      ? visible.flatMap((i) => i.milestones.filter((m) => m.quarter === q && i.quarter !== q).map((m) => ({ initiative: i, milestone: m })))
      : [];
    return { q, main, markers };
  });
  const unscheduled = visible.filter((i) => !i.quarter);

  const renderCard = (i: Initiative, q: Quarter | null) => (
    <li key={i.id}>
      <RoadmapCard
        initiative={i}
        platforms={data.platforms}
        milestones={showMilestones && q ? i.milestones.filter((m) => m.quarter === q) : []}
        blockedBy={i.dependsOn.map(byId).filter((x): x is Initiative => !!x)}
        selected={selectedId === i.id}
        onOpen={() => open(i.id, "roadmap")}
      />
    </li>
  );

  return (
    <PageContainer>
      <TopBar crumbs={[{ label: "Roadmap" }]} />
      <PageTitle
        title="Roadmap 2027"
        subtitle="Como as iniciativas se distribuem ao longo do ano. Quarters e prioridades são propostas até serem validados."
        actions={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => openForm(null, 3)}>
            Nova iniciativa
          </Button>
        }
      />

      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-[14px] font-semibold text-muted">
          Plataforma
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-[14px] font-semibold text-ink focus:border-violet focus:outline-none"
          >
            <option value="todas">Todas</option>
            {data.platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <Checkbox label="Mostrar marcos" checked={showMilestones} onChange={setShowMilestones} />
        <p className="flex items-center gap-4 text-[12.5px] text-muted">
          <span className="flex items-center gap-1.5">
            <Flag size={13} className="text-teal" aria-hidden /> Marco
          </span>
          <span className="flex items-center gap-1.5">
            <GitFork size={13} className="text-[#b36b00]" aria-hidden /> Dependência
          </span>
        </p>
      </div>

      {load.status === "error" && (
        <div className="mt-6">
          <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
        </div>
      )}

      <div className="@container mt-6">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {columns.map(({ q, main, markers }) => (
            <section key={q} aria-labelledby={`col-${q}`} className="flex flex-col rounded-3xl border border-line bg-[#eef2fa] p-3">
              <header className="flex items-baseline justify-between gap-2 px-2 pb-3 pt-1">
                <div>
                  <h2 id={`col-${q}`} className="text-[18px] font-black text-navy">
                    {q}
                  </h2>
                  <p className="text-[12.5px] font-semibold text-muted">{QUARTER_MONTHS[q]}</p>
                </div>
                <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-brand">
                  {plural(main.length, "iniciativa", "iniciativas")}
                </span>
              </header>
              {load.status === "loading" ? (
                <div className="flex flex-col gap-3">
                  <Skeleton className="h-40" />
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {main.map((i) => renderCard(i, q))}
                  {markers.map(({ initiative, milestone }) => (
                    <li key={`${initiative.id}-${milestone.id}`}>
                      <MilestoneCard initiative={initiative} milestone={milestone} onOpen={() => open(initiative.id, "roadmap")} />
                    </li>
                  ))}
                  {main.length === 0 && markers.length === 0 && (
                    <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                      <CircleDashed size={20} aria-hidden />
                      Nenhuma iniciativa em {QUARTER_LABEL[q]}.
                    </li>
                  )}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>

      {load.status === "ready" && unscheduled.length > 0 && (
        <section aria-labelledby="sem-quarter" className="mt-8">
          <h2 id="sem-quarter" className="text-[18px] font-black text-navy">
            Sem quarter definido
          </h2>
          <p className="text-[13px] text-muted">Iniciativas ainda não posicionadas no ano.</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{unscheduled.map((i) => renderCard(i, null))}</ul>
        </section>
      )}

      {load.status === "ready" && data.initiatives.length === 0 && (
        <EmptyState
          className="mt-8"
          title="Nenhuma iniciativa no roadmap"
          description="Cadastre iniciativas para vê-las distribuídas nos quarters."
          action={<Button variant="primary" onClick={() => openForm(null)}>Nova iniciativa</Button>}
        />
      )}
    </PageContainer>
  );
}
