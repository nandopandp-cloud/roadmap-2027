"use client";

import { MultiSelect } from "@/components/ui/multi-select";
import { Select } from "@/components/ui/select";
import { ChartGantt, Flag, GitFork, GripVertical, LayoutGrid, Maximize2, Minimize2, Plus, Timer } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { RoadmapBoard } from "@/components/roadmap/roadmap-board";
import { EffortDialog } from "@/components/roadmap/effort-dialog";
import { RoadmapGantt } from "@/components/roadmap/roadmap-gantt";
import { LateMenu2026, Owners2026Context, Roadmap2026Board, Roadmap2026Gantt, Roadmap2026Legend, TrackToggle } from "@/components/roadmap/roadmap-2026";
import { Item2026Dialog } from "@/components/roadmap/roadmap-2026-dialog";
import { YearSwitch } from "@/components/roadmap/year-switch";
import { EFFORT_TONE } from "@/lib/client/tones";
import { Button } from "@/components/ui/button";
import { useFocusTrap } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/fields";
import { EmptyState, ErrorBanner } from "@/components/ui/feedback";
import { cn } from "@/lib/client/cn";
import { useCanPlan2026, useRoadmap2026 } from "@/lib/client/roadmap-2026";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useCanEdit, useEffortTracks, useEvidenceTracks, useRoadmap } from "@/lib/client/store";
import {
  activeTracks,
  effectiveStatus,
  OWNER_TRACK_LABEL,
  platformKey2026,
  STATUS_2026_LABEL,
  TRACK_STATUS_LABEL,
  TRACK_STATUS_TRACKS,
  TRACK_STATUSES_2026,
  TRANSVERSAL_2026,
  type Status2026,
  type TrackStatus2026,
  type TrackStatusTrack,
} from "@/lib/domain/roadmap-2026";
import { compareRoadmapOrder } from "@/lib/domain/roadmap-order";
import type { Roadmap2026Item, RoadmapYear } from "@/lib/domain/types";

/** Preferência "Expandir todos" do Roadmap 2026 (por navegador). */
const TRACKS_KEY = "jg-roadmap:2026-frentes";

/** Status que o filtro do 2026 oferece (os que o cálculo produz). */
const STATUS_FILTER_2026 = ["planejada", "andamento", "atrasada", "concluida"] as const;

const VIEWS = [
  { key: "cards", label: "Cards", icon: LayoutGrid },
  { key: "gantt", label: "Gantt", icon: ChartGantt },
] as const;
type View = (typeof VIEWS)[number]["key"];

/**
 * Visão (?visao=gantt) e ano (?ano=2026) ficam na URL, preservando os parâmetros do drawer.
 * Sem parâmetro: Cards do Roadmap 2027.
 */
function useRoadmapView() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const view: View = params.get("visao") === "gantt" ? "gantt" : "cards";
  const year: RoadmapYear = params.get("ano") === "2026" ? 2026 : 2027;
  const replace = (mutate: (query: URLSearchParams) => void) => {
    const query = new URLSearchParams(params.toString());
    mutate(query);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  const setView = (next: View) => replace((q) => (next === "cards" ? q.delete("visao") : q.set("visao", next)));
  const setYear = (next: RoadmapYear) => replace((q) => (next === 2027 ? q.delete("ano") : q.set("ano", String(next))));
  return { view, setView, year, setYear };
}

