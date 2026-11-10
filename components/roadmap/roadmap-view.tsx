"use client";

import { Select } from "@/components/ui/select";
import { ChartGantt, Flag, GitFork, GripVertical, LayoutGrid, Maximize2, Minimize2, Plus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { EffortDialog } from "@/components/roadmap/effort-dialog";
import { RoadmapGantt } from "@/components/roadmap/roadmap-gantt";
import { EFFORT_TONE } from "@/lib/client/tones";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/fields";
import { EmptyState, ErrorBanner } from "@/components/ui/feedback";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useCanEdit, useEffortTracks, useEvidenceTracks, useRoadmap } from "@/lib/client/store";
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
  const canEdit = useCanEdit();
  const effortTracks = useEffortTracks();
  const attachTracks = useEvidenceTracks();
  const { selectedId, open } = useInitiativeSelection();
  const { view, setView } = useRoadmapView();
  const [platform, setPlatform] = useState("todas");
  const [showMilestones, setShowMilestones] = useState(true);
  const [showEffort, setShowEffort] = useState(true);
  const [editingEffort, setEditingEffort] = useState<string | null>(null);
  const effortInitiative = editingEffort ? data.initiatives.find((i) => i.id === editingEffort) : undefined;
  const [fullscreen, setFullscreen] = useState(false);
  const fullscreenButtonRef = useRef<HTMLButtonElement>(null);
  const exitFullscreen = () => {
    setFullscreen(false);
    // O botão volta a existir só depois da renderização; devolve o foco a ele.
    requestAnimationFrame(() => fullscreenButtonRef.current?.focus({ preventScroll: true }));
  };
  // Esc sai da tela cheia (drawer e diálogos abertos por cima fecham primeiro).
  const fullscreenRef = useFocusTrap(fullscreen, exitFullscreen);

  // A página por trás não rola enquanto a tela cheia está aberta.
  useEffect(() => {
    if (!fullscreen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [fullscreen]);

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

  const controls = (
    <>
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
      <div className="flex items-center gap-2 text-[14px] font-semibold text-muted">
        <span aria-hidden>Plataforma</span>
        <Select
          value={platform}
          onChange={setPlatform}
          aria-label="Plataforma"
          className="h-10 min-w-[180px] rounded-xl border border-line bg-surface px-3 text-[14px] font-semibold text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12"
        >
          <option value="todas">Todas</option>
          {data.platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <Checkbox label="Mostrar marcos" checked={showMilestones} onChange={setShowMilestones} />
      {view === "gantt" && <Checkbox label="Mostrar esforço" checked={showEffort} onChange={setShowEffort} />}
    </>
  );

  const legend =
    view === "cards" ? (
      <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted", fullscreen && "text-[12px]")}>
        <span className="flex items-center gap-1.5">
          <Flag size={13} className="text-teal" aria-hidden /> Marco
        </span>
        <span className="flex items-center gap-1.5">
          <GitFork size={13} className="text-[#b36b00]" aria-hidden /> Dependência
        </span>
        {canEdit && (
          <span className="flex items-center gap-1.5">
            <GripVertical size={13} aria-hidden /> Arraste os cards para mudar quarter e ordem
          </span>
        )}
      </p>
    ) : (
      <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted", fullscreen && "text-[12px]")}>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-5 rounded-[3px] border border-[#6045D8] bg-[#F1ECFB]" /> Quarter planejado
        </span>
        {showEffort && (
          <>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-5 rounded-[3px]" style={{ background: EFFORT_TONE.design.solid }} /> Design (semanas)
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-2.5 w-5 rounded-[3px]" style={{ background: EFFORT_TONE.engineering.solid }} /> Engenharia (semanas)
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-3 w-0 border-l-2 border-dashed border-[#e08a1e]" /> Ultrapassa o quarter
            </span>
          </>
        )}
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
    );

  const panel = (
    <div
      id="roadmap-panel"
      role="tabpanel"
      aria-labelledby={`roadmap-view-${view}`}
      className={cn(fullscreen && (view === "gantt" ? "flex min-h-0 flex-1 flex-col" : "min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6 [scrollbar-width:thin]"))}
    >
      {view === "cards" ? (
        <RoadmapBoard visible={visible} showMilestones={showMilestones} loading={loading} selectedId={selectedId} onOpen={openInitiative} />
      ) : (
        <RoadmapGantt
          visible={visible}
          showMilestones={showMilestones}
          showEffort={showEffort}
          effortTracks={effortTracks}
          attachTracks={attachTracks}
          loading={loading}
          selectedId={selectedId}
          onOpen={openInitiative}
          onEditEffort={setEditingEffort}
          fill={fullscreen}
        />
      )}
    </div>
  );

  return (
    <>
      <PageHero
        crumbs={[{ label: "Roadmap" }]}
        title="Roadmap 2027"
        subtitle="Como as iniciativas se distribuem ao longo do ano. Quarters e prioridades são propostas até serem validados."
      >
        {canEdit && (
          <div className="mt-8">
            <Button
              variant="primary"
              className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]"
              icon={<Plus size={19} />}
              onClick={() => openForm(null, 3)}
            >
              Nova iniciativa
            </Button>
          </div>
        )}
      </PageHero>
      <PageContainer className="pb-16 pt-6">
      {!fullscreen && (
        <>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            {controls}
            <Button
              ref={fullscreenButtonRef}
              size="sm"
              className="ml-auto"
              icon={<Maximize2 size={15} />}
              disabled={load.status !== "ready" || data.initiatives.length === 0}
              title="Ver o roadmap ocupando a tela inteira"
              onClick={() => setFullscreen(true)}
            >
              Tela cheia
            </Button>
          </div>
          <div className="mt-3">{legend}</div>
        {load.status === "error" && (
          <div className="mt-6">
            <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
          </div>
        )}

          {panel}
        </>
      )}

      {fullscreen && (
        <div
          ref={fullscreenRef}
          data-layer
          role="dialog"
          aria-modal="true"
          aria-label="Roadmap em tela cheia"
          className="fixed inset-0 z-[35] flex animate-fade-in flex-col gap-3 bg-canvas px-3 pb-3 pt-3 sm:px-5 sm:pb-5"
        >
          <header className="flex flex-col gap-2.5 rounded-[20px] border border-line bg-surface px-4 py-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)]">
            <div className="flex items-start gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2.5">
                <h2 className="text-[16px] font-black text-navy">Roadmap 2027</h2>
                {controls}
              </div>
              <Button size="sm" variant="primary" className="mt-1.5 shrink-0" icon={<Minimize2 size={15} />} onClick={exitFullscreen} title="Sair da tela cheia (Esc)">
                Sair
              </Button>
            </div>
            {legend}
          </header>
          {panel}
        </div>
      )}

      {effortInitiative && (
        <EffortDialog key={effortInitiative.id} initiative={effortInitiative} onClose={() => setEditingEffort(null)} />
      )}

      {load.status === "ready" && data.initiatives.length === 0 && (
        <EmptyState
          className="mt-8"
          title="Nenhuma iniciativa no roadmap"
          description={canEdit ? "Cadastre iniciativas para vê-las distribuídas nos quarters." : "Ainda não há iniciativas distribuídas nos quarters."}
          action={canEdit && <Button variant="primary" onClick={() => openForm(null)}>Nova iniciativa</Button>}
        />
      )}
    </PageContainer>
    </>
  );
}
