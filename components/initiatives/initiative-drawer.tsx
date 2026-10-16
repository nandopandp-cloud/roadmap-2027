"use client";

import { Link2, MoreHorizontal, Pencil, Sparkles, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { DocumentsTab, PrototypesTab } from "@/components/initiatives/drawer/artifacts-tabs";
import { OverviewTab } from "@/components/initiatives/drawer/overview-tab";
import { DependenciesTab, RoadmapTab } from "@/components/initiatives/drawer/planning-tabs";
import { illustrationFor } from "@/components/initiatives/initiative-illustration";
import { PLATFORM_GLYPHS, PlatformPill } from "@/components/platforms/platform-icon";
import { StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { useConfirm, useFocusTrap } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { isTransversal } from "@/lib/client/filtering";
import { DRAWER_TABS, useInitiativeSelection, type DrawerTab } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { ILLUSTRATION_SRC, QUARTER_LABEL } from "@/lib/domain/labels";
import type { Initiative, Platform } from "@/lib/domain/types";

const TAB_LABEL: Record<DrawerTab, string> = {
  "visao-geral": "Visão geral",
  prd: "PRD",
  prototipo: "Protótipo",
  roadmap: "Roadmap",
  dependencias: "Dependências",
};

/** Botão redondo branco do cabeçalho do drawer. */
function RoundButton({ label, onClick, children, ...rest }: { label: string; onClick: () => void; children: ReactNode; [k: `aria-${string}`]: unknown }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy shadow-[0_4px_14px_rgba(23,27,77,0.14)] transition-colors hover:bg-[#f4f2ff]"
      {...rest}
    >
      {children}
    </button>
  );
}

/** Menu de ações secundárias (copiar link, excluir). */
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
      <RoundButton label="Mais ações" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <MoreHorizontal size={20} />
      </RoundButton>
      {open && (
        <div role="menu" className="absolute right-0 top-12 z-20 w-56 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-[var(--shadow-raised)]">
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

/** Arte do cabeçalho: ilustração da iniciativa com nuvens e selos das plataformas. */
function HeaderArt({ initiative, platforms }: { initiative: Initiative; platforms: Platform[] }) {
  const key = illustrationFor(initiative.id, initiative.illustration);
  const badges = platforms.slice(0, 2);
  return (
    <div aria-hidden className="pointer-events-none absolute bottom-0 right-5 hidden h-[220px] w-[240px] sm:block">
      <div className="absolute -bottom-8 right-[-30px] h-24 w-[300px] rounded-[50%] bg-white/90 blur-[6px]" />
      <div className="absolute -bottom-4 right-24 h-16 w-40 rounded-[50%] bg-[#e7defd] blur-[4px]" />
      {key === "astronauta" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/illustrations/astronauta-recorte.svg" alt="" className="absolute bottom-2 right-6 w-[178px] drop-shadow-[0_14px_24px_rgba(74,45,184,0.25)]" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ILLUSTRATION_SRC[key]}
          alt=""
          className="absolute bottom-8 right-10 h-[150px] w-[150px] rotate-[4deg] rounded-[28px] object-cover shadow-[0_18px_36px_rgba(23,20,91,0.28)]"
        />
      )}
      {badges.map((p, idx) => {
        const Glyph = PLATFORM_GLYPHS[p.icon];
        return (
          <span
            key={p.id}
            className={cn(
              "absolute flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-[0_8px_18px_rgba(23,27,77,0.2)]",
              idx === 0 ? "left-4 top-12 -rotate-6" : "right-3 top-12 rotate-6",
            )}
            style={{ background: ACCENT_TONE[p.accent].solid }}
          >
            <Glyph size={22} strokeWidth={2.2} />
          </span>
        );
      })}
      <Sparkles className="absolute right-16 top-6 text-[#FFC94D]" size={26} fill="#FFC94D" />
      <span className="absolute left-14 top-[118px] text-[22px] text-[#8E6CF0]">✦</span>
    </div>
  );
}

/**
 * Drawer lateral de detalhes, sobreposto à página com camada escura.
 * Desktop: ~44% da largura (mín. 620px). Tablet: 94% da largura. Celular: tela cheia.
 */
export function InitiativeDrawer() {
  const { selectedId, tab, setTab, close, open } = useInitiativeSelection();
  const { load, data, initiativeById, openForm, removeInitiative } = useRoadmap();
  const confirm = useConfirm();
  const notify = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trapRef = useFocusTrap(!!selectedId, close);
  const initiative = selectedId ? initiativeById(selectedId) : undefined;

  // Trava a rolagem da página por trás do drawer.
  useEffect(() => {
    if (!selectedId) return;
    const main = document.getElementById("conteudo");
    const prev = main?.style.overflow;
    if (main) main.style.overflow = "hidden";
    return () => {
      if (main) main.style.overflow = prev ?? "";
    };
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [selectedId, tab]);

  if (!selectedId) return null;

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const idx = DRAWER_TABS.indexOf(tab);
    const next =
      e.key === "ArrowRight"
        ? DRAWER_TABS[(idx + 1) % DRAWER_TABS.length]
        : e.key === "ArrowLeft"
          ? DRAWER_TABS[(idx - 1 + DRAWER_TABS.length) % DRAWER_TABS.length]
          : null;
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
          <strong>
            {initiative.id} — {initiative.title}
          </strong>{" "}
          será removida do catálogo e do roadmap, e os vínculos de outras iniciativas e problemas com ela serão desfeitos. Os arquivos em{" "}
          <code>{initiative.repoFolder}</code> não são apagados.
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

  const impacted = initiative
    ? initiative.platformIds.map((id) => data.platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p)
    : [];

  return (
    <>
      <div className="fixed inset-0 z-40 animate-fade-in bg-[#100c3f]/50 backdrop-blur-[3px]" onClick={close} aria-hidden />
      <div
        ref={trapRef}
        data-layer
        role="dialog"
        aria-modal="true"
        aria-label={initiative ? `Detalhes: ${initiative.title}` : "Detalhes da iniciativa"}
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full animate-drawer-in flex-col overflow-hidden bg-surface shadow-[-24px_0_60px_rgba(16,12,63,0.28)] focus:outline-none",
          "sm:w-[min(760px,94vw)] sm:rounded-l-[28px] xl:w-[clamp(620px,44vw,820px)]",
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
              <RoundButton label="Fechar detalhes" onClick={close}>
                <X size={20} />
              </RoundButton>
            </div>
            <EmptyState
              className="mt-6"
              title="Iniciativa não encontrada"
              description={`Não existe uma iniciativa com o identificador ${selectedId}. Ela pode ter sido excluída.`}
              action={<Button onClick={close}>Fechar</Button>}
            />
          </div>
        ) : (
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <header className="relative overflow-hidden bg-[linear-gradient(135deg,#f3eeff_0%,#ecf1ff_55%,#fdf1f7_100%)] px-6 pb-7 pt-6 sm:px-9 sm:pt-7">
              <HeaderArt initiative={initiative} platforms={impacted} />
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 pt-1.5">
                  <StatusBadge status={initiative.status} />
                  <span className="text-[14px] font-semibold text-muted">
                    {initiative.quarter ? QUARTER_LABEL[initiative.quarter] : "Sem quarter"}
                  </span>
                  {isTransversal(initiative) && (
                    <>
                      <span aria-hidden className="h-4 w-px bg-[#c9d0e2]" />
                      <span className="text-[14px] font-bold text-navy">Transversal</span>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <RoundButton label="Editar iniciativa" onClick={() => openForm(initiative.id)}>
                    <Pencil size={17} />
                  </RoundButton>
                  <ActionsMenu onEdit={() => openForm(initiative.id)} onCopy={copyLink} onDelete={handleDelete} />
                  <RoundButton label="Fechar detalhes" onClick={close}>
                    <X size={20} />
                  </RoundButton>
                </div>
              </div>
              <p className="relative z-10 mt-3 text-[12.5px] font-extrabold tracking-wide text-subtle">{initiative.id}</p>
              <h2 className="relative z-10 mt-1 max-w-full text-[28px] font-black leading-[1.1] tracking-[-0.015em] text-navy sm:max-w-[calc(100%-230px)] sm:text-[32px]">
                {initiative.title}
              </h2>
              {initiative.summary && (
                <p className="relative z-10 mt-3 max-w-full text-[15px] leading-relaxed text-[#4a5680] sm:max-w-[calc(100%-230px)]">{initiative.summary}</p>
              )}
              {impacted.length > 0 && (
                <div className="relative z-10 mt-5 flex flex-wrap gap-2">
                  {impacted.map((p) => (
                    <PlatformPill key={p.id} platform={p} />
                  ))}
                </div>
              )}
            </header>

            <div className="sticky top-0 z-20 border-b border-line bg-surface/95 px-6 backdrop-blur sm:px-9">
              <div role="tablist" aria-label="Seções da iniciativa" className="flex justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
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
                      "relative shrink-0 whitespace-nowrap px-4 py-4 text-[15px] font-semibold transition-colors",
                      tab === t ? "text-navy" : "text-muted hover:text-ink",
                    )}
                  >
                    {TAB_LABEL[t]}
                    {tab === t && <span aria-hidden className="absolute inset-x-1 -bottom-px h-[3px] rounded-full bg-blue" />}
                  </button>
                ))}
              </div>
            </div>

            <div id="drawer-panel" role="tabpanel" aria-labelledby={`drawer-tab-${tab}`} className="@container bg-[#fbfcff] px-6 pb-10 pt-5 sm:px-9">
              {tab === "visao-geral" && <OverviewTab initiative={initiative} platforms={data.platforms} onTab={setTab} />}
              {tab === "prd" && <DocumentsTab initiative={initiative} />}
              {tab === "prototipo" && <PrototypesTab initiative={initiative} platforms={data.platforms} />}
              {tab === "roadmap" && <RoadmapTab initiative={initiative} onOpen={(id) => open(id)} />}
              {tab === "dependencias" && <DependenciesTab initiative={initiative} platforms={data.platforms} onOpen={(id) => open(id)} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
