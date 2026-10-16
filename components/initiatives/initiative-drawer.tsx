"use client";

import { FileText, Link2, MoreHorizontal, Pencil, Play, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { DocumentsTab, PrototypesTab } from "@/components/initiatives/drawer/artifacts-tabs";
import { OverviewTab } from "@/components/initiatives/drawer/overview-tab";
import { DependenciesTab, RoadmapTab } from "@/components/initiatives/drawer/planning-tabs";
import { StatusBadge } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { isTransversal } from "@/lib/client/filtering";
import { DRAWER_TABS, useInitiativeSelection, type DrawerTab } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { documentReaderHref, primaryPrd, primaryPrototype, prototypeViewerHref } from "@/lib/domain/artifacts";
import { QUARTER_LABEL } from "@/lib/domain/labels";

const TAB_LABEL: Record<DrawerTab, string> = {
  "visao-geral": "Visão geral",
  prd: "PRD",
  prototipo: "Protótipo",
  roadmap: "Roadmap",
  dependencias: "Dependências",
};

/** Menu de ações secundárias do drawer. */
function ActionsMenu({ onEdit, onCopy, onDelete }: { onEdit: () => void; onCopy: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] font-semibold hover:bg-[#f2f5fb]";
  return (
    <div ref={ref} className="relative">
      <IconButton label="Mais ações" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal size={20} />
      </IconButton>
      {open && (
        <div role="menu" className="absolute right-0 top-11 z-20 w-56 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-raised)]">
          <button role="menuitem" type="button" className={cn(item, "text-ink")} onClick={() => (setOpen(false), onEdit())}>
            <Pencil size={16} aria-hidden /> Editar iniciativa
          </button>
          <button role="menuitem" type="button" className={cn(item, "text-ink")} onClick={() => (setOpen(false), onCopy())}>
            <Link2 size={16} aria-hidden /> Copiar link
          </button>
          <button role="menuitem" type="button" className={cn(item, "text-[#b3242f] hover:bg-[#fdf1f2]")} onClick={() => (setOpen(false), onDelete())}>
            <Trash2 size={16} aria-hidden /> Excluir iniciativa
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Drawer lateral de detalhes. No desktop largo ocupa ~38% da janela ao lado
 * da lista (que continua visível); em telas menores sobrepõe o conteúdo e,
 * no celular, ocupa a tela inteira.
 */
export function InitiativeDrawer() {
  const { selectedId, tab, setTab, close, open } = useInitiativeSelection();
  const { load, data, initiativeById, openForm, removeInitiative, form } = useRoadmap();
  const confirm = useConfirm();
  const notify = useToast();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const initiative = selectedId ? initiativeById(selectedId) : undefined;

  // Ao trocar de iniciativa: volta ao topo e move o foco para o título.
  useEffect(() => {
    if (!selectedId) return;
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus({ preventScroll: true });
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [tab]);

  // Esc fecha o drawer quando nenhum diálogo estiver aberto por cima.
  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector("[data-layer]") || form) return;
      close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedId, close, form]);

  if (!selectedId) return null;

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = DRAWER_TABS.indexOf(tab);
    const next =
      e.key === "ArrowRight" ? DRAWER_TABS[(idx + 1) % DRAWER_TABS.length] : e.key === "ArrowLeft" ? DRAWER_TABS[(idx - 1 + DRAWER_TABS.length) % DRAWER_TABS.length] : null;
    if (next) {
      e.preventDefault();
      setTab(next);
      document.getElementById(`drawer-tab-${next}`)?.focus();
    }
  };

  async function handleDelete() {
    if (!initiative) return;
    const ok = await confirm({
      title: "Excluir iniciativa?",
      message: (
        <>
          <strong>{initiative.id} — {initiative.title}</strong> será removida do catálogo e do roadmap, e os vínculos de outras
          iniciativas e problemas com ela serão desfeitos. Os arquivos em <code>{initiative.repoFolder}</code> não são apagados.
        </>
      ),
      confirmLabel: "Excluir iniciativa",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await removeInitiative(initiative.id);
      close();
      notify("success", `${initiative.id} foi excluída.`);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível excluir a iniciativa.");
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/iniciativas?iniciativa=${selectedId}`);
      notify("success", "Link da iniciativa copiado.");
    } catch {
      notify("error", "Não foi possível copiar o link.");
    }
  }

  const prd = initiative && primaryPrd(initiative.documents);
  const proto = initiative && primaryPrototype(initiative.prototypes);

  return (
    <>
      <div className="fixed inset-0 z-30 animate-fade-in bg-[#171b4d]/35 xl:hidden" onClick={close} aria-hidden />
      <aside
        aria-label={initiative ? `Detalhes: ${initiative.title}` : "Detalhes da iniciativa"}
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-full animate-drawer-in flex-col bg-surface shadow-[var(--shadow-drawer)] sm:w-[min(600px,92vw)]",
          "xl:static xl:z-auto xl:w-[clamp(460px,35vw,620px)] xl:shrink-0 xl:border-l xl:border-line xl:shadow-[var(--shadow-drawer)]",
        )}
      >
        {load.status === "loading" ? (
          <div className="flex flex-col gap-4 p-8" aria-busy="true">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : !initiative ? (
          <div className="flex flex-1 flex-col p-8">
            <div className="flex justify-end">
              <IconButton label="Fechar detalhes" onClick={close}>
                <X size={22} />
              </IconButton>
            </div>
            <EmptyState
              title="Iniciativa não encontrada"
              description={`Não existe uma iniciativa com o identificador ${selectedId}. Ela pode ter sido excluída.`}
              action={<Button onClick={close}>Fechar</Button>}
            />
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              <header className="px-6 pt-6 sm:px-8 sm:pt-8">
                <div className="flex items-start justify-between gap-3">
                  <StatusBadge status={initiative.status} />
                  <div className="-mr-2 -mt-1 flex items-center gap-0.5">
                    <IconButton label="Editar iniciativa" onClick={() => openForm(initiative.id)}>
                      <Pencil size={18} />
                    </IconButton>
                    <ActionsMenu onEdit={() => openForm(initiative.id)} onCopy={copyLink} onDelete={handleDelete} />
                    <IconButton label="Fechar detalhes" onClick={close}>
                      <X size={22} />
                    </IconButton>
                  </div>
                </div>
                <p className="mt-4 text-[15px] text-muted">
                  {initiative.quarter ? QUARTER_LABEL[initiative.quarter] : "Sem quarter"}
                  {isTransversal(initiative) && <> <span aria-hidden className="mx-1.5">·</span> Transversal</>}
                  <span aria-hidden className="mx-1.5">·</span>
                  <span className="font-semibold">{initiative.id}</span>
                </p>
                <h2 ref={headingRef} tabIndex={-1} className="mt-1.5 text-[28px] font-black leading-[1.12] tracking-[-0.015em] text-navy focus:outline-none sm:text-[32px]">
                  {initiative.title}
                </h2>
                {initiative.summary && <p className="mt-3 text-[16px] leading-relaxed text-muted">{initiative.summary}</p>}
              </header>

              <div className="sticky top-0 z-10 mt-5 bg-surface/95 px-6 backdrop-blur sm:px-8">
                <div role="tablist" aria-label="Seções da iniciativa" className="flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
                  {DRAWER_TABS.map((t) => (
                    <button
                      key={t}
                      id={`drawer-tab-${t}`}
                      role="tab"
                      type="button"
                      aria-selected={tab === t}
                      aria-controls="drawer-panel"
                      tabIndex={tab === t ? 0 : -1}
                      onClick={() => setTab(t)}
                      onKeyDown={onTabKey}
                      className={cn(
                        "relative shrink-0 whitespace-nowrap px-3.5 py-3 text-[14.5px] font-semibold transition-colors",
                        tab === t ? "text-navy" : "text-muted hover:text-ink",
                      )}
                    >
                      {TAB_LABEL[t]}
                      {tab === t && <span aria-hidden className="absolute inset-x-2 -bottom-px h-[3px] rounded-full bg-blue" />}
                    </button>
                  ))}
                </div>
              </div>

              <div id="drawer-panel" role="tabpanel" aria-labelledby={`drawer-tab-${tab}`} className="px-6 pb-6 sm:px-8">
                {tab === "visao-geral" && <OverviewTab initiative={initiative} platforms={data.platforms} onTab={setTab} />}
                {tab === "prd" && <DocumentsTab initiative={initiative} />}
                {tab === "prototipo" && <PrototypesTab initiative={initiative} platforms={data.platforms} />}
                {tab === "roadmap" && <RoadmapTab initiative={initiative} onOpen={(id) => open(id)} />}
                {tab === "dependencias" && <DependenciesTab initiative={initiative} platforms={data.platforms} onOpen={(id) => open(id)} />}
              </div>
            </div>

            <footer className="grid shrink-0 grid-cols-2 gap-3 border-t border-line bg-surface px-6 py-4 sm:px-8">
              <Button
                variant="outline"
                size="lg"
                icon={<FileText size={19} />}
                onClick={() =>
                  prd && prd.source === "repo"
                    ? router.push(documentReaderHref(initiative.id, prd))
                    : prd
                      ? window.open(prd.url, "_blank", "noopener,noreferrer")
                      : setTab("prd")
                }
              >
                {prd ? "Ver PRD" : "Adicionar PRD"}
              </Button>
              <Button
                variant="primary"
                size="lg"
                icon={<Play size={19} fill="currentColor" />}
                onClick={() =>
                  proto && proto.source === "repo"
                    ? router.push(prototypeViewerHref(initiative.id, proto))
                    : proto
                      ? window.open(proto.url, "_blank", "noopener,noreferrer")
                      : setTab("prototipo")
                }
              >
                {proto ? "Abrir protótipo" : "Adicionar protótipo"}
              </Button>
            </footer>
          </>
        )}
      </aside>
    </>
  );
}
