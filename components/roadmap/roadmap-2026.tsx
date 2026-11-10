"use client";

import { CircleDashed, ExternalLink, Layers } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { Badge } from "@/components/ui/badges";
import { Skeleton } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { ACCENT_TONE, PHASE_2026_TONE, SITUATION_2026_TONE, TRANSVERSAL_TONE } from "@/lib/client/tones";
import { ROADMAP_2026_PHASES } from "@/lib/domain/constants";
import {
  CYCLE_2026_MONTHS,
  CYCLE_2026_QUARTERS,
  PHASE_2026_LABEL,
  PHASE_2026_SHORT,
  SITUATION_2026_LABEL,
  WAVE_2026_LABEL,
  cycle2026DatePosition,
  deliveryQuarter,
  segmentPeriod,
  situationOf,
  weekPosition,
} from "@/lib/domain/roadmap-2026";
import type { Platform, Roadmap2026, Roadmap2026Item } from "@/lib/domain/types";

const formatDate = (iso: string) => iso.split("-").reverse().join("/");

/** Pessoas e situação das frentes, como escritas na planilha. */
function people(item: Roadmap2026Item) {
  return [
    ["Design", item.design],
    ["Engenharia", item.engineering],
    ["QA", item.qa],
  ].filter(([, value]) => value) as [string, string][];
}

/** Squad da planilha com o ícone e a cor da plataforma correspondente. */
function SquadPill({ item, platforms }: { item: Roadmap2026Item; platforms: Platform[] }) {
  const platform = item.platformId ? platforms.find((p) => p.id === item.platformId) : undefined;
  if (!platform) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: TRANSVERSAL_TONE.bg, color: TRANSVERSAL_TONE.fg }}>
        <Layers size={12} aria-hidden />
        {item.squad}
      </span>
    );
  }
  const Glyph = PLATFORM_GLYPHS[platform.icon];
  const tone = ACCENT_TONE[platform.accent];
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-bold" style={{ background: tone.soft, color: tone.fg }}>
      <Glyph size={12} aria-hidden />
      {platform.name}
    </span>
  );
}

function ItemBadges({ item }: { item: Roadmap2026Item }) {
  const situation = situationOf(item);
  return (
    <span className="flex flex-wrap gap-1.5">
      <Badge tone={SITUATION_2026_TONE[situation]} dot size="sm">
        {SITUATION_2026_LABEL[situation]}
      </Badge>
      {item.backlog && (
        <Badge tone={{ bg: "#F3F1EE", fg: "#665947", dot: "#A8987F" }} size="sm">
          Backlog
        </Badge>
      )}
      {item.pricing && (
        <Badge tone={{ bg: "#FFF8DB", fg: "#735600", dot: "#E0A800" }} size="sm">
          Engenharia a precificar
        </Badge>
      )}
    </span>
  );
}

/** Fonte dos dados: planilha do time (link real) e data da importação. */
export function Roadmap2026Source({ source }: { source: Roadmap2026["source"] }) {
  return (
    <span className="flex flex-wrap items-center gap-x-1.5">
      Fonte:
      <a href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-brand underline-offset-2 hover:underline">
        planilha “{source.title}”, aba {source.sheet}
        <ExternalLink size={12} aria-hidden />
      </a>
      <span>· importada em {formatDate(source.importedAt)} · somente consulta</span>
    </span>
  );
}

export function Roadmap2026Legend() {
  return (
    <>
      {ROADMAP_2026_PHASES.map((phase) => (
        <span key={phase} className="flex items-center gap-1.5">
          <span aria-hidden className="h-2.5 w-5 rounded-[3px]" style={{ background: PHASE_2026_TONE[phase].solid }} />
          {phase === "indefinido" ? "Sem legenda (cinza na planilha)" : PHASE_2026_LABEL[phase]}
        </span>
      ))}
    </>
  );
}

/* ---------------------------------- Cards ---------------------------------- */

