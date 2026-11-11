"use client";

import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { OWNER_TRACK_ICON } from "@/components/roadmap/roadmap-2026";
import { cn, plural } from "@/lib/client/cn";
import { STATUS_2026_TONE } from "@/lib/client/tones";
import {
  OWNER_TRACK_LABEL,
  STATUS_2026_LABEL,
  TRACK_STATUS_LABEL,
  TRACK_STATUS_TRACKS,
  TRACK_STATUSES_2026,
  type Status2026,
  type TrackStatus2026,
  type TrackStatusTrack,
} from "@/lib/domain/roadmap-2026";
import { TRACK_STATUS_TONE } from "@/components/roadmap/roadmap-2026";

/** Combinação área + status da área ("design:andamento"). */
export type AreaCell = `${TrackStatusTrack}:${TrackStatus2026}`;
export const areaCell = (track: TrackStatusTrack, status: TrackStatus2026) => `${track}:${status}` as AreaCell;
/** Todas as combinações área × status: o padrão do filtro (não filtra nada). */
export const ALL_AREA_CELLS: AreaCell[] = TRACK_STATUS_TRACKS.flatMap((t) => TRACK_STATUSES_2026.map((st) => `${t}:${st}` as AreaCell));
export const isAllCells = (cells: AreaCell[]) => ALL_AREA_CELLS.every((c) => cells.includes(c));
export const splitCell = (cell: AreaCell) => cell.split(":") as [TrackStatusTrack, TrackStatus2026];
/** "Design em andamento". */
export const cellLabel = (cell: AreaCell) => {
  const [track, status] = splitCell(cell);
  return `${OWNER_TRACK_LABEL[track]} ${TRACK_STATUS_LABEL[status].toLowerCase()}`;
};

