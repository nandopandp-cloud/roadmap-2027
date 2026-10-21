"use client";

import { Boxes, Building2, Expand, LayoutList, Maximize2, Network, Plus, Search, Shrink, UserPlus, Users, Workflow, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { NO_SQUAD, OrgChart, OrgList, type OrgFilter } from "@/components/org/org-chart";
import { OrgActionsProvider, useOrgActions } from "@/components/org/org-actions";
import { OrgFullscreen } from "@/components/org/org-fullscreen";
import { AreasTab, PeopleTab, SquadsTab } from "@/components/org/org-tabs";
import { PersonPanel } from "@/components/org/person-panel";
import { Button, IconButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { FilterSelect } from "@/components/ui/filter-select";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { orderIn } from "@/lib/domain/org";
import type { Person, Squad } from "@/lib/domain/types";

const TABS = [
  { key: "organograma", label: "Organograma", icon: Network },
  { key: "squads", label: "Squads", icon: Boxes },
  { key: "colaboradores", label: "Colaboradores", icon: Users },
  { key: "areas", label: "Visão por áreas", icon: Building2 },
] as const;
type Tab = (typeof TABS)[number]["key"];

const normalize = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Aba escolhida fica na URL (?visao=squads), preservando os demais parâmetros. */
function useTab() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const raw = params.get("visao");
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : "organograma";
  const setTab = (next: Tab) => {
    const query = new URLSearchParams(params.toString());
    if (next === "organograma") query.delete("visao");
    else query.set("visao", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return { tab, setTab };
}

function OrgPage() {
  const { load, data, reload, saveSquad } = useRoadmap();
  const { canEdit, newPerson, newSquad } = useOrgActions();
  const notify = useToast();
  const confirm = useConfirm();
  const { tab, setTab } = useTab();
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("todas");
  const [squad, setSquad] = useState("todos");
  const [role, setRole] = useState("todos");
  const [expandAll, setExpandAll] = useState(false);
  const [mode, setMode] = useState<"organograma" | "lista">("organograma");
  const [creating, setCreating] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const areas = useMemo(() => [...new Set(data.people.map((p) => p.area).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [data.people]);
  const roles = useMemo(() => [...new Set(data.people.map((p) => p.role))].sort((a, b) => a.localeCompare(b, "pt-BR")), [data.people]);

  const filter = useMemo<OrgFilter>(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    const squadName = (p: Person) =>
      data.squads
        .filter((s) => orderIn(p, s.id) !== undefined)
        .map((s) => s.name)
        .join(" ");
    const matchesText = (text: string) => terms.every((t) => normalize(text).includes(t));
    return {
      squad,
      active: terms.length > 0 || area !== "todas" || role !== "todos",
      person: (p) => (area === "todas" || p.area === area) && (role === "todos" || p.role === role) && matchesText([p.name, p.role, p.area, p.email, squadName(p)].join(" ")),
      // A busca também encontra squads pelo nome; área e cargo filtram só pessoas.
      squadMatches: (s: Squad) => terms.length > 0 && area === "todas" && role === "todos" && matchesText(`${s.name} ${s.description}`),
    };
  }, [query, area, role, squad, data.squads]);

  const people = useMemo(
    () =>
      data.people
        .filter((p) => (squad === "todos" || (squad === NO_SQUAD ? !p.memberships.length : orderIn(p, squad) !== undefined)) && filter.person(p))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [data.people, squad, filter],
  );
  const hasFilters = filter.active || squad !== "todos";
  const clearFilters = () => {
    setQuery("");
    setArea("todas");
    setSquad("todos");
    setRole("todos");
  };

  async function squadsFromPlatforms() {
    const missing = data.platforms.filter((p) => !data.squads.some((s) => s.name.toLowerCase() === p.name.toLowerCase()));
    const ok = await confirm({
      title: "Criar squads a partir das plataformas?",
      message: `Serão criados ${missing.length} squads (${missing.map((p) => p.name).join(", ")}), cada um vinculado à sua plataforma, sem integrantes nem liderança. Depois você pode editar, excluir ou adicionar pessoas.`,
      confirmLabel: "Criar squads",
    });
    if (!ok) return;
    setCreating(true);
    try {
      for (const p of missing)
        await saveSquad(null, {
          name: p.name,
          description: "",
          icon: p.icon,
          accent: p.accent,
          leaderIds: [],
          platformIds: [p.id],
        });
      notify("success", `${missing.length} squads criados.`);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível criar todos os squads.");
    } finally {
      setCreating(false);
    }
  }

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(idx + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length].key;
    setTab(next);
    document.getElementById(`org-tab-${next}`)?.focus();
  };

  const empty = load.status === "ready" && !data.people.length && !data.squads.length;

  return (
    <div className="flex min-h-full">
      <div className="min-w-0 flex-1">
        <PageHero crumbs={[{ label: "Times & Squads" }]} title="Times & Squads" subtitle="Organograma da Jovens Gênios com os times, squads e colaboradores.">
          {canEdit && (
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]" icon={<UserPlus size={19} />} onClick={() => newPerson()}>
                Novo colaborador
              </Button>
              <Button className="h-[52px] rounded-[14px] px-5 text-[15px]" icon={<Plus size={19} />} onClick={newSquad}>
                Novo squad
              </Button>
            </div>
          )}
        </PageHero>

        <PageContainer className="pb-16 pt-4">
          <div
            role="tablist"
            aria-label="Visões de Times & Squads"
            className="-mx-1 flex w-fit max-w-full overflow-x-auto rounded-[18px] border border-[#e3e9f4] bg-surface p-1.5 shadow-[0_2px_10px_rgba(23,27,77,0.04)] [scrollbar-width:none]"
          >
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                id={`org-tab-${key}`}
                role="tab"
                type="button"
                aria-selected={tab === key}
                aria-controls="org-panel"
                tabIndex={tab === key ? 0 : -1}
                onClick={() => setTab(key)}
                onKeyDown={onTabKey}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center gap-2 rounded-[13px] px-5 text-[14.5px] font-bold transition-colors",
                  tab === key ? "bg-violet text-white shadow-[0_6px_16px_rgba(96,69,216,0.3)]" : "text-[#4a557f] hover:text-navy",
                )}
              >
                <Icon size={18} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {/* Busca ocupa a primeira linha; filtros, modo e ações ficam juntos na segunda, sem mudar de lugar. */}
          <div role="search" className="mt-5 flex flex-col gap-3">
            <label className="relative flex h-[54px] w-full items-center rounded-[14px] border border-[#e3e9f4] bg-surface shadow-[0_1px_3px_rgba(23,27,77,0.04)] has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12">
              <Search size={19} aria-hidden className="absolute left-4 text-navy" />
              <span className="sr-only">Buscar por nome, cargo, squad ou área</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome, cargo, squad ou área..."
                className="h-full w-full rounded-[14px] bg-transparent pl-12 pr-36 text-[14.5px] text-ink placeholder:text-subtle focus:outline-none"
              />
              {/* Dentro do campo: aparecer/sumir não empurra os demais controles. */}
              {hasFilters && (
                <Button variant="ghost" size="sm" className="absolute right-2" icon={<X size={15} />} onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid w-full grid-cols-2 gap-3 sm:flex sm:w-auto">
                <FilterSelect label="Área" value={area} onChange={setArea}>
                  <option value="todas">Todas</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Squad" value={squad} onChange={setSquad}>
                  <option value="todos">Todos</option>
                  {data.squads.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  <option value={NO_SQUAD}>Sem squad</option>
                </FilterSelect>
                <FilterSelect label="Cargo" value={role} onChange={setRole}>
                  <option value="todos">Todos</option>
                  {roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </FilterSelect>
              </div>
              {tab === "organograma" && (
                // O seletor de modo fica sempre colado ao filtro de cargo; as ações que dependem do
                // modo vêm depois dele e têm largura fixa, para nada mudar de lugar ao alternar.
                <div className="flex items-center gap-3">
                  <div role="radiogroup" aria-label="Modo do organograma" className="flex h-[54px] shrink-0 items-center rounded-[14px] border border-[#e3e9f4] bg-surface p-1.5">
                    {(
                      [
                        {
                          key: "organograma",
                          label: "Organograma",
                          icon: Workflow,
                        },
                        { key: "lista", label: "Lista", icon: LayoutList },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        role="radio"
                        aria-checked={mode === key}
                        onClick={() => setMode(key)}
                        className={cn(
                          "inline-flex h-full items-center gap-1.5 rounded-[10px] px-3 text-[13px] font-bold transition-colors",
                          mode === key ? "bg-brand-soft text-violet" : "text-muted hover:text-ink",
                        )}
                      >
                        <Icon size={16} aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>
                  <Button
                    className="h-[54px] w-[168px] shrink-0 justify-center rounded-[14px] px-4"
                    icon={expandAll ? <Shrink size={17} /> : <Expand size={17} />}
                    aria-pressed={expandAll}
                    disabled={mode !== "organograma"}
                    title={mode !== "organograma" ? "Disponível no modo Organograma" : undefined}
                    onClick={() => setExpandAll((v) => !v)}
                  >
                    {expandAll ? "Recolher todos" : "Expandir todos"}
                  </Button>
                  <IconButton
                    label="Abrir organograma em tela cheia"
                  disabled={load.status !== "ready" || empty}
                    className="h-[54px] w-[54px] shrink-0 rounded-[14px] border border-[#e3e9f4] bg-surface text-navy hover:border-violet hover:text-violet"
                    onClick={() => {
                      setMode("organograma");
                      setFullscreen(true);
                    }}
                  >
                    <Maximize2 size={19} />
                  </IconButton>
                </div>
              )}
            </div>
          </div>

          {load.status === "error" && (
            <div className="mt-6">
              <ErrorBanner
                message={load.message}
                action={
                  <Button size="sm" onClick={() => void reload()}>
                    Tentar novamente
                  </Button>
                }
              />
            </div>
          )}

          <div
            id="org-panel"
            role="tabpanel"
            aria-labelledby={`org-tab-${tab}`}
            className="mt-6 rounded-[28px] border border-[#e3e9f4] bg-white/60 p-3 shadow-[0_2px_10px_rgba(23,27,77,0.03)] backdrop-blur sm:p-5"
          >
            {load.status === "loading" ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <Skeleton className="h-24 w-[320px] max-w-full" />
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                  <Skeleton className="h-64" />
                </div>
              </div>
            ) : empty ? (
              <EmptyState
                icon={<Network size={22} />}
                title="Monte o organograma do time"
                description="Cadastre os squads e as pessoas. Depois, arraste os cards para realocar, edite cargos e lideranças ou substitua quem muda de posição."
                action={
                  canEdit && (
                    <>
                      <Button variant="primary" icon={<Plus size={16} />} onClick={newSquad}>
                        Novo squad
                      </Button>
                      <Button icon={<UserPlus size={16} />} onClick={() => newPerson()}>
                        Novo colaborador
                      </Button>
                      {data.platforms.length > 0 && (
                        <Button variant="ghost" loading={creating} onClick={squadsFromPlatforms}>
                          Criar squads a partir das plataformas ({data.platforms.length})
                        </Button>
                      )}
                    </>
                  )
                }
              />
            ) : tab === "organograma" ? (
              mode === "organograma" ? (
                <OrgChart filter={filter} expandAll={expandAll} />
              ) : (
                <OrgList filter={filter} />
              )
            ) : tab === "squads" ? (
              <SquadsTab filter={filter} />
            ) : tab === "colaboradores" ? (
              <PeopleTab people={people} />
            ) : (
              <AreasTab people={people} />
            )}
          </div>
        </PageContainer>
      </div>
      {fullscreen && tab === "organograma" ? (
        <OrgFullscreen
          filter={filter}
          query={query}
          onQuery={setQuery}
          expandAll={expandAll}
          onToggleExpandAll={() => setExpandAll((v) => !v)}
          onClose={() => setFullscreen(false)}
          panel={<PersonPanel />}
        />
      ) : (
        <PersonPanel />
      )}
    </div>
  );
}

export function OrgView() {
  return (
    <OrgActionsProvider>
      <OrgPage />
    </OrgActionsProvider>
  );
}
