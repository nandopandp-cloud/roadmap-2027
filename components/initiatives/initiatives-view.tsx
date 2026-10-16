"use client";

import { ChevronDown, LayoutGrid, List, Plus, Rocket, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
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

/** Select de filtro com rótulo interno (padrão visual da referência). */
function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative flex h-[54px] w-full flex-col justify-center rounded-[14px] border border-[#e3e9f4] bg-surface pl-4 pr-10 shadow-[0_1px_3px_rgba(23,27,77,0.04)] transition-colors hover:border-line-strong has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12 sm:w-[172px]">
      <span className="text-[11.5px] font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate bg-transparent text-[15px] font-semibold text-ink focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink" />
    </label>
  );
}

export function InitiativesView() {
  const { load, data, reload, openForm } = useRoadmap();
  const { selectedId, open } = useInitiativeSelection();
  const [filters, setFilters] = useState<InitiativeFilters>(DEFAULT_FILTERS);
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [shortcut, setShortcut] = useState("Ctrl K");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(VIEW_KEY) === "grid") setLayout("grid");
    } catch {
      /* preferência opcional */
    }
    if (/Mac|iPhone|iPad/.test(navigator.userAgent)) setShortcut("⌘ K");
    // ⌘K / Ctrl+K leva o foco à busca.
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
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
        title="Iniciativas do Roadmap 2027"
        subtitle="Projetos que vão levar a educação da Jovens Gênios para o próximo nível."
      >
        <div role="search" aria-label="Buscar iniciativas" className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label className="relative flex h-[52px] min-w-0 flex-1 items-center rounded-[14px] border border-white/70 bg-white/90 shadow-[0_6px_24px_rgba(23,27,77,0.08)] backdrop-blur transition-colors has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/15">
            <Search size={20} aria-hidden className="absolute left-4 text-navy" />
            <span className="sr-only">Buscar iniciativas por nome, tema ou palavra-chave</span>
            <input
              ref={searchRef}
              type="search"
              value={filters.query}
              onChange={(e) => set("query", e.target.value)}
              placeholder="Buscar iniciativas por nome, tema ou palavra-chave..."
              className="h-full w-full rounded-[14px] bg-transparent pl-12 pr-20 text-[14.5px] text-ink placeholder:text-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {filters.query ? (
              <button type="button" onClick={() => set("query", "")} className="absolute right-3 rounded-lg p-1 text-muted hover:text-ink" aria-label="Limpar busca">
                <X size={16} />
              </button>
            ) : (
              <kbd aria-hidden className="absolute right-3.5 rounded-md border border-line bg-[#f6f8fc] px-1.5 py-0.5 font-sans text-[11.5px] font-semibold text-muted">
                {shortcut}
              </kbd>
            )}
          </label>
          <Button variant="primary" className="h-[52px] rounded-[14px] px-6 text-[15px] shadow-[0_8px_20px_rgba(0,133,124,0.25)]" icon={<Plus size={19} />} onClick={() => openForm(null)}>
            Nova iniciativa
          </Button>
        </div>
      </PageHero>

      <PageContainer className="pb-16 pt-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Filtrar por status" className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
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
