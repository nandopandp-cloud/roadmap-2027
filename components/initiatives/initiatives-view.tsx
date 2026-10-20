"use client";

import { LayoutGrid, List, Plus, Rocket, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { useGlobalSearch } from "@/components/search/global-search";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { FilterSelect } from "@/components/ui/filter-select";
import { cn, plural } from "@/lib/client/cn";
import { DEFAULT_FILTERS, filterExceptStatus, filterInitiatives, type InitiativeFilters, type SortKey } from "@/lib/client/filtering";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { INITIATIVE_STATUSES, QUARTERS } from "@/lib/domain/constants";
import { QUARTER_LABEL } from "@/lib/domain/labels";
import type { InitiativeStatus } from "@/lib/domain/types";

const VIEW_KEY = "jg-roadmap:initiatives-view";

/** Rótulos no plural usados nas abas de status. */
const STATUS_TAB_LABEL: Record<InitiativeStatus, string> = {
  ideia: "Ideias",
  discovery: "Em discovery",
  definicao: "Em definição",
  planejada: "Planejadas",
  andamento: "Em andamento",
  validacao: "Em validação",
  concluida: "Concluídas",
  pausada: "Pausadas",
  cancelada: "Canceladas",
};

export function InitiativesView() {
  const { load, data, reload, openForm } = useRoadmap();
  const { selectedId, open } = useInitiativeSelection();
  const [filters, setFilters] = useState<InitiativeFilters>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [shortcut, setShortcut] = useState("Ctrl K");
  const { open: openSearch } = useGlobalSearch();

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "grid") setLayout("grid");
    } catch {
      /* preferência opcional */
    }
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut("⌘ K");
  }, []);

  const changeLayout = (next: "list" | "grid") => {
    setLayout(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      /* preferência opcional */
    }
  };

  const results = useMemo(() => filterInitiatives(data.initiatives, filters), [data.initiatives, filters]);
  const statusBase = useMemo(() => filterExceptStatus(data.initiatives, filters), [data.initiatives, filters]);
  const statusTabs = INITIATIVE_STATUSES.map((s) => ({ s, count: statusBase.filter((i) => i.status === s).length })).filter(
    (t) => t.count > 0 || t.s === filters.status,
  );
  const categories = useMemo(
    () => Array.from(new Set(data.initiatives.map((i) => i.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [data.initiatives],
  );

  const set = <K extends keyof InitiativeFilters>(key: K, value: InitiativeFilters[K]) => setFilters((f) => ({ ...f, [key]: value }));
  const hasFilters =
    filters.query !== "" || filters.quarter !== "todos" || filters.platform !== "todas" || filters.category !== "todas" || filters.status !== "todos";

  const pill = (active: boolean) =>
    cn(
      "inline-flex h-11 items-center whitespace-nowrap rounded-full px-5 text-[14.5px] font-semibold transition-colors",
      active
        ? "bg-[linear-gradient(90deg,#6f4ff2,#5d3fdc)] text-white shadow-[0_6px_16px_rgba(96,69,216,0.35)]"
        : "border border-[#e3e9f4] bg-surface text-ink hover:border-line-strong",
    );

  return (
    <>
      <PageHero
        crumbs={[{ label: "Iniciativas" }]}
        title="Roadmap 2027"
        subtitle="Iniciativas que serão discutidos para o roadmap de produto 2027."
      >
        <div role="search" aria-label="Buscar iniciativas" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={openSearch}
            aria-haspopup="dialog"
            aria-label="Buscar iniciativas por nome, tema ou palavra-chave"
            className="relative flex h-[52px] min-w-0 flex-1 items-center rounded-[14px] border border-white/70 bg-white/90 pl-12 pr-4 text-left shadow-[0_6px_24px_rgba(23,27,77,0.08)] backdrop-blur transition-all hover:border-violet/40 hover:shadow-[0_8px_28px_rgba(96,69,216,0.18)]"
          >
            <Search size={20} aria-hidden className="absolute left-4 text-navy" />
            <span className="flex-1 truncate text-[14.5px] text-subtle">Buscar iniciativas por nome, tema ou palavra-chave...</span>
            <kbd aria-hidden className="rounded-md border border-line bg-[#f6f8fc] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold text-muted">
              {shortcut}
            </kbd>
          </button>
          <Button variant="primary" className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]" icon={<Plus size={19} />} onClick={() => openForm(null)}>
            Nova iniciativa
          </Button>
        </div>
      </PageHero>

      <PageContainer className="pb-16 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Filtrar por status" className="-mx-4 -my-4 flex gap-2.5 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
            <button type="button" role="radio" aria-checked={filters.status === "todos"} className={pill(filters.status === "todos")} onClick={() => set("status", "todos")}>
              Todas ({statusBase.length})
            </button>
            {statusTabs.map(({ s, count }) => (
              <button key={s} type="button" role="radio" aria-checked={filters.status === s} className={pill(filters.status === s)} onClick={() => set("status", s)}>
                {STATUS_TAB_LABEL[s]} ({count})
              </button>
            ))}
          </div>
          <div role="radiogroup" aria-label="Modo de visualização" className="flex rounded-[14px] border border-[#e3e9f4] bg-surface p-1">
            {(
              [
                { key: "grid", icon: LayoutGrid, label: "Grade" },
                { key: "list", icon: List, label: "Lista" },
              ] as const
            ).map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={layout === key}
                aria-label={`Visualizar em ${label.toLowerCase()}`}
                title={label}
                onClick={() => changeLayout(key)}
                className={cn("flex h-9 w-10 items-center justify-center rounded-[10px] transition-colors", layout === key ? "bg-brand-soft text-violet" : "text-muted hover:text-ink")}
              >
                <Icon size={19} />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
          <FilterSelect label="Quarter" value={filters.quarter} onChange={(v) => set("quarter", v as InitiativeFilters["quarter"])}>
            <option value="todos">Todos</option>
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {QUARTER_LABEL[q]}
              </option>
            ))}
            <option value="sem">Sem quarter</option>
          </FilterSelect>
          <FilterSelect label="Plataforma" value={filters.platform} onChange={(v) => set("platform", v)}>
            <option value="todas">Todas</option>
            {data.platforms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Categoria" value={filters.category} onChange={(v) => set("category", v)}>
            <option value="todas">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Ordenar por" value={filters.sort} onChange={(v) => set("sort", v as SortKey)}>
            <option value="prioridade">Prioridade</option>
            <option value="recentes">Atualização recente</option>
            <option value="quarter">Quarter</option>
            <option value="id">Identificador</option>
          </FilterSelect>
        </div>

        <div className="mt-3 flex min-h-7 items-center gap-3">
          <p className="text-[13.5px] font-semibold text-muted" aria-live="polite">
            {load.status === "ready" && hasFilters
              ? `${plural(results.length, "iniciativa encontrada", "iniciativas encontradas")} de ${data.initiatives.length}`
              : load.status === "loading"
                ? "Carregando iniciativas…"
                : ""}
          </p>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}>
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="mt-1">
          {load.status === "loading" && (
            <div className="flex flex-col gap-4" aria-busy="true">
              {[0, 1, 2].map((k) => (
                <Skeleton key={k} className="h-[146px] rounded-[22px]" />
              ))}
            </div>
          )}
          {load.status === "error" && (
            <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
          )}
          {load.status === "ready" && results.length === 0 && (
            <EmptyState
              icon={<Rocket size={22} />}
              title={data.initiatives.length === 0 ? "Nenhuma iniciativa cadastrada" : "Nenhuma iniciativa encontrada"}
              description={
                data.initiatives.length === 0
                  ? "Cadastre a primeira iniciativa conectando um problema real a um resultado esperado."
                  : "Ajuste a busca ou os filtros para ver outras iniciativas."
              }
              action={
                data.initiatives.length === 0 ? (
                  <Button variant="primary" icon={<Plus size={16} />} onClick={() => openForm(null)}>
                    Nova iniciativa
                  </Button>
                ) : (
                  <Button onClick={() => setFilters(DEFAULT_FILTERS)}>Limpar filtros</Button>
                )
              }
            />
          )}
          {load.status === "ready" && results.length > 0 && (
            <ul className={layout === "grid" ? "grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" : "flex flex-col gap-4"}>
              {results.map((i) => (
                <li key={i.id}>
                  <InitiativeCard initiative={i} platforms={data.platforms} selected={selectedId === i.id} layout={layout} onOpen={() => open(i.id)} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </PageContainer>
    </>
  );
}
