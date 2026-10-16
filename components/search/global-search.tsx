"use client";

import { ArrowDown, ArrowUp, CalendarDays, CornerDownLeft, FileText, Layers, MonitorPlay, Plus, Search, SearchX, X, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createContext, Fragment, Suspense, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { InitiativeIllustration } from "@/components/initiatives/initiative-illustration";
import { StatusBadge } from "@/components/ui/badges";
import { useFocusTrap } from "@/components/ui/dialog";
import { cn } from "@/lib/client/cn";
import { highlightParts, queryTerms, searchInitiatives, type SearchResult } from "@/lib/client/search";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { documentReaderHref, prototypeViewerHref } from "@/lib/domain/artifacts";
import { QUARTER_LABEL } from "@/lib/domain/labels";

interface SearchApi {
  open: () => void;
}
const SearchContext = createContext<SearchApi | null>(null);

/** Abre a busca global (usado pelo campo de busca das páginas). */
export function useGlobalSearch(): SearchApi {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useGlobalSearch deve ser usado dentro de <GlobalSearchProvider>.");
  return ctx;
}

/** Atalho global ⌘K / Ctrl+K, de qualquer página, mesmo digitando em outro campo. */
export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const api = useMemo<SearchApi>(() => ({ open: () => setOpen(true) }), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <SearchContext.Provider value={api}>
      {children}
      {isOpen && (
        <Suspense fallback={null}>
          <SearchLightbox onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </SearchContext.Provider>
  );
}

type Row =
  | { type: "action"; id: string; label: string; hint: string; icon: LucideIcon; run: () => void }
  | { type: "result"; id: string; result: SearchResult };

function Mark({ text, terms }: { text: string; terms: string[] }) {
  return (
    <>
      {highlightParts(text, terms).map((p, idx) =>
        p.hit ? (
          <mark key={idx} className="rounded-[4px] bg-[#ffe27a]/70 px-0.5 text-inherit">
            {p.text}
          </mark>
        ) : (
          <Fragment key={idx}>{p.text}</Fragment>
        ),
      )}
    </>
  );
}

function SearchLightbox({ onClose }: { onClose: () => void }) {
  const { data, load, openForm } = useRoadmap();
  const router = useRouter();
  const pathname = usePathname();
  const { open: openInitiative } = useInitiativeSelection();
  const trapRef = useFocusTrap(true, onClose);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const terms = useMemo(() => queryTerms(query), [query]);

  // Trava a rolagem da página por trás.
  useEffect(() => {
    const main = document.getElementById("conteudo");
    const prev = main?.style.overflow;
    if (main) main.style.overflow = "hidden";
    return () => {
      if (main) main.style.overflow = prev ?? "";
    };
  }, []);

  const go = useCallback(
    (fn: () => void) => {
      onClose();
      // Aguarda o fechamento (e a devolução de foco) antes de navegar/abrir.
      setTimeout(fn, 0);
    },
    [onClose],
  );

  const rows = useMemo<Row[]>(() => {
    const actions: Row[] = [
      { type: "action", id: "a-nova", label: "Nova iniciativa", hint: "Criar uma iniciativa", icon: Plus, run: () => go(() => openForm(null)) },
      { type: "action", id: "a-ini", label: "Ir para Iniciativas", hint: "Catálogo de iniciativas", icon: FileText, run: () => go(() => router.push("/iniciativas")) },
      { type: "action", id: "a-road", label: "Ir para o Roadmap", hint: "Visão por quarters", icon: CalendarDays, run: () => go(() => router.push("/roadmap")) },
    ];
    const results = searchInitiatives(data.initiatives, data.platforms, query).slice(0, 12);
    if (!terms.length) {
      const recent = [...data.initiatives].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
      return [
        ...recent.map<Row>((i) => ({ type: "result", id: i.id, result: { kind: "initiative", id: i.id, initiative: i, field: "Resumo", excerpt: i.summary, score: 0 } })),
        ...actions,
      ];
    }
    const matchingActions = actions.filter((a) => a.type === "action" && terms.every((t) => (a.label + " " + a.hint).toLowerCase().includes(t)));
    return [...results.map<Row>((r) => ({ type: "result", id: r.id, result: r })), ...matchingActions];
  }, [data, query, terms, go, openForm, router]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function choose(row: Row) {
    if (row.type === "action") return row.run();
    const r = row.result;
    if (r.kind === "initiative") return go(() => openInitiative(r.id));
    if (r.kind === "document") {
      const doc = r.initiative.documents.find((d) => d.id === r.docId);
      return go(() => (doc?.source === "externo" ? window.open(doc.url, "_blank", "noopener,noreferrer") : router.push(`/iniciativas/${r.initiative.id}/documentos/${encodeURIComponent(r.docId)}`)));
    }
    const proto = r.initiative.prototypes.find((p) => p.id === r.protoId);
    if (proto) go(() => router.push(prototypeViewerHref(r.initiative.id, proto)));
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (rows.length ? (i + 1) % rows.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (rows.length ? (i - 1 + rows.length) % rows.length : 0));
    } else if (e.key === "Enter" && rows[active]) {
      e.preventDefault();
      choose(rows[active]);
    }
  }

  const resultRows = rows.filter((r) => r.type === "result");
  const actionRows = rows.filter((r) => r.type === "action");
  const indexOf = (row: Row) => rows.indexOf(row);
  void pathname;

  return createPortal(
    <div className="fixed inset-0 z-[65] flex items-start justify-center px-3 pt-[9vh] sm:px-6 sm:pt-[12vh]">
      {/* Camada escura com desfoque: o campo de busca é o único elemento em destaque. */}
      <div className="absolute inset-0 animate-fade-in bg-[radial-gradient(ellipse_at_50%_20%,rgba(96,69,216,0.45),rgba(13,10,58,0.82)_62%)] backdrop-blur-[6px]" onClick={onClose} aria-hidden />

      <div
        ref={trapRef}
        data-layer
        role="dialog"
        aria-modal="true"
        aria-label="Busca global"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative w-full max-w-[720px] animate-pop-in"
      >
        {/* Brilho atrás do painel */}
        <div aria-hidden className="absolute -inset-5 -z-10 rounded-[40px] bg-[conic-gradient(from_200deg,#6f4ff2,#2868e8,#00a99d,#ff9f5a,#6f4ff2)] opacity-45 blur-2xl" />

        <div className="overflow-hidden rounded-[26px] bg-surface shadow-[0_30px_90px_rgba(8,6,40,0.55),0_0_0_1.5px_rgba(255,255,255,0.65)]">
          <div className="flex items-center gap-4 border-b border-line px-6 py-5">
            <Search size={26} className="shrink-0 text-violet" aria-hidden />
            <input
              data-autofocus
              type="text"
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={rows[active] ? `${listId}-${active}` : undefined}
              aria-label="Buscar iniciativas, documentos e protótipos"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar iniciativas, documentos, protótipos…"
              className="min-w-0 flex-1 bg-transparent text-[20px] font-semibold text-ink placeholder:font-medium placeholder:text-subtle focus:outline-none"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} className="rounded-lg p-1.5 text-muted hover:bg-[#eef2fa] hover:text-ink" aria-label="Limpar busca">
                <X size={18} />
              </button>
            ) : null}
            <kbd className="hidden rounded-lg border border-line bg-[#f6f8fc] px-2 py-1 font-sans text-[12px] font-bold text-muted sm:block">esc</kbd>
          </div>

          <div ref={listRef} id={listId} role="listbox" aria-label="Resultados" className="max-h-[min(56vh,520px)] overflow-y-auto overscroll-contain p-3">
            {load.status === "loading" && <p className="px-3 py-8 text-center text-[14px] text-muted">Carregando…</p>}

            {load.status === "ready" && terms.length > 0 && resultRows.length === 0 && (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-soft text-violet">
                  <SearchX size={24} aria-hidden />
                </span>
                <p className="text-[16px] font-extrabold text-navy">Nada encontrado para “{query.trim()}”</p>
                <p className="max-w-sm text-[13.5px] text-muted">Tente outro termo, como o nome da iniciativa, uma plataforma ou uma tag.</p>
              </div>
            )}

            {resultRows.length > 0 && (
              <section aria-label={terms.length ? "Resultados" : "Atualizadas recentemente"}>
                <h3 className="px-3 pb-1.5 pt-1 text-[11.5px] font-extrabold uppercase tracking-wider text-subtle">{terms.length ? `Resultados (${resultRows.length})` : "Atualizadas recentemente"}</h3>
                {resultRows.map((row) => {
                  if (row.type !== "result") return null;
                  const idx = indexOf(row);
                  const r = row.result;
                  const isActive = idx === active;
                  const base = cn("flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors", isActive ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_#6045d8]" : "hover:bg-[#f6f8fc]");
                  return (
                    <button key={row.id} type="button" role="option" aria-selected={isActive} id={`${listId}-${idx}`} data-index={idx} onMouseMove={() => setActive(idx)} onClick={() => choose(row)} className={base}>
                      {r.kind === "initiative" ? (
                        <InitiativeIllustration id={r.initiative.id} illustration={r.initiative.illustration} customImage={r.initiative.customImage} className="h-12 w-12 rounded-xl" />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#eef2fa] text-violet">{r.kind === "document" ? <FileText size={22} /> : <MonitorPlay size={22} />}</span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          <span className="truncate text-[15.5px] font-extrabold text-navy">
                            <Mark text={r.kind === "initiative" ? r.initiative.title : r.title} terms={terms} />
                          </span>
                          {r.kind === "initiative" && <StatusBadge status={r.initiative.status} size="sm" />}
                          {r.kind !== "initiative" && <span className="rounded-full bg-[#eef2fa] px-2 py-0.5 text-[11px] font-bold text-muted">{r.kind === "document" ? "Documento" : "Protótipo"}</span>}
                        </span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted">
                          {r.kind === "initiative" ? (
                            <>
                              <span className="font-bold text-subtle">{r.initiative.id}</span>
                              {r.initiative.quarter && <span> · {QUARTER_LABEL[r.initiative.quarter]}</span>}
                              {terms.length > 0 && r.field !== "Nome" ? (
                                <span>
                                  {" · "}
                                  <span className="font-semibold">{r.field}:</span> <Mark text={r.excerpt} terms={terms} />
                                </span>
                              ) : (
                                r.initiative.summary && <span> · {r.initiative.summary}</span>
                              )}
                            </>
                          ) : (
                            <span>
                              {r.initiative.id} · {r.initiative.title}
                            </span>
                          )}
                        </span>
                      </span>
                      {isActive && <CornerDownLeft size={16} className="shrink-0 text-violet" aria-hidden />}
                    </button>
                  );
                })}
              </section>
            )}

            {actionRows.length > 0 && (
              <section aria-label="Ações" className="mt-2 border-t border-line pt-2">
                <h3 className="px-3 pb-1.5 pt-1 text-[11.5px] font-extrabold uppercase tracking-wider text-subtle">Ações rápidas</h3>
                {actionRows.map((row) => {
                  if (row.type !== "action") return null;
                  const idx = indexOf(row);
                  const isActive = idx === active;
                  const Icon = row.icon;
                  return (
                    <button
                      key={row.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      id={`${listId}-${idx}`}
                      data-index={idx}
                      onMouseMove={() => setActive(idx)}
                      onClick={() => choose(row)}
                      className={cn("flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-left transition-colors", isActive ? "bg-brand-soft shadow-[inset_0_0_0_1.5px_#6045d8]" : "hover:bg-[#f6f8fc]")}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2fa] text-violet">
                        <Icon size={20} aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-bold text-navy">{row.label}</span>
                        <span className="block text-[12.5px] text-muted">{row.hint}</span>
                      </span>
                      {isActive && <CornerDownLeft size={16} className="shrink-0 text-violet" aria-hidden />}
                    </button>
                  );
                })}
              </section>
            )}
          </div>

          <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line bg-[#f8f9fd] px-6 py-3 text-[12.5px] font-semibold text-muted">
            <span className="flex items-center gap-1.5">
              <kbd className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-white"><ArrowUp size={13} aria-hidden /></kbd>
              <kbd className="flex h-6 w-6 items-center justify-center rounded-md border border-line bg-white"><ArrowDown size={13} aria-hidden /></kbd>
              navegar
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="flex h-6 items-center rounded-md border border-line bg-white px-1.5"><CornerDownLeft size={13} aria-hidden /></kbd>
              abrir
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="flex h-6 items-center rounded-md border border-line bg-white px-1.5 font-sans">esc</kbd>
              fechar
            </span>
            <span className="ml-auto hidden items-center gap-1.5 sm:flex">
              <Layers size={14} aria-hidden /> {data.initiatives.length} {data.initiatives.length === 1 ? "iniciativa" : "iniciativas"}
            </span>
          </footer>
        </div>
      </div>
    </div>,
    document.body,
  );
}