/** Status da iniciativa como botões coloridos (liga/desliga), cada um com a contagem. Oculto na barra por ora. */
export function StatusChips2026({
  statuses,
  value,
  counts,
  onChange,
}: {
  statuses: readonly Status2026[];
  value: Status2026[];
  counts: Record<string, number>;
  onChange: (value: Status2026[]) => void;
}) {
  return (
    <div role="group" aria-label="Status da iniciativa" className="flex h-12 flex-wrap items-center gap-1.5">
      {statuses.map((st) => {
        const on = value.includes(st);
        const tone = STATUS_2026_TONE[st];
        return (
          <button
            key={st}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((s) => s !== st) : [...value, st])}
            className={cn(
              "inline-flex h-10 items-center gap-1.5 rounded-full border-[1.5px] px-2.5 text-[13.5px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
              on ? "" : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
            style={on ? { borderColor: tone.dot, background: tone.bg, color: tone.fg } : undefined}
          >
            <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
            {STATUS_2026_LABEL[st]}
            <span
              className={cn("rounded-full px-1.5 text-[11.5px] font-extrabold", on ? "bg-white/80" : "bg-[#f1f3f8] text-subtle")}
              aria-label={`${counts[st] ?? 0} iniciativas`}
            >
              {counts[st] ?? 0}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Filtro "Áreas": grade área × status da área. Cada célula é uma combinação ("Design em
 * andamento"); várias marcadas = quem atende a qualquer uma. O nome da área marca a linha inteira.
 */
export function AreaFilter2026({
  value,
  counts,
  rowCounts,
  onChange,
}: {
  value: AreaCell[];
  /** Quantas iniciativas em cada combinação (considerando os demais filtros). */
  counts: Record<string, number>;
  /** Quantas iniciativas têm cada área (linha inteira). */
  rowCounts: Record<string, number>;
  onChange: (value: AreaCell[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const inside = (n: Node) => ref.current?.contains(n) || panelRef.current?.contains(n);
    const onDown = (e: MouseEvent) => !inside(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      setOpen(false);
      ref.current?.querySelector<HTMLButtonElement>("button")?.focus();
    };
    const onScroll = (e: Event) => !inside(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const toggle = (cell: AreaCell) => onChange(value.includes(cell) ? value.filter((c) => c !== cell) : [...value, cell]);
  const toggleRow = (track: TrackStatusTrack) => {
    const row = TRACK_STATUSES_2026.map((st) => areaCell(track, st));
    const all = row.every((c) => value.includes(c));
    onChange(all ? value.filter((c) => !row.includes(c)) : [...new Set([...value, ...row])]);
  };
  const toggleColumn = (status: TrackStatus2026) => {
    const column = TRACK_STATUS_TRACKS.map((t) => areaCell(t, status));
    const all = column.every((c) => value.includes(c));
    onChange(all ? value.filter((c) => !column.includes(c)) : [...new Set([...value, ...column])]);
  };
  const allSelected = isAllCells(value);
  /** Seleção rápida: só um status em todas as áreas. */
  const onlyColumn = (status: TrackStatus2026) => onChange(TRACK_STATUS_TRACKS.map((t) => areaCell(t, status)));
  const isOnlyColumn = (status: TrackStatus2026) =>
    value.length === TRACK_STATUS_TRACKS.length && TRACK_STATUS_TRACKS.every((t) => value.includes(areaCell(t, status)));
  // O detalhe de cada combinação aparece nas etiquetas de "Filtrando"; aqui fica o resumo curto.
  const summary = allSelected ? "Todas" : value.length ? "Selecionadas" : "Nenhuma";
  const filtering = !allSelected;

  return (
    <div ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Áreas: ${allSelected ? "todas" : value.length ? value.map(cellLabel).join(", ") : "nenhuma"}`}
        onClick={() => {
          const rect = ref.current?.getBoundingClientRect();
          if (rect) {
            const width = Math.min(640, window.innerWidth - 32);
            const left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
            setPos({ top: rect.bottom + 8, left, width });
          }
          setOpen((v) => !v);
        }}
        className={cn(
          "inline-flex h-12 max-w-[200px] items-center gap-2 rounded-xl border px-3 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet",
          filtering || open ? "border-violet bg-brand-soft text-brand" : "border-line bg-surface text-ink hover:border-line-strong",
        )}
      >
        <SlidersHorizontal size={16} aria-hidden className="shrink-0" />
        <span className="truncate">{summary}</span>
        {filtering && value.length > 0 && <span className="rounded-full bg-violet px-2 text-[12px] font-extrabold text-white">{value.length}</span>}
        <ChevronDown size={16} aria-hidden className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && pos && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Filtrar por área"
          className="fixed z-[45] rounded-2xl border border-line bg-surface p-4 shadow-[0_18px_40px_rgba(23,27,77,0.18)]"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <p className="text-[15px] font-black text-navy">Filtrar por área</p>
          <p className="mt-0.5 text-[12.5px] text-muted">
            Marque o status de cada área. Ex.: “Engenharia · Não iniciado” mostra as iniciativas em que a engenharia ainda não começou.
          </p>
          <div role="group" aria-label="Seleção rápida" className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12.5px] font-extrabold text-muted">Seleção rápida:</span>
            {/* "Todos" é só uma ação (marca tudo): nunca aparece marcado, para não confundir com um status. */}
            <button
              type="button"
              onClick={() => onChange(ALL_AREA_CELLS)}
              title="Marcar todos os status de todas as áreas"
              className="inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] border-line px-3 text-[13px] font-bold text-muted transition-colors hover:border-line-strong hover:text-ink"
            >
              Todos
            </button>
            {TRACK_STATUSES_2026.map((st) => {
              const on = isOnlyColumn(st);
              const tone = TRACK_STATUS_TONE[st];
              return (
                <button
                  key={st}
                  type="button"
                  aria-pressed={on}
                  onClick={() => onlyColumn(st)}
                  title={`Só ${TRACK_STATUS_LABEL[st].toLowerCase()}, em todas as áreas`}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] font-bold transition-colors",
                    on ? "" : "border-line text-muted hover:border-line-strong hover:text-ink",
                  )}
                  style={on ? { borderColor: tone.dot, background: tone.bg, color: tone.fg } : undefined}
                >
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
                  {TRACK_STATUS_LABEL[st]}
                </button>
              );
            })}
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-separate [border-spacing:0_6px]">
              <thead>
                <tr>
                  <th className="w-[130px] text-left text-[12.5px] font-extrabold text-muted">Área</th>
                  {TRACK_STATUSES_2026.map((st) => (
                    <th key={st} className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleColumn(st)}
                        title={`Marcar ${TRACK_STATUS_LABEL[st].toLowerCase()} em todas as áreas`}
                        className="rounded-lg px-2 py-0.5 text-[12.5px] font-extrabold text-muted hover:bg-[#f3f1fd] hover:text-brand"
                      >
                        {TRACK_STATUS_LABEL[st]}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRACK_STATUS_TRACKS.map((track) => {
                  const Icon = OWNER_TRACK_ICON[track];
                  return (
                    <tr key={track}>
                      <td>
                        <button
                          type="button"
                          onClick={() => toggleRow(track)}
                          title={`Todas as iniciativas com ${OWNER_TRACK_LABEL[track]} (${rowCounts[track] ?? 0})`}
                          className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[14px] font-extrabold text-navy hover:bg-[#f3f1fd]"
                        >
                          <Icon size={14} aria-hidden className="text-muted" />
                          {OWNER_TRACK_LABEL[track]}
                        </button>
                      </td>
                      {TRACK_STATUSES_2026.map((st) => {
                        const cell = areaCell(track, st);
                        const on = value.includes(cell);
                        const tone = TRACK_STATUS_TONE[st];
                        return (
                          <td key={st} className="px-1 text-center">
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={on}
                              aria-label={`${cellLabel(cell)}: ${counts[cell] ?? 0} iniciativas`}
                              onClick={() => toggle(cell)}
                              className={cn(
                                "inline-flex h-10 w-full min-w-[96px] items-center justify-center gap-2 rounded-xl border-[1.5px] text-[13.5px] font-extrabold transition-colors",
                                on ? "" : "border-line bg-surface text-muted hover:border-line-strong",
                              )}
                              style={on ? { borderColor: tone.dot, background: tone.bg, color: tone.fg } : undefined}
                            >
                              <span
                                aria-hidden
                                className="flex h-4 w-4 items-center justify-center rounded-[4px] border-2"
                                style={on ? { background: tone.dot, borderColor: tone.dot, color: "#fff" } : { borderColor: "#cfd9ea" }}
                              >
                                {on && <Check size={11} strokeWidth={3.2} />}
                              </span>
                              {counts[cell] ?? 0}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-[12.5px] text-muted">
            <span>Mais de uma célula marcada: aparece quem atende a qualquer uma. Clique na área ou no status para marcar a linha ou a coluna.</span>
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="font-bold text-brand hover:underline">
                Desmarcar todos
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Filtros aplicados como etiquetas removíveis, com "Limpar filtros" e o total exibido. */
export function ActiveFilters2026({
  pills,
  total,
  onClear,
}: {
  pills: { key: string; prefix?: string; label: string; onRemove: () => void }[];
  total: number;
  onClear: () => void;
}) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-2" aria-live="polite">
      <span className="text-[13.5px] font-extrabold text-navy">{plural(total, "iniciativa", "iniciativas")}</span>
      <span className="mr-1 text-[13px] font-semibold text-muted">· {pills.length ? "Filtrando:" : "sem filtros"}</span>
      {pills.map((p) => (
        <span key={p.key} className="inline-flex h-8 items-center gap-1 rounded-full border border-line bg-surface pl-3 pr-1 text-[13.5px] font-bold text-ink">
          {p.prefix && <span className="font-semibold text-subtle">{p.prefix}</span>}
          {p.label}
          <button
            type="button"
            onClick={p.onRemove}
            aria-label={`Remover filtro ${p.prefix ?? ""} ${p.label}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-subtle hover:bg-[#fdecec] hover:text-[#c42b3a]"
          >
            <X size={13} />
          </button>
        </span>
      ))}
      {pills.length > 0 && (
        <button type="button" onClick={onClear} className="ml-1 text-[13.5px] font-extrabold text-brand hover:underline">
          Limpar filtros
        </button>
      )}
    </div>
  );
}

/**
 * Agrupa as combinações marcadas para as etiquetas de "Filtrando": tudo marcado vira "todas",
 * uma linha inteira vira "Design (todos os status)" e uma coluna inteira "Em andamento (todas as áreas)".
 */
export function groupAreaCells(cells: AreaCell[]): { key: string; label: string; cells: AreaCell[] }[] {
  if (isAllCells(cells)) return [];
  if (!cells.length) return [{ key: "nenhuma", label: "nenhuma", cells: [] }];
  let rest = [...cells];
  const groups: { key: string; label: string; cells: AreaCell[] }[] = [];
  for (const t of TRACK_STATUS_TRACKS) {
    const row = TRACK_STATUSES_2026.map((st) => areaCell(t, st));
    if (row.every((c) => rest.includes(c))) {
      groups.push({ key: `linha-${t}`, label: `${OWNER_TRACK_LABEL[t]} (todos os status)`, cells: row });
      rest = rest.filter((c) => !row.includes(c));
    }
  }
  for (const st of TRACK_STATUSES_2026) {
    const column = TRACK_STATUS_TRACKS.map((t) => areaCell(t, st));
    if (column.every((c) => rest.includes(c))) {
      groups.push({ key: `coluna-${st}`, label: `${TRACK_STATUS_LABEL[st]} (todas as áreas)`, cells: column });
      rest = rest.filter((c) => !column.includes(c));
    }
  }
  return [...groups, ...rest.map((c) => ({ key: c, label: cellLabel(c), cells: [c] }))];
}