function Card2026({ item, platforms }: { item: Roadmap2026Item; platforms: Platform[] }) {
  const who = people(item);
  return (
    <article className="flex w-full flex-col gap-2.5 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-card)]">
      <span className="flex flex-wrap items-center justify-between gap-2">
        <SquadPill item={item} platforms={platforms} />
        {item.wave && <span className="text-[11.5px] font-extrabold text-subtle">{WAVE_2026_LABEL[item.wave]}</span>}
      </span>
      <h3 className="text-[15.5px] font-extrabold leading-snug text-navy">{item.title}</h3>
      <ItemBadges item={item} />
      {who.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-0.5 text-[12.5px]">
          {who.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-bold text-muted">{label}</dt>
              <dd className="truncate text-ink" title={value}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {item.segments.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-line pt-2">
          {item.segments.map((s) => (
            <li key={s.start} className="flex items-start gap-1.5 text-[12.5px] text-muted">
              <span aria-hidden className="mt-[5px] h-2 w-2 shrink-0 rounded-[2px]" style={{ background: PHASE_2026_TONE[s.phase].solid }} />
              <span>
                <span className="font-bold" style={{ color: PHASE_2026_TONE[s.phase].fg }}>
                  {PHASE_2026_SHORT[s.phase]}
                </span>{" "}
                · {segmentPeriod(s)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {item.weeks !== null && (
        <span className="text-[12px] font-semibold text-subtle">
          Estimativa na planilha: {String(item.weeks).replace(".", ",")} {item.weeks === 1 ? "semana" : "semanas"}
        </span>
      )}
    </article>
  );
}

/** Cards por trimestre de entrega (onde termina a última semana projetada). */
export function Roadmap2026Board({ items, platforms, loading }: { items: Roadmap2026Item[]; platforms: Platform[]; loading: boolean }) {
  const unscheduled = items.filter((i) => deliveryQuarter(i) === null);
  return (
    <>
      <div className="@container mt-6">
        <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @5xl:grid-cols-4">
          {CYCLE_2026_QUARTERS.map((q) => {
            const cards = items.filter((i) => deliveryQuarter(i) === q.key);
            return (
              <section
                key={q.key}
                aria-labelledby={`col-${q.key}`}
                className="flex flex-col rounded-[24px] border border-[#e3e9f4] bg-white/70 p-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)] backdrop-blur"
              >
                <header className="flex items-baseline justify-between gap-2 px-2 pb-3 pt-1">
                  <div>
                    <h2 id={`col-${q.key}`} className="text-[18px] font-black text-navy">
                      {q.label}
                    </h2>
                    <p className="text-[12.5px] font-semibold text-muted">{q.months}</p>
                  </div>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-brand">{plural(cards.length, "entrega", "entregas")}</span>
                </header>
                {loading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <ul className="flex flex-col gap-3">
                    {cards.map((item) => (
                      <li key={item.id}>
                        <Card2026 item={item} platforms={platforms} />
                      </li>
                    ))}
                    {cards.length === 0 && (
                      <li className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-[13px] text-muted">
                        <CircleDashed size={20} aria-hidden />
                        Nenhuma entrega prevista em {q.label}.
                      </li>
                    )}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {!loading && unscheduled.length > 0 && (
        <section aria-labelledby="sem-semanas-2026" className="mt-8 p-3">
          <h2 id="sem-semanas-2026" className="px-1 text-[18px] font-black text-navy">
            Sem semanas projetadas
          </h2>
          <p className="px-1 text-[13px] text-muted">Linhas da planilha ainda sem semanas coloridas na linha do tempo.</p>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.map((item) => (
              <li key={item.id}>
                <Card2026 item={item} platforms={platforms} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ---------------------------------- Gantt ---------------------------------- */

const ROW = "grid grid-cols-[200px_minmax(0,1fr)] sm:grid-cols-[290px_minmax(0,1fr)]";

/** Semanas (bem claras), meses e, mais fortes, as divisões entre trimestres (a cada 3 meses = 30%). */
const TIMELINE_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, #d5deee 1px, transparent 1px), linear-gradient(to right, #e6ebf5 1px, transparent 1px), linear-gradient(to right, #f3f5fa 1px, transparent 1px)",
  backgroundSize: "30% 100%, 10% 100%, 2.5% 100%",
};

function TodayLine() {
  const left = cycle2026DatePosition(new Date());
  if (left === null) return null;
  return <span aria-hidden className="absolute inset-y-0 w-0.5 bg-action/70" style={{ left: `${left}%` }} />;
}

function GanttRow2026({ item, timelineWidth }: { item: Roadmap2026Item; timelineWidth: number }) {
  const who = people(item);
  const situation = situationOf(item);
  return (
    <li className={cn(ROW, "border-t border-line")}>
      <div className="sticky left-0 z-10 flex flex-col justify-center gap-0.5 border-r border-line bg-surface px-4 py-2.5">
        <span className="line-clamp-2 text-[13.5px] font-extrabold leading-snug text-navy" title={item.title}>
          {item.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-1.5 text-[11.5px] font-semibold text-muted">
          <span className="flex items-center gap-1" style={{ color: SITUATION_2026_TONE[situation].fg }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: SITUATION_2026_TONE[situation].dot }} />
            {SITUATION_2026_LABEL[situation]}
          </span>
          {item.wave && <span>· {WAVE_2026_LABEL[item.wave]}</span>}
          {item.backlog && <span>· Backlog</span>}
        </span>
        {who.length > 0 && (
          <span className="truncate text-[11.5px] text-subtle" title={who.map(([l, v]) => `${l}: ${v}`).join(" · ")}>
            {who.map(([l, v]) => `${l}: ${v}`).join(" · ")}
          </span>
        )}
      </div>
      <div className="relative min-h-[64px]" style={TIMELINE_BG}>
        <TodayLine />
        {item.segments.length === 0 ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12.5px] font-semibold italic text-subtle">Sem semanas projetadas na planilha</span>
        ) : (
          <>
            <span className="sr-only">{item.segments.map((s) => `${PHASE_2026_LABEL[s.phase]}: ${segmentPeriod(s)}`).join(". ")}</span>
            {item.segments.map((s) => {
              const tone = PHASE_2026_TONE[s.phase];
              const width = weekPosition(s.weeks);
              const label = PHASE_2026_SHORT[s.phase];
              const fits = (width / 100) * timelineWidth >= label.length * 7 + 16;
              return (
                <span
                  key={s.start}
                  aria-hidden
                  title={`${PHASE_2026_LABEL[s.phase]}: ${segmentPeriod(s)}`}
                  className="absolute top-1/2 flex h-[24px] -translate-y-1/2 items-center overflow-hidden rounded-md text-[11.5px] font-extrabold text-white shadow-[0_2px_6px_rgba(23,27,77,0.14)]"
                  style={{ left: `calc(${weekPosition(s.start)}% + 1px)`, width: `calc(${width}% - 2px)`, background: tone.solid }}
                >
                  {fits && <span className="truncate px-2">{label}</span>}
                </span>
              );
            })}
          </>
        )}
      </div>
    </li>
  );
}

/** Linha do tempo de julho/2026 a abril/2027, semana a semana, agrupada por squad. */
export function Roadmap2026Gantt({
  items,
  platforms,
  loading,
  fill = false,
}: {
  items: Roadmap2026Item[];
  platforms: Platform[];
  loading: boolean;
  /** Tela cheia: rola por dentro e fixa o cabeçalho dos meses. */
  fill?: boolean;
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineWidth, setTimelineWidth] = useState(0);
  useEffect(() => {
    const el = timelineRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setTimelineWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Grupos na ordem da planilha.
  const groups: { squad: string; items: Roadmap2026Item[] }[] = [];
  for (const item of items) {
    const group = groups.find((g) => g.squad === item.squad);
    if (group) group.items.push(item);
    else groups.push({ squad: item.squad, items: [item] });
  }
  const groupName = (squad: string, sample: Roadmap2026Item) =>
    (sample.platformId && platforms.find((p) => p.id === sample.platformId)?.name) || squad;

  return (
    <div
      className={cn(
        "rounded-[24px] border border-[#e3e9f4] bg-surface shadow-[0_2px_10px_rgba(23,27,77,0.04)]",
        fill ? "min-h-0 overflow-auto overscroll-contain [scrollbar-width:thin]" : "mt-6 overflow-x-auto",
      )}
    >
      <div className="min-w-[960px]">
        <div className={cn(ROW, "bg-[#fbfcff]", fill && "sticky top-0 z-20 shadow-[0_1px_0_#e3e9f4]")}>
          <div className="sticky left-0 z-10 flex items-end border-r border-line bg-[#fbfcff] px-4 pb-2 text-[12.5px] font-extrabold text-muted">Item da planilha</div>
          <div ref={timelineRef}>
            <div className="grid grid-cols-[3fr_3fr_3fr_1fr]">
              {CYCLE_2026_QUARTERS.map((q) => (
                <div key={q.key} className="truncate border-l border-[#d5deee] px-2 pb-1 pt-3 text-[14px] font-black text-navy first:border-l-0 sm:px-3" title={`${q.label} · ${q.months}`}>
                  {q.label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-10">
              {CYCLE_2026_MONTHS.map((m, idx) => (
                <div key={m.short} className={cn("px-2 pb-2 text-[11.5px] font-bold text-subtle", idx % 3 === 0 ? "border-l border-[#d5deee] first:border-l-0" : "border-l border-[#edf1f8]")}>
                  {m.short}
                  {(idx === 0 || m.month === 1) && <span className="font-semibold text-[#9aa5c2]"> {String(m.year).slice(2)}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2 border-t border-line p-4">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : items.length === 0 ? (
          <p className="border-t border-line px-4 py-10 text-center text-[13.5px] text-muted">Nenhum item para exibir com o filtro atual.</p>
        ) : (
          groups.map((g) => (
            <section key={g.squad} aria-label={groupName(g.squad, g.items[0])}>
              <h3 className="sticky left-0 border-t border-line bg-[#fbfcff] px-4 py-2 text-[12.5px] font-extrabold text-muted">
                {groupName(g.squad, g.items[0])} · {plural(g.items.length, "item", "itens")}
              </h3>
              <ul>
                {g.items.map((item) => (
                  <GanttRow2026 key={item.id} item={item} timelineWidth={timelineWidth} />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
