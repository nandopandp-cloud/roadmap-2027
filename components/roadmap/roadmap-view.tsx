"use client";

import { ChartGantt, Flag, GitFork, GripVertical, LayoutGrid, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { RoadmapGantt } from "@/components/roadmap/roadmap-gantt";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/fields";
import { EmptyState, ErrorBanner } from "@/components/ui/feedback";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { compareRoadmapOrder } from "@/lib/domain/roadmap-order";

const VIEWS = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "gantt", label: "Gantt", icon: ChartGantt },
] as const;
type View = (typeof VIEWS)[number]["key"];

/** Visão escolhida fica na URL (?visao=gantt), preservando os parâmetros do drawer. */
function useRoadmapView() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const view: View = params.get("visao") === "gantt" ? "gantt" : "cards";
  const setView = (next: View) => {
    const query = new URLSearchParams(params.toString());
    if (next === "cards") query.delete("visao");
    else query.set("visao", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return { view, setView };
}

export function RoadmapView() {
  const { load, data, reload, openForm } = useRoadmap();
  const { selectedId, open } = useInitiativeSelection();
  const { view, setView } = useRoadmapView();
  const [platform, setPlatform] = useState("todas");
  const [showMilestones, setShowMilestones] = useState(true);

  const visible = useMemo(
    () => data.initiatives.filter((i) => platform === "todas" || i.platformIds.includes(platform)).sort(compareRoadmapOrder),
    [data.initiatives, platform],
  );
  const loading = load.status === "loading";
  const openInitiative = (id: string) => open(id, "roadmap");

  const onViewKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const next = VIEWS[(VIEWS.findIndex((v) => v.key === view) + 1) % VIEWS.length].key;
    setView(next);
    document.getElementById(`roadmap-view-${next}`)?.focus();
  };

  return (
    <>
      <PageHero
        crumbs={[{ label: "Roadmap" }]}
        title="Roadmap 2027"
        subtitle="Como as iniciativas se distribuem ao longo do ano. Quarters e prioridades são propostas até serem validados."
      >
        <div className="mt-8">
          <Button variant="primary" className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]" icon={<Plus size={19} />} onClick={() => openForm(null, 3)}>
            Nova iniciativa
          </Button>
        </div>
      </PageHero>
      <PageContainer className="pb-16 pt-6">
      <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div role="tablist" aria-label="Visualização do roadmap" className="flex rounded-xl border border-line bg-surface p-1">
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`roadmap-view-${key}`}
              role="tab"
              type="button"
              aria-selected={view === key}
              aria-controls="roadmap-panel"
              tabIndex={view === key ? 0 : -1}
              onClick={() => setView(key)}
              onKeyDown={onViewKey}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-bold transition-colors",
                view === key ? "bg-brand-soft text-brand" : "text-muted hover:text-ink",
              )}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </div>
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
        {view === "cards" ? (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <Flag size={13} className="text-teal" aria-hidden /> Marco
            </span>
            <span className="flex items-center gap-1.5">
              <GitFork size={13} className="text-[#b36b00]" aria-hidden /> Dependência
            </span>
            {data.writable && (
              <span className="flex items-center gap-1.5">
                <GripVertical size={13} aria-hidden /> Arraste os cards para mudar quarter e ordem
              </span>
            )}
          </p>
        ) : (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-5 rounded-[3px] border border-[#6045D8] bg-[#F1ECFB]" /> Quarter planejado
            </span>
            {showMilestones && (
              <>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 rotate-45 rounded-[2px] border-2 border-teal bg-teal" /> Marco concluído
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 rotate-45 rounded-[2px] border-2 border-teal bg-surface" /> Marco pendente
                </span>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="h-2.5 w-2.5 rotate-45 rounded-[2px] border-2 border-dashed border-teal bg-surface" /> Sem data
                  (posição aproximada no quarter)
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {load.status === "error" && (
        <div className="mt-6">
          <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
        </div>
      )}

      <div id="roadmap-panel" role="tabpanel" aria-labelledby={`roadmap-view-${view}`}>
        {view === "cards" ? (
          <RoadmapBoard visible={visible} showMilestones={showMilestones} loading={loading} selectedId={selectedId} onOpen={openInitiative} />
        ) : (
          <RoadmapGantt visible={visible} showMilestones={showMilestones} loading={loading} selectedId={selectedId} onOpen={openInitiative} />
        )}
      </div>

      {load.status === "ready" && data.initiatives.length === 0 && (
        <EmptyState
          className="mt-8"
          title="Nenhuma iniciativa no roadmap"
          description="Cadastre iniciativas para vê-las distribuídas nos quarters."
          action={<Button variant="primary" onClick={() => openForm(null)}>Nova iniciativa</Button>}
        />
      )}
    </PageContainer>
    </>
  );
}
