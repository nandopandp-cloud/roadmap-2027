"use client";

import { Expand, Minimize2, Minus, MoveHorizontal, Plus, Search, Shrink, UserPlus } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type WheelEvent } from "react";
import { OrgChart, SQUAD_MIN_WIDTH, type OrgFilter } from "@/components/org/org-chart";
import { useOrgActions } from "@/components/org/org-actions";
import { Button, IconButton } from "@/components/ui/button";
import { useFocusTrap } from "@/components/ui/dialog";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.5;
const STEP = 0.1;
/** Respiro lateral da tela (padding do canvas) somado à largura natural do organograma. */
const CANVAS_GUTTER = 64;
const STORAGE_KEY = "org-fullscreen-zoom";

const clamp = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));

function readZoom(): number | null {
  try {
    const raw = Number(window.localStorage.getItem(STORAGE_KEY));
    return raw ? clamp(raw) : null;
  } catch {
    return null;
  }
}

function storeZoom(z: number) {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(z));
  } catch {
    // Preferência local: sem armazenamento, apenas não é lembrada.
  }
}

/**
 * Organograma em tela cheia: ocupa a janela inteira, com zoom e ajuste à largura
 * para enxergar todos os squads sem rolagem horizontal. Edição (arrastar, menus,
 * painel do colaborador) continua funcionando normalmente.
 */
export function OrgFullscreen({
  filter,
  query,
  onQuery,
  expandAll,
  onToggleExpandAll,
  onClose,
  panel,
}: {
  filter: OrgFilter;
  query: string;
  onQuery: (v: string) => void;
  expandAll: boolean;
  onToggleExpandAll: () => void;
  onClose: () => void;
  /** Painel de detalhes do colaborador, exibido ao lado do organograma. */
  panel: ReactNode;
}) {
  const { canEdit, newPerson, newSquad } = useOrgActions();
  const trapRef = useFocusTrap(true, onClose);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoomState] = useState(1);

  const setZoom = useCallback((next: number) => {
    const z = clamp(next);
    setZoomState(z);
    storeZoom(z);
  }, []);

  /** Zoom que faz o grupo com mais squads caber na largura disponível (sem passar de 100%). */
  const fitWidth = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const widest = Math.max(1, ...Array.from(canvas.querySelectorAll<HTMLElement>("[data-org-group]"), (el) => Number(el.dataset.orgGroup) || 1));
    setZoom(Math.min(1, canvas.clientWidth / (widest * SQUAD_MIN_WIDTH + CANVAS_GUTTER)));
  }, [setZoom]);

  // Ao abrir: usa o zoom lembrado ou ajusta à largura.
  useLayoutEffect(() => {
    const saved = readZoom();
    if (saved) setZoomState(saved);
    else fitWidth();
  }, [fitWidth]);

  // A página por trás não rola enquanto a tela cheia está aberta.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  // Atalhos: Ctrl/⌘ + "+", "-" e "0" (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "=" || e.key === "+") setZoom(zoom + STEP);
      else if (e.key === "-") setZoom(zoom - STEP);
      else if (e.key === "0") fitWidth();
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom, setZoom, fitWidth]);

  // Ctrl/⌘ + roda (ou pinça no trackpad) aplica zoom em vez de rolar.
  const onWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY > 0 ? 0.92 : 1.08));
  };
  useEffect(() => {
    // O React registra onWheel como passivo; o preventDefault precisa de um ouvinte ativo.
    const canvas = canvasRef.current;
    if (!canvas) return;
    const block = (e: globalThis.WheelEvent) => (e.ctrlKey || e.metaKey) && e.preventDefault();
    canvas.addEventListener("wheel", block, { passive: false });
    return () => canvas.removeEventListener("wheel", block);
  }, []);

  const pct = Math.round(zoom * 100);

  return (
    <div ref={trapRef} data-layer role="dialog" aria-modal="true" aria-label="Organograma em tela cheia" className="fixed inset-0 z-[45] flex animate-fade-in bg-canvas">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-2 border-b border-line bg-surface/95 px-4 py-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)] backdrop-blur sm:gap-3 sm:px-5">
          <h2 className="mr-1 text-[16px] font-black text-navy">Organograma</h2>

          <label className="relative order-last flex h-11 w-full items-center rounded-[12px] border border-[#e3e9f4] bg-surface has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12 md:order-none md:w-[280px]">
            <Search size={17} aria-hidden className="absolute left-3.5 text-navy" />
            <span className="sr-only">Buscar no organograma</span>
            <input
              type="search"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Buscar pessoa, cargo ou squad..."
              className="h-full w-full rounded-[12px] bg-transparent pl-10 pr-3 text-[14px] text-ink placeholder:text-subtle focus:outline-none"
            />
          </label>
          {filter.active && <span className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-violet">Filtros ativos</span>}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {canEdit && (
              <>
                <Button size="sm" icon={<UserPlus size={16} />} onClick={() => newPerson()}>
                  <span className="hidden lg:inline">Novo colaborador</span>
                </Button>
                <Button size="sm" icon={<Plus size={16} />} onClick={newSquad}>
                  <span className="hidden lg:inline">Novo squad</span>
                </Button>
                <span aria-hidden className="mx-1 hidden h-6 w-px bg-line sm:block" />
              </>
            )}
            <Button size="sm" className="w-[150px] justify-center" icon={expandAll ? <Shrink size={16} /> : <Expand size={16} />} aria-pressed={expandAll} onClick={onToggleExpandAll}>
              {expandAll ? "Recolher todos" : "Expandir todos"}
            </Button>

            <div role="group" aria-label="Zoom" className="flex h-8 items-center rounded-lg border border-[#e3e9f4] bg-surface p-0.5">
              <IconButton label="Diminuir zoom (Ctrl −)" onClick={() => setZoom(zoom - STEP)} disabled={zoom <= MIN_ZOOM} className="h-7 w-7">
                <Minus size={16} />
              </IconButton>
              <button
                type="button"
                onClick={() => setZoom(1)}
                title="Voltar para 100%"
                aria-label={`Zoom ${pct}%. Voltar para 100%`}
                className="h-7 w-[50px] rounded-md text-[13px] font-bold tabular-nums text-ink hover:bg-[#f4f6fb]"
              >
                {pct}%
              </button>
              <IconButton label="Aumentar zoom (Ctrl +)" onClick={() => setZoom(zoom + STEP)} disabled={zoom >= MAX_ZOOM} className="h-7 w-7">
                <Plus size={16} />
              </IconButton>
            </div>
            <Button size="sm" icon={<MoveHorizontal size={16} />} onClick={fitWidth} title="Ajustar à largura (Ctrl 0)">
              <span className="hidden sm:inline">Ajustar à tela</span>
            </Button>
            <Button size="sm" variant="primary" icon={<Minimize2 size={16} />} onClick={onClose} title="Sair da tela cheia (Esc)">
              Sair
            </Button>
          </div>
        </header>

        <div ref={canvasRef} onWheel={onWheel} className="min-h-0 flex-1 overflow-auto p-4 sm:p-6 [scrollbar-width:thin]">
          <div className="w-fit min-w-full" style={{ zoom }}>
            <OrgChart filter={filter} expandAll={expandAll} canvas />
          </div>
        </div>
      </div>
      {panel}
    </div>
  );
}
