"use client";

import { ChevronDown, Plus, Rocket, Search, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { InitiativeCard } from "@/components/initiatives/initiative-card";
import { PageContainer, PageTitle, TopBar } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { DEFAULT_FILTERS, filterInitiatives, type InitiativeFilters, type SortKey } from "@/lib/client/filtering";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { INITIATIVE_STATUSES, QUARTERS } from "@/lib/domain/constants";
import { QUARTER_LABEL, STATUS_LABEL } from "@/lib/domain/labels";

/** Select de filtro com rótulo interno (padrão visual da tela de Iniciativas). */
function FilterSelect({
  label,
  value,
  onChange,
  children,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "relative flex h-[58px] min-w-[150px] flex-col justify-center rounded-2xl border border-line bg-surface pl-4 pr-10 shadow-[var(--shadow-card)] transition-colors hover:border-line-strong",
        "has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12",
        className,
      )}
    >
      <span className="text-[12px] font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none bg-transparent text-[15px] font-semibold text-ink focus:outline-none"
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

  const results = useMemo(() => filterInitiatives(data.initiatives, filters), [data.initiatives, filters]);
  const set = <K extends keyof InitiativeFilters>(key: K, value: InitiativeFilters[K]) =>
    setFilters((f) => ({ ...f, [key]: value }));
  const hasFilters =
    filters.query !== "" || filters.quarter !== "todos" || filters.platform !== "todas" || filters.status !== "todos";
  const drawerOpen = !!selectedId;

  return (
    <PageContainer>
      <TopBar crumbs={[{ label: "Iniciativas" }]} />
      <PageTitle
        title="Iniciativas"
        subtitle="Problemas reais, motivadores e soluções conectadas ao roadmap."
        actions={
          <Button variant="primary" icon={<Plus size={18} />} onClick={() => openForm(null)}>
            Nova iniciativa
          </Button>
        }
      />

      <div role="search" className="mt-7 flex flex-wrap gap-3" aria-label="Buscar e filtrar iniciativas">
        <label className="relative flex h-[58px] min-w-[240px] flex-[2_1_320px] items-center rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] transition-colors hover:border-line-strong has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12">
          <Search size={20} aria-hidden className="absolute left-4 text-navy" />
          <span className="sr-only">Buscar iniciativas</span>
          <input
            type="search"
            value={filters.query}
            onChange={(e) => set("query", e.target.value)}
            placeholder="Buscar iniciativas por nome, tema ou palavra-chave…"
            className="h-full w-full rounded-2xl bg-transparent pl-12 pr-10 text-[14.5px] text-ink placeholder:text-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {filters.query && (
            <button
              type="button"
              onClick={() => set("query", "")}
              className="absolute right-3 rounded-lg p-1 text-muted hover:text-ink"
              aria-label="Limpar busca"
            >
              <X size={16} />
            </button>
          )}
        </label>
        <FilterSelect label="Quarter" value={filters.quarter} onChange={(v) => set("quarter", v as InitiativeFilters["quarter"])} className="flex-1">
          <option value="todos">Todos</option>
          {QUARTERS.map((q) => (
            <option key={q} value={q}>
              {QUARTER_LABEL[q]}
            </option>
          ))}
          <option value="sem">Sem quarter</option>
        </FilterSelect>
        <FilterSelect label="Plataforma" value={filters.platform} onChange={(v) => set("platform", v)} className="flex-1">
          <option value="todas">Todas</option>
          {data.platforms.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Status" value={filters.status} onChange={(v) => set("status", v as InitiativeFilters["status"])} className="flex-1">
          <option value="todos">Todos</option>
          {INITIATIVE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="Ordenar por" value={filters.sort} onChange={(v) => set("sort", v as SortKey)} className="flex-1">
          <option value="prioridade">Prioridade</option>
          <option value="recentes">Atualização recente</option>
          <option value="quarter">Quarter</option>
          <option value="id">Identificador</option>
        </FilterSelect>
      </div>

      <div className="mt-5 flex min-h-8 items-center gap-3">
        <p className="text-[15px] font-semibold text-muted" aria-live="polite">
          {load.status === "ready"
            ? hasFilters
              ? `${plural(results.length, "iniciativa encontrada", "iniciativas encontradas")} de ${data.initiatives.length}`
              : plural(results.length, "iniciativa", "iniciativas")
            : "Carregando iniciativas…"}
        </p>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => setFilters((f) => ({ ...DEFAULT_FILTERS, sort: f.sort }))}>
            Limpar filtros
          </Button>
        )}
      </div>

      <div className="mt-3">
        {load.status === "loading" && (
          <div className="flex flex-col gap-4" aria-busy="true">
            {[0, 1, 2].map((k) => (
              <Skeleton key={k} className="h-[146px] rounded-[20px]" />
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
          <ul className="flex flex-col gap-4">
            {results.map((i) => (
              <li key={i.id}>
                <InitiativeCard
                  initiative={i}
                  platforms={data.platforms}
                  selected={selectedId === i.id}
                  compact={drawerOpen}
                  onOpen={() => open(i.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageContainer>
  );
}