export function RoadmapView() {
  const { load, data, reload, openForm } = useRoadmap();
  const canEdit = useCanEdit();
  const effortTracks = useEffortTracks();
  const attachTracks = useEvidenceTracks();
  const { selectedId, open } = useInitiativeSelection();
  const { view, setView, year, setYear } = useRoadmapView();
  const is2026 = year === 2026;
  const { load: load2026, retry: retry2026, update: update2026, remove: remove2026, move: move2026 } = useRoadmap2026(is2026);
  const roadmap2026 = load2026.status === "ready" ? load2026.data : null;
  const items2026 = roadmap2026?.items ?? null;
  // Roadmap 2026: Head de Produto, Head de Engenharia, tech leads e coordenação de design.
  const canPlan2026 = useCanPlan2026();
  const notify = useToast();
  const [editing2026, setEditing2026] = useState<string | null>(null);
  // Iniciativa destacada depois de escolhida na lista de atrasadas (rola até ela).
  const [highlight2026, setHighlight2026] = useState<string | null>(null);
  const goTo2026 = (id: string) => {
    // A iniciativa precisa estar visível: um filtro de status que a esconda volta para "Todos".
    const item = items2026?.find((i) => i.id === id);
    if (item && status2026.length && !status2026.includes(effectiveStatus(item))) setStatus2026([]);
    setHighlight2026(id);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => document.querySelector(`[data-item-2026="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })),
    );
  };
  useEffect(() => {
    if (!highlight2026) return;
    const timer = setTimeout(() => setHighlight2026(null), 2600);
    return () => clearTimeout(timer);
  }, [highlight2026]);
  const editingItem2026 = editing2026 ? items2026?.find((i) => i.id === editing2026) : undefined;

  /** Salva no servidor; em caso de erro a tela volta ao estado anterior e avisa. */
  const save2026 = async (id: string, patch: Partial<Roadmap2026Item>, success?: string) => {
    try {
      await update2026(id, patch);
      if (success) notify("success", success);
      return true;
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar a alteração.");
      return false;
    }
  };
  const change2026 = (item: Roadmap2026Item) => void save2026(item.id, { segments: item.segments });
  // Responsáveis de cada iniciativa (colaboradores de Times & Squads), para os avatares.
  // Responsáveis e andamento por frente de cada iniciativa, para os avatares e as pílulas.
  // "Expandir todos" do 2026: preferência de cada pessoa neste navegador (começa recolhido).
  const [showTracks, setShowTracks] = useState(false);
  useEffect(() => {
    try {
      setShowTracks(localStorage.getItem(TRACKS_KEY) === "1");
    } catch {
      // Sem acesso ao armazenamento: fica recolhido.
    }
  }, []);
  const toggleTracks = (next: boolean) => {
    setShowTracks(next);
    try {
      localStorage.setItem(TRACKS_KEY, next ? "1" : "0");
    } catch {
      // Preferência não lembrada; a tela funciona igual.
    }
  };
  const owners2026 = useMemo(
    () => ({
      ownersOf: (item: Roadmap2026Item) => item.owners,
      trackStatusOf: (item: Roadmap2026Item) => item.trackStatus,
      people: data.people,
      showTracks,
      highlightId: highlight2026,
    }),
    [data.people, showTracks, highlight2026],
  );
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

  const loading = load.status === "loading";

  // Roadmap 2026: filtro pelas plataformas presentes na planilha e "Transversais" (sem plataforma).
  const platformOptions = useMemo(() => {
    if (!is2026) return data.platforms.map((p) => ({ value: p.id, label: p.name }));
    const keys = new Set((items2026 ?? []).map(platformKey2026));
    return [
      ...data.platforms.filter((p) => keys.has(p.id)).map((p) => ({ value: p.id, label: p.name })),
      ...(keys.has(TRANSVERSAL_2026) ? [{ value: TRANSVERSAL_2026, label: "Transversais" }] : []),
    ];
  }, [is2026, data.platforms, items2026]);
  // Plataforma escolhida em um ano que não existe no outro volta para "Todas".
  const platformFilter = platformOptions.some((o) => o.value === platform) ? platform : "todas";
  // Roadmap 2026: filtro por plataforma e, em seguida, por status (calculado).
  const byPlatform2026 = useMemo(
    () => (items2026 ?? []).filter((i) => platformFilter === "todas" || platformKey2026(i) === platformFilter),
    [items2026, platformFilter],
  );
  // Status escolhidos no filtro (vazio = todos).
  const [status2026, setStatus2026] = useState<Status2026[]>([]);
  // Áreas (Design, Engenharia, QA) e o andamento delas; vazio = todas.
  const [area2026, setArea2026] = useState<TrackStatusTrack[]>([]);
  const [areaStatus2026, setAreaStatus2026] = useState<TrackStatus2026[]>([]);
  /** A iniciativa tem a área (não retirada) e, se pedido, o andamento escolhido em alguma das áreas consideradas. */
  const matchesArea = (i: Roadmap2026Item, areas: TrackStatusTrack[], statuses: TrackStatus2026[]) => {
    const active = activeTracks(i);
    const considered = (areas.length ? areas : TRACK_STATUS_TRACKS).filter((t) => active.includes(t));
    if (areas.length && !considered.length) return false;
    return !statuses.length || considered.some((t) => statuses.includes(i.trackStatus[t]));
  };
  const matchesStatus = (i: Roadmap2026Item, statuses: Status2026[]) => !statuses.length || statuses.includes(effectiveStatus(i));
  // Contagem de cada opção considerando os demais filtros.
  const statusCounts2026 = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const i of byPlatform2026.filter((x) => matchesArea(x, area2026, areaStatus2026))) counts[effectiveStatus(i)] = (counts[effectiveStatus(i)] ?? 0) + 1;
    return counts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byPlatform2026, area2026, areaStatus2026]);
  const areaCounts2026 = useMemo(() => {
    const base = byPlatform2026.filter((x) => matchesStatus(x, status2026));
    return Object.fromEntries(TRACK_STATUS_TRACKS.map((t) => [t, base.filter((x) => matchesArea(x, [t], areaStatus2026)).length]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byPlatform2026, status2026, areaStatus2026]);
  const areaStatusCounts2026 = useMemo(() => {
    const base = byPlatform2026.filter((x) => matchesStatus(x, status2026));
    return Object.fromEntries(TRACK_STATUSES_2026.map((st) => [st, base.filter((x) => matchesArea(x, area2026, [st])).length]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [byPlatform2026, status2026, area2026]);
  const visible2026 = useMemo(
    () => byPlatform2026.filter((i) => matchesStatus(i, status2026) && matchesArea(i, area2026, areaStatus2026)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [byPlatform2026, status2026, area2026, areaStatus2026],
  );
  const loading2026 = !items2026;
  // Barra no mesmo padrão nos dois anos (rótulos acima dos campos, botões de 48px).
  const styled = true;
  const ready = is2026 ? !!roadmap2026 && roadmap2026.items.length > 0 : load.status === "ready" && data.initiatives.length > 0;
  const title = `Roadmap ${year}`;
  const visible = useMemo(
    () => data.initiatives.filter((i) => platformFilter === "todas" || i.platformIds.includes(platformFilter)).sort(compareRoadmapOrder),
    [data.initiatives, platformFilter],
  );
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
      <div
        role="tablist"
        aria-label="Visualização do roadmap"
        className={cn("flex rounded-xl border border-line bg-surface p-1", styled && "h-12 items-center shadow-[0_1px_3px_rgba(23,27,77,0.04)]")}
      >
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
              "inline-flex items-center gap-1.5 rounded-lg font-bold transition-colors",
              styled ? "h-10 px-3.5 text-[14.5px]" : "h-8 px-3 text-[13.5px]",
              view === key ? "bg-brand-soft text-brand" : "text-muted hover:text-ink",
            )}
          >
            <Icon size={15} aria-hidden />
            {label}
          </button>
        ))}
      </div>
      {styled && <span aria-hidden className="hidden h-8 w-px self-end bg-line-strong sm:mb-2 sm:block" />}
      <div className={cn("flex text-[14px] font-semibold text-muted", styled ? "flex-col gap-1.5" : "items-center gap-2")}>
        <span aria-hidden className={cn(styled && "text-[13px]")}>Plataforma</span>
        <Select
          value={platformFilter}
          onChange={setPlatform}
          aria-label="Plataforma"
          className={cn(
            "rounded-xl border border-line bg-surface px-3 text-[14px] font-semibold text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12",
            styled ? "h-12 min-w-[190px] px-4 text-[15px] shadow-[0_1px_3px_rgba(23,27,77,0.04)]" : "h-10 min-w-[180px]",
          )}
        >
          <option value="todas">Todas</option>
          {platformOptions.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      {is2026 && (
        <div className="flex flex-col gap-1.5 text-[14px] font-semibold text-muted">
          <span aria-hidden className="text-[13px]">Status da iniciativa</span>
          <MultiSelect
            tall
            className="w-[230px]"
            label="Status da iniciativa"
            value={status2026}
            onChange={(v) => setStatus2026(v as Status2026[])}
            allCount={Object.values(statusCounts2026).reduce((a, b) => a + b, 0)}
            options={STATUS_FILTER_2026.map((st) => ({ value: st, label: STATUS_2026_LABEL[st], count: statusCounts2026[st] ?? 0 }))}
          />
        </div>
      )}
      {is2026 && (
        <div className="flex flex-col gap-1.5 text-[14px] font-semibold text-muted">
          <span aria-hidden className="text-[13px]">Área</span>
          <MultiSelect
            tall
            className="w-[210px]"
            label="Área"
            allLabel="Todas"
            value={area2026}
            onChange={(v) => setArea2026(v as TrackStatusTrack[])}
            options={TRACK_STATUS_TRACKS.map((t) => ({ value: t, label: OWNER_TRACK_LABEL[t], count: areaCounts2026[t] ?? 0 }))}
          />
        </div>
      )}
      {is2026 && (
        <div className="flex flex-col gap-1.5 text-[14px] font-semibold text-muted">
          <span aria-hidden className="text-[13px]">Status da área</span>
          <MultiSelect
            tall
            className="w-[230px]"
            label="Status da área"
            value={areaStatus2026}
            onChange={(v) => setAreaStatus2026(v as TrackStatus2026[])}
            options={TRACK_STATUSES_2026.map((st) => ({ value: st, label: TRACK_STATUS_LABEL[st], count: areaStatusCounts2026[st] ?? 0 }))}
          />
        </div>
      )}
    </>
  );

  /** Ações do 2026 (frentes e atrasadas), alinhadas com a tela cheia. */
  /** Liga/desliga no padrão dos botões do 2026 (Marcos e Esforço do 2027). */
  const toggle = (label: string, on: boolean, set: (v: boolean) => void, Icon: typeof Flag, title: string) => (
    <Button
      className={cn("h-12 rounded-xl px-4 text-[14.5px]", on && "border-violet bg-brand-soft text-brand hover:border-violet hover:bg-brand-soft")}
      icon={<Icon size={16} />}
      aria-pressed={on}
      title={title}
      onClick={() => set(!on)}
    >
      {label}
    </Button>
  );
  const actions2027 = !is2026 && (
    <>
      {toggle("Marcos", showMilestones, setShowMilestones, Flag, "Mostrar ou ocultar os marcos")}
      {view === "gantt" && toggle("Esforço", showEffort, setShowEffort, Timer, "Mostrar ou ocultar o esforço estimado de Design e Engenharia")}
    </>
  );

  const actions2026 = is2026 && (
    <>
      <TrackToggle expanded={showTracks} onChange={toggleTracks} />
      {items2026 && <LateMenu2026 items={byPlatform2026} platforms={data.platforms} onSelect={goTo2026} onShowOnly={() => setStatus2026(["atrasada"])} />}
    </>
  );

  const legend = is2026 ? (
    <div className={cn("rounded-2xl border border-line bg-white/70 px-4 py-2.5 text-[13.5px] text-muted", fullscreen && "py-2 text-[12.5px]")}>
      <p className="flex flex-wrap items-center gap-x-6 gap-y-1">
        {view === "cards" ? (
          <span>Cada card fica no trimestre em que termina a última semana projetada na planilha.</span>
        ) : (
          <Roadmap2026Legend />
        )}
      </p>
    </div>
  ) : view === "cards" ? (
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
      {is2026 ? (
        view === "cards" ? (
          <Roadmap2026Board items={visible2026} platforms={data.platforms} loading={loading2026} canEdit={canPlan2026} onEdit={setEditing2026} />
        ) : (
          <Roadmap2026Gantt
            items={visible2026}
            platforms={data.platforms}
            loading={loading2026}
            canEdit={canPlan2026}
            onEdit={setEditing2026}
            onChange={change2026}
            onMove={(id, beforeId, afterId) =>
              void move2026(id, beforeId, afterId).catch((error) =>
                notify("error", error instanceof ApiError ? error.message : "Não foi possível mudar a ordem."),
              )
            }
            fill={fullscreen}
          />
        )
      ) : view === "cards" ? (
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
    <Owners2026Context.Provider value={owners2026}>
      <PageHero
        crumbs={[{ label: "Roadmap" }]}
        title={title}
        subtitle={
          is2026
            ? "Julho de 2026 a abril de 2027: status e semanas de design e engenharia de cada iniciativa, por squad."
            : "Como as iniciativas se distribuem ao longo do ano. Quarters e prioridades são propostas até serem validados."
        }
      >
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
          <YearSwitch year={year} onChange={setYear} />
          {canEdit && !is2026 && (
            <Button
              variant="primary"
              className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]"
              icon={<Plus size={19} />}
              onClick={() => openForm(null, 3)}
            >
              Nova iniciativa
            </Button>
          )}
        </div>
      </PageHero>
      <PageContainer className="pb-16 pt-6">
      {!fullscreen && (
        <>
          {(() => {
            const fullscreenButton = (
              <Button
                ref={fullscreenButtonRef}
                className={cn(styled ? "h-12 rounded-xl px-4 text-[14.5px]" : "h-10")}
                icon={<Maximize2 size={15} />}
                disabled={!ready}
                title="Ver o roadmap ocupando a tela inteira"
                onClick={() => setFullscreen(true)}
              >
                Tela cheia
              </Button>
            );
            return is2026 ? (
              <>
                {/* 2026: filtros numa linha; legenda e ações na seguinte. */}
                <div className="mt-7 flex flex-wrap items-end gap-x-4 gap-y-3">{controls}</div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">{legend}</div>
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {actions2026}
                    {fullscreenButton}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={cn("mt-7 flex flex-wrap gap-y-3", styled ? "items-end gap-x-4" : "items-center gap-x-6")}>
                  {controls}
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {actions2027}
                    {fullscreenButton}
                  </div>
                </div>
                <div className="mt-4">
                  <div className="rounded-2xl border border-line bg-white/70 px-4 py-2.5">{legend}</div>
                </div>
              </>
            );
          })()}
        {!is2026 && load.status === "error" && (
          <div className="mt-6">
            <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
          </div>
        )}
        {is2026 && load2026.status === "error" && (
          <div className="mt-6">
            <ErrorBanner message={load2026.message} action={<Button size="sm" onClick={() => void retry2026()}>Tentar novamente</Button>} />
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
                <h2 className="text-[16px] font-black text-navy">{title}</h2>
                <YearSwitch year={year} onChange={setYear} compact />
                {controls}
                {(actions2026 || actions2027) && <div className="flex items-center gap-2">{actions2026 || actions2027}</div>}
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

      {editingItem2026 && (
        <Item2026Dialog
          key={editingItem2026.id}
          item={editingItem2026}
          platforms={data.platforms}
          owners={editingItem2026.owners}
          trackStatuses={editingItem2026.trackStatus}
          people={data.people}
          squads={data.squads}
          onClose={() => setEditing2026(null)}
          onSave={async (item, owners, trackStatus) => {
            const { title, subtitle, platformId, backlog, status, segments, skippedTracks } = item;
            const ok = await save2026(item.id, { title, subtitle, platformId, owners, trackStatus, skippedTracks, backlog, status, segments }, "Alterações salvas.");
            if (ok) setEditing2026(null);
            return ok;
          }}
          onRemove={async (id) => {
            try {
              await remove2026(id);
              setEditing2026(null);
              notify("success", "Iniciativa removida do Roadmap 2026.");
              return true;
            } catch (error) {
              notify("error", error instanceof ApiError ? error.message : "Não foi possível remover a iniciativa.");
              return false;
            }
          }}
        />
      )}

      {effortInitiative && (
        <EffortDialog key={effortInitiative.id} initiative={effortInitiative} onClose={() => setEditingEffort(null)} />
      )}

      {is2026 && roadmap2026 && roadmap2026.items.length === 0 && (
        <EmptyState className="mt-8" title="Roadmap 2026 vazio" description="Não há iniciativas no Roadmap 2026." />
      )}

      {!is2026 && load.status === "ready" && data.initiatives.length === 0 && (
        <EmptyState
          className="mt-8"
          title="Nenhuma iniciativa no roadmap"
          description={canEdit ? "Cadastre iniciativas para vê-las distribuídas nos quarters." : "Ainda não há iniciativas distribuídas nos quarters."}
          action={canEdit && <Button variant="primary" onClick={() => openForm(null)}>Nova iniciativa</Button>}
        />
      )}
    </PageContainer>
    </Owners2026Context.Provider>
  );
}
