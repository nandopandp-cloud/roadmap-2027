"use client";

import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChartColumn,
  ChevronDown,
  Flag,
  Lightbulb,
  Pencil,
  Plus,
  Quote,
  RefreshCw,
  Rocket,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState, type KeyboardEvent, type ReactNode } from "react";
import { ContextFieldsEditor, PlatformStrategyEditor, ProposalSectionEditor, type ContextFieldSpec } from "@/components/context/editors";
import { MarkdownView } from "@/components/documents/markdown";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { PlatformTile } from "@/components/platforms/platform-icon";
import { StateTag } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { useFirstAvailable } from "@/lib/client/assets";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { CONTEXT_ART, METRIC_TARGET_STATE_LABEL } from "@/lib/domain/labels";
import type { ContextArt, Platform, PlatformStrategy, ProposalSection, StrategyContext } from "@/lib/domain/types";

const TABS: { key: "proposta" | "plataformas"; label: string; icon: LucideIcon }[] = [
  { key: "proposta", label: "Proposta do Roadmap 2027", icon: Target },
  { key: "plataformas", label: "Plataformas e indicadores", icon: ChartColumn },
];
type Tab = (typeof TABS)[number]["key"];

/** Aba escolhida fica na URL (?visao=plataformas), preservando os demais parâmetros. */
function useTab() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const raw = params.get("visao");
  const tab: Tab = TABS.some((t) => t.key === raw) ? (raw as Tab) : "proposta";
  const setTab = (next: Tab, top = false) => {
    const query = new URLSearchParams(params.toString());
    if (next === "proposta") query.delete("visao");
    else query.set("visao", next);
    const qs = query.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    if (top) document.getElementById("contexto-abas")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return { tab, setTab };
}

/** Edição de textos do contexto: quais campos e como aplicá-los. */
interface FieldsEdit {
  title: string;
  fields: ContextFieldSpec[];
  read: (c: StrategyContext) => Record<string, string>;
  apply: (c: StrategyContext, v: Record<string, string>) => StrategyContext;
}

const INTRO_EDIT: FieldsEdit = {
  title: "Editar abertura da proposta",
  fields: [
    { key: "introTitle", label: "Título", kind: "line" },
    { key: "introSummary", label: "Resumo", rows: 4, hint: "Exibido ao lado da ilustração." },
    { key: "intro", label: "Texto completo", rows: 8 },
  ],
  read: (c) => ({ introTitle: c.introTitle, introSummary: c.introSummary, intro: c.intro }),
  apply: (c, v) => ({ ...c, introTitle: v.introTitle, introSummary: v.introSummary, intro: v.intro }),
};

const COMMITMENT_EDIT: FieldsEdit = {
  title: "Editar compromisso",
  fields: [
    { key: "title", label: "Título", kind: "line" },
    { key: "summary", label: "Resumo", rows: 3, hint: "Frase exibida na faixa de destaque." },
    { key: "body", label: "Texto completo", rows: 10 },
  ],
  read: (c) => ({ ...c.commitment }),
  apply: (c, v) => ({ ...c, commitment: { title: v.title, summary: v.summary, body: v.body } }),
};

const PLATFORMS_EDIT: FieldsEdit = {
  title: "Editar apresentação dos direcionadores",
  fields: [
    { key: "platformsSummary", label: "Resumo", rows: 2, hint: "Exibido abaixo do título." },
    { key: "platformsIntro", label: "Texto completo", rows: 8 },
  ],
  read: (c) => ({ platformsSummary: c.platformsSummary, platformsIntro: c.platformsIntro }),
  apply: (c, v) => ({ ...c, platformsSummary: v.platformsSummary, platformsIntro: v.platformsIntro }),
};

const MEASUREMENT_EDIT: FieldsEdit = {
  title: "Editar “Como saberemos se estamos evoluindo?”",
  fields: [{ key: "measurement", label: "Texto", rows: 14 }],
  read: (c) => ({ measurement: c.measurement }),
  apply: (c, v) => ({ ...c, measurement: v.measurement }),
};

/* ───────────────────────────── Peças comuns ───────────────────────────── */

function Art({ art, className, alt = "" }: { art: ContextArt | ""; className?: string; alt?: string }) {
  const src = useFirstAvailable(art ? CONTEXT_ART[art].src : []);
  if (!art || !src) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} aria-hidden={!alt || undefined} className={className} />;
}

/** Botão “Ler texto completo” com conteúdo recolhível e acessível. */
function Disclosure({ label, openLabel = "Recolher texto", tone = "light", children }: { label: string; openLabel?: string; tone?: "light" | "dark"; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg py-1 text-[13.5px] font-bold",
          tone === "dark" ? "text-white/90 hover:text-white" : "text-violet hover:text-[#4a2d91]",
        )}
      >
        {open ? openLabel : label}
        <ChevronDown size={16} aria-hidden className={cn("transition-transform", open && "rotate-180")} />
      </button>
      <div id={id} hidden={!open} className="mt-3">
        {open && children}
      </div>
    </div>
  );
}

/** Ações de editar/remover, exibidas só quando os dados podem ser alterados. */
function ItemActions({ label, onEdit, onRemove, className, tone = "light" }: { label: string; onEdit: () => void; onRemove?: () => void; className?: string; tone?: "light" | "dark" }) {
  const { data } = useRoadmap();
  if (!data.writable) return null;
  const btn = tone === "dark" ? "text-white/80 hover:bg-white/15 hover:text-white" : undefined;
  return (
    <div className={cn("flex shrink-0", className)}>
      <IconButton label={`Editar ${label}`} onClick={onEdit} className={btn}>
        <Pencil size={16} />
      </IconButton>
      {onRemove && (
        <IconButton label={`Remover ${label}`} onClick={onRemove} className={btn}>
          <Trash2 size={16} />
        </IconButton>
      )}
    </div>
  );
}

function useRemove() {
  const { data, saveContext } = useRoadmap();
  const confirm = useConfirm();
  const notify = useToast();
  return async (title: string, message: string, next: Partial<StrategyContext>, done: string) => {
    const ok = await confirm({ title, message, confirmLabel: "Remover", tone: "danger" });
    if (!ok) return;
    try {
      await saveContext({ ...data.context, ...next });
      notify("success", done);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível remover.");
    }
  };
}

function InitiativeLinks({ ids, empty = "Nenhuma iniciativa relacionada." }: { ids: string[]; empty?: string }) {
  const { initiativeById } = useRoadmap();
  const { open } = useInitiativeSelection();
  const items = ids.map((id) => initiativeById(id)).filter((i) => !!i);
  if (!items.length) return <span className="text-[13px] italic text-subtle">{empty}</span>;
  return (
    <span className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <button
          key={i!.id}
          type="button"
          onClick={() => open(i!.id)}
          className="rounded-full bg-brand-soft px-2.5 py-1 text-[12px] font-bold text-brand hover:bg-[#e6dff8]"
          title={i!.title}
        >
          {i!.id} · {i!.title}
        </button>
      ))}
    </span>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">{children}</h4>;
}

/** Faixa “Nosso compromisso para 2027”, ao final das abas principais. */
function CommitmentBanner({ onEdit }: { onEdit: () => void }) {
  const { data } = useRoadmap();
  const c = data.context.commitment;
  if (!c.title && !c.summary && !data.writable) return null;
  return (
    <section aria-label={c.title || "Compromisso"} className="relative mt-8 overflow-hidden rounded-[28px] bg-[linear-gradient(100deg,#4f33c4_0%,#6243d8_45%,#7b55e6_100%)] text-white shadow-[var(--shadow-raised)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/foguete.jpg" alt="" aria-hidden className="pointer-events-none absolute -left-6 top-1/2 hidden h-[190px] w-[190px] -translate-y-1/2 -rotate-12 object-cover mix-blend-screen sm:block" />
      <span aria-hidden className="pointer-events-none absolute -bottom-10 left-6 hidden h-24 w-48 rounded-full bg-white/25 blur-xl sm:block" />
      <div className="relative px-6 py-7 sm:py-8 sm:pl-[200px] sm:pr-16">
        <div className="grid items-center gap-x-8 gap-y-3 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <h2 className="text-[26px] font-black leading-tight sm:text-[30px]">{c.title || "Compromisso ainda não registrado"}</h2>
          {c.summary && <p className="text-[16.5px] leading-relaxed text-white/90 md:border-l md:border-white/35 md:pl-8 md:text-[18px]">{c.summary}</p>}
        </div>
        {c.body && (
          <div className="mt-4">
            <Disclosure label="Ler o compromisso completo" tone="dark">
              <div className="prose-on-dark max-w-[820px] rounded-2xl bg-white/10 p-5">
                <MarkdownView content={c.body} />
              </div>
            </Disclosure>
          </div>
        )}
      </div>
      <ItemActions label="compromisso" tone="dark" className="absolute right-3 top-3" onEdit={onEdit} />
    </section>
  );
}

/* ───────────────────────────── Proposta do Roadmap 2027 ───────────────────────────── */

const STEP_ICONS: LucideIcon[] = [CalendarDays, Flag, RefreshCw, Lightbulb, Rocket, Target];

/** Linha da proposta: número + ilustração | divisor | conteúdo. */
function ProposalRow({ number, art, actions, children }: { number?: number; art: ContextArt | ""; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="group relative flex flex-col gap-4 px-5 py-7 sm:flex-row sm:gap-0 sm:px-8 sm:py-8">
      <div className="flex shrink-0 items-center gap-4 sm:relative sm:h-[150px] sm:w-[210px] sm:justify-end sm:pr-8">
        {number !== undefined && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#efeafd] text-[16px] font-black text-violet sm:absolute sm:left-0 sm:top-0" aria-hidden>
            {String(number).padStart(2, "0")}
          </span>
        )}
        <Art art={art} className="h-20 w-20 object-contain sm:h-[132px] sm:w-[132px]" />
      </div>
      <div className="min-w-0 flex-1 sm:border-l sm:border-[#e3e6f2] sm:pl-8">{children}</div>
      {actions && <div className="absolute right-3 top-3 transition-opacity sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">{actions}</div>}
    </div>
  );
}

function ProposalTab({ onEditFields, onShowPlatforms }: { onEditFields: (edit: FieldsEdit) => void; onShowPlatforms: () => void }) {
  const { data } = useRoadmap();
  const remove = useRemove();
  const [edit, setEdit] = useState<ProposalSection | null | undefined>(undefined);
  const { context } = data;
  const sections = context.proposal;

  return (
    <>
      <div className="overflow-hidden rounded-[28px] border border-[#e6eaf5] bg-surface/90 shadow-[var(--shadow-card)] backdrop-blur">
        <ProposalRow art="alvo" actions={<ItemActions label="abertura da proposta" onEdit={() => onEditFields(INTRO_EDIT)} />}>
          <h2 className="pr-14 text-[26px] font-black leading-tight tracking-[-0.01em] text-navy sm:text-[30px]">{context.introTitle || "Roadmap 2027"}</h2>
          <div className="context-summary mt-2 max-w-[860px]">
            {context.introSummary ? (
              <p className="text-[15.5px] leading-relaxed text-[#2b3163]">{context.introSummary}</p>
            ) : (
              <p className="text-[14.5px] italic text-subtle">Resumo ainda não registrado.</p>
            )}
          </div>
          {context.intro && (
            <div className="mt-2">
              <Disclosure label="Ler texto completo">
                <div className="max-w-[820px] rounded-2xl border border-line bg-[#fbfcff] p-5">
                  <MarkdownView content={context.intro} />
                </div>
              </Disclosure>
            </div>
          )}
        </ProposalRow>

        {sections.map((s, idx) => (
          <div key={s.id} id={`proposta-${s.id}`} className="scroll-mt-6 border-t border-[#eef1f8]">
            <ProposalRow
              number={idx + 1}
              art={s.illustration}
              actions={
                <ItemActions
                  label={s.title}
                  onEdit={() => setEdit(s)}
                  onRemove={() => remove("Remover seção?", `“${s.title}” será removida da proposta.`, { proposal: sections.filter((x) => x.id !== s.id) }, "Seção removida.")}
                />
              }
            >
              <h2 className="pr-14 text-[22px] font-black leading-tight text-navy sm:text-[26px]">{s.title}</h2>
              <div className="context-summary mt-2 max-w-[880px]">
                {s.summary ? <MarkdownView content={s.summary} /> : <p className="text-[14.5px] italic text-subtle">Resumo ainda não registrado — veja o texto completo.</p>}
              </div>

              {s.steps.length > 0 && (
                <ol className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-stretch">
                  {s.steps.map((st, i) => {
                    const Icon = STEP_ICONS[i % STEP_ICONS.length];
                    return (
                      <li key={st.id} className="flex items-stretch gap-3 lg:flex-1">
                        {i > 0 && <ArrowRight size={20} aria-hidden className="hidden shrink-0 self-center text-violet lg:block" />}
                        <div className="flex flex-1 items-start gap-3 rounded-2xl bg-[#f3f0fd] p-4">
                          <Icon size={28} aria-hidden className="mt-0.5 shrink-0 text-violet" strokeWidth={1.8} />
                          <div className="min-w-0">
                            <p className="text-[15px] font-extrabold leading-snug text-navy">{st.title}</p>
                            {st.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{st.description}</p>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="mt-3">
                <Disclosure label="Ler texto completo">
                  <div className="max-w-[820px] rounded-2xl border border-line bg-[#fbfcff] p-5">
                    {s.subtitle && <p className="mb-2 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-violet">{s.subtitle}</p>}
                    <MarkdownView content={s.body} />
                    {s.highlight && (
                      <blockquote className="mt-5 flex gap-3 rounded-2xl bg-[linear-gradient(120deg,#f1ecfb_0%,#eaf1fe_100%)] p-4">
                        <Quote size={20} className="mt-0.5 shrink-0 text-violet" aria-hidden />
                        <p className="text-[15.5px] font-extrabold leading-snug text-navy">{s.highlight}</p>
                      </blockquote>
                    )}
                  </div>
                </Disclosure>
              </div>
            </ProposalRow>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="border-t border-[#eef1f8] p-6">
            <EmptyState compact title="Nenhuma seção na proposta" description="Registre como o time vai pensar, planejar e executar produto em 2027." />
          </div>
        )}
      </div>

      <CommitmentBanner onEdit={() => onEditFields(COMMITMENT_EDIT)} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        {data.writable ? (
          <Button size="sm" icon={<Plus size={15} />} onClick={() => setEdit(null)}>
            Nova seção
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" icon={<ArrowRight size={16} />} onClick={onShowPlatforms}>
          Ver plataformas e indicadores
        </Button>
      </div>

      {edit !== undefined && <ProposalSectionEditor section={edit} onClose={() => setEdit(undefined)} />}
    </>
  );
}

/* ───────────────────────────── Plataformas e indicadores ───────────────────────────── */

/** Números em destaque no card: indicadores e metas marcados como destaque. */
function StrategyHighlights({ strategy, toneFg, toneSoft }: { strategy: PlatformStrategy; toneFg: string; toneSoft: string }) {
  const indicators = strategy.indicators.filter((i) => i.featured);
  const goals = strategy.goals.filter((g) => g.featured);
  if (!indicators.length && !goals.length) return null;
  return (
    <ul className="flex flex-wrap items-stretch gap-x-6 gap-y-4" aria-label="Números em destaque">
      {indicators.map((ind) => (
        <li key={ind.id} className="flex min-w-[96px] max-w-[150px] flex-col justify-center border-[#e3e6f2] text-center [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-6">
          <span className="text-[25px] font-black leading-none tracking-[-0.02em] text-navy">{ind.value}</span>
          <span className="mt-1.5 text-[12.5px] font-semibold leading-snug text-muted">{ind.label}</span>
        </li>
      ))}
      {goals.map((g) => (
        <li key={g.id} className="flex flex-wrap items-center gap-4 border-[#e3e6f2] [&:not(:first-child)]:border-l [&:not(:first-child)]:pl-6">
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 whitespace-nowrap text-[22px] font-black leading-none tracking-[-0.02em] text-navy">
              {g.current && (
                <>
                  <span>
                    <span className="sr-only">De </span>
                    {g.current}
                  </span>
                  <ArrowRight size={18} className="text-violet" aria-hidden />
                </>
              )}
              <span>
                <span className="sr-only">{g.current ? "para " : "Meta: "}</span>
                {g.target}
              </span>
            </p>
            <p className="mt-1.5 max-w-[230px] text-[12.5px] font-semibold leading-snug text-muted">
              {g.label} <span className="text-subtle">(atual → meta)</span>
            </p>
          </div>
          {g.change && (
            <div className="rounded-2xl px-3.5 py-2.5 text-center" style={{ background: toneSoft }}>
              <p className="text-[22px] font-black leading-none" style={{ color: toneFg }}>
                {g.change}
              </p>
              {g.changeLabel && <p className="mt-1 max-w-[120px] text-[12px] font-semibold leading-snug text-ink">{g.changeLabel}</p>}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Detalhamento: todos os indicadores, metas, porquê, resultados e iniciativas. */
function StrategyDetails({ strategy, toneSolid, toneSoft }: { strategy: PlatformStrategy; toneSolid: string; toneSoft: string }) {
  const { data } = useRoadmap();
  const related = data.initiatives.filter((i) => i.platformIds.includes(strategy.platformId)).map((i) => i.id);
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SubHeading>Indicadores atuais</SubHeading>
        {strategy.indicators.length === 0 ? (
          <p className="mt-2 text-[13.5px] italic text-subtle">Nenhum indicador registrado.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
            {strategy.indicators.map((ind) => (
              <li key={ind.id} className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 pt-5">
                <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: toneSolid }} />
                <p className="text-[24px] font-black leading-none tracking-[-0.02em] text-navy">{ind.value}</p>
                <p className="mt-2 text-[13.5px] font-bold leading-snug text-ink">{ind.label}</p>
                {ind.detail && <p className="mt-1 text-[12.5px] leading-snug text-muted">{ind.detail}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <SubHeading>Metas</SubHeading>
        {strategy.goals.length === 0 ? (
          <p className="mt-2 text-[13.5px] italic text-subtle">Nenhuma meta numérica registrada para esta plataforma.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {strategy.goals.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line bg-surface p-4">
                <div className="min-w-[200px] flex-1">
                  <p className="text-[14.5px] font-extrabold text-navy">{g.label}</p>
                  {g.detail && <p className="mt-0.5 text-[13px] leading-snug text-muted">{g.detail}</p>}
                </div>
                <p className="flex items-center gap-2.5 text-[19px] font-black text-navy">
                  {g.current && (
                    <>
                      <span className="text-muted">
                        <span className="sr-only">De </span>
                        {g.current}
                      </span>
                      <ArrowRight size={17} className="text-subtle" aria-hidden />
                    </>
                  )}
                  <span>
                    <span className="sr-only">{g.current ? "para " : "Meta: "}</span>
                    {g.target}
                  </span>
                </p>
                <StateTag tone={g.state === "aprovada" ? "ok" : g.state === "proposta" ? "warn" : "neutral"}>Meta {METRIC_TARGET_STATE_LABEL[g.state].toLowerCase()}</StateTag>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <SubHeading>Por que este direcionador</SubHeading>
          {strategy.statement && <p className="mt-2 text-[16px] font-extrabold leading-snug text-navy">{strategy.statement}</p>}
          <div className="mt-3">
            {strategy.narrative ? <MarkdownView content={strategy.narrative} /> : <p className="text-[13.5px] italic text-subtle">Justificativa ainda não registrada.</p>}
          </div>
        </div>
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-surface p-5">
            <SubHeading>O que queremos alcançar</SubHeading>
            {strategy.outcomes.length === 0 ? (
              <p className="mt-2 text-[13.5px] italic text-subtle">Nenhum resultado registrado.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {strategy.outcomes.map((o, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[14.5px] leading-snug text-ink">
                    <CheckCircle2 size={18} className="mt-px shrink-0 text-teal" aria-hidden />
                    {o}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {strategy.closing && (
            <div className="rounded-2xl border-l-4 p-5" style={{ borderColor: toneSolid, background: toneSoft }}>
              <MarkdownView content={strategy.closing} />
            </div>
          )}
          <div>
            <SubHeading>Iniciativas da plataforma</SubHeading>
            <div className="mt-2">
              <InitiativeLinks ids={related} empty="Nenhuma iniciativa vinculada a esta plataforma." />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyCard({ strategy, platform, onEdit, onRemove }: { strategy: PlatformStrategy; platform: Platform | undefined; onEdit: () => void; onRemove: () => void }) {
  const tone = platform ? ACCENT_TONE[platform.accent] : ACCENT_TONE.indigo;
  const name = platform?.name ?? "Plataforma não encontrada no catálogo";
  const headingId = `plataforma-${strategy.id}-titulo`;
  const keyOutcomes = strategy.keyOutcomes.length ? strategy.keyOutcomes : strategy.outcomes.slice(0, 3);

  return (
    <article
      id={`plataforma-${strategy.id}`}
      aria-labelledby={headingId}
      className="relative scroll-mt-6 overflow-hidden rounded-[26px] border bg-surface shadow-[var(--shadow-card)]"
      style={{ borderColor: tone.soft, background: `linear-gradient(100deg, ${tone.soft} 0%, #ffffff 48%)` }}
    >
      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(300px,0.95fr)_minmax(0,1.25fr)_290px] xl:items-center xl:gap-6">
        <div className="flex items-start gap-4">
          <div
            className="flex h-[92px] w-[92px] shrink-0 items-end justify-center overflow-hidden rounded-[22px] sm:h-[112px] sm:w-[112px]"
            style={{ background: `linear-gradient(160deg, #ffffff 0%, ${tone.soft} 100%)` }}
          >
            {strategy.illustration ? (
              <Art art={strategy.illustration} className="h-full w-full object-cover object-top mix-blend-multiply" />
            ) : platform ? (
              <span className="self-center">
                <PlatformTile platform={platform} size={56} />
              </span>
            ) : null}
          </div>
          <div className="min-w-0">
            <h3 id={headingId} className="text-[24px] font-black leading-tight text-navy">
              {name}
            </h3>
            <p className="mt-1.5 inline-block rounded-2xl px-3 py-1 text-[13px] font-semibold leading-snug" style={{ background: tone.soft, color: tone.fg }}>
              Foco: <strong className="font-black">{strategy.focus}</strong>
            </p>
            {(strategy.summary || strategy.statement) && <p className="mt-2 text-[14px] leading-snug text-[#3b4470]">{strategy.summary || strategy.statement}</p>}
          </div>
        </div>

        <div className="border-[#e3e6f2] xl:border-l xl:pl-6">
          <StrategyHighlights strategy={strategy} toneFg={tone.fg} toneSoft={tone.soft} />
        </div>

        <div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#eef1f8]">
          <h4 className="text-[15px] font-extrabold" style={{ color: tone.fg }}>
            O que queremos alcançar
          </h4>
          {keyOutcomes.length === 0 ? (
            <p className="mt-2 text-[13px] italic text-subtle">Nenhum resultado registrado.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {keyOutcomes.map((o, idx) => (
                <li key={idx} className="flex gap-2 text-[13.5px] leading-snug text-ink">
                  <Check size={17} strokeWidth={3} className="mt-px shrink-0" style={{ color: tone.solid }} aria-hidden />
                  {o}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="relative border-t border-[#eef1f8] bg-white/60 px-5 py-3 sm:px-6">
        <ItemActions label={`direcionador ${name}`} className="absolute right-3 top-1.5" onEdit={onEdit} onRemove={onRemove} />
        <Disclosure label="Ver indicadores, metas e porquês" openLabel="Recolher detalhes">
          <div className="pb-3">
            <StrategyDetails strategy={strategy} toneSolid={tone.solid} toneSoft={tone.soft} />
          </div>
        </Disclosure>
      </div>

    </article>
  );
}

function PlatformsTab({ onEditFields }: { onEditFields: (edit: FieldsEdit) => void }) {
  const { data } = useRoadmap();
  const remove = useRemove();
  const [strategyEdit, setStrategyEdit] = useState<PlatformStrategy | null | undefined>(undefined);
  const { context } = data;
  const strategies = context.platformStrategies;

  return (
    <>
      <section aria-labelledby="direcionadores">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex max-w-3xl items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#efeafd] text-violet" aria-hidden>
              <Target size={28} strokeWidth={2.2} />
            </span>
            <div>
              <h2 id="direcionadores" className="text-[24px] font-black leading-tight text-navy sm:text-[28px]">
                Direcionadores estratégicos do 1º semestre de 2027
              </h2>
              {context.platformsSummary && <p className="mt-1 text-[15.5px] leading-relaxed text-[#3b4470]">{context.platformsSummary}</p>}
              {context.platformsIntro && (
                <div className="mt-1">
                  <Disclosure label="Por que um direcionador por plataforma?">
                    <div className="max-w-[760px] rounded-2xl border border-line bg-surface p-5">
                      <MarkdownView content={context.platformsIntro} />
                    </div>
                  </Disclosure>
                </div>
              )}
            </div>
          </div>
          {data.writable && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => onEditFields(PLATFORMS_EDIT)}>
                Editar texto
              </Button>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setStrategyEdit(null)}>
                Novo direcionador
              </Button>
            </div>
          )}
        </div>

        {strategies.length === 0 ? (
          <EmptyState className="mt-6" title="Nenhum direcionador por plataforma" description="Registre o foco, os números em destaque e as metas de cada plataforma." />
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {strategies.map((s) => {
              const platform = data.platforms.find((p) => p.id === s.platformId);
              return (
                <StrategyCard
                  key={s.id}
                  strategy={s}
                  platform={platform}
                  onEdit={() => setStrategyEdit(s)}
                  onRemove={() =>
                    remove(
                      "Remover direcionador?",
                      `O direcionador “${s.focus}” de ${platform?.name ?? "plataforma"} será removido, com seus indicadores e metas.`,
                      { platformStrategies: strategies.filter((x) => x.id !== s.id) },
                      "Direcionador removido.",
                    )
                  }
                />
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="acompanhamento" className="mt-8 rounded-[26px] border border-[#e6eaf5] bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f6f3] text-teal" aria-hidden>
              <ChartColumn size={22} />
            </span>
            <h2 id="acompanhamento" className="text-[21px] font-black text-navy">
              Como saberemos se estamos evoluindo?
            </h2>
          </div>
          <ItemActions label="como saberemos se estamos evoluindo" onEdit={() => onEditFields(MEASUREMENT_EDIT)} />
        </div>
        <div className="mt-4 max-w-[900px]">
          {context.measurement ? <MarkdownView content={context.measurement} /> : <p className="text-[14px] italic text-subtle">Critérios de acompanhamento ainda não registrados.</p>}
        </div>
      </section>

      <CommitmentBanner onEdit={() => onEditFields(COMMITMENT_EDIT)} />

      {strategyEdit !== undefined && <PlatformStrategyEditor strategy={strategyEdit} onClose={() => setStrategyEdit(undefined)} />}
    </>
  );
}

/* ───────────────────────────── Página ───────────────────────────── */

export function ContextView() {
  const { load, reload } = useRoadmap();
  const { tab, setTab } = useTab();
  const [fieldsEdit, setFieldsEdit] = useState<FieldsEdit | null>(null);

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = TABS.findIndex((t) => t.key === tab);
    const next = TABS[(idx + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length].key;
    setTab(next);
    document.getElementById(`contexto-aba-${next}`)?.focus();
  };

  return (
    <>
      <PageHero crumbs={[{ label: "Contexto" }]} title="Contexto estratégico" subtitle="A direção que orienta as iniciativas de Produto da Jovens Gênios em 2027.">
        <div
          id="contexto-abas"
          role="tablist"
          aria-label="Conteúdo do contexto"
          className="-mx-1 mt-6 flex max-w-full scroll-mt-4 gap-2 overflow-x-auto p-1 [scrollbar-width:none]"
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`contexto-aba-${key}`}
              role="tab"
              type="button"
              aria-selected={tab === key}
              aria-controls="contexto-painel"
              tabIndex={tab === key ? 0 : -1}
              onClick={() => setTab(key)}
              onKeyDown={onTabKey}
              className={cn(
                "inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl px-5 text-[14.5px] font-bold transition-colors",
                tab === key
                  ? "bg-violet text-white shadow-[0_8px_20px_rgba(96,69,216,0.32)]"
                  : "border border-[#e3e9f4] bg-surface/90 text-[#3b4470] shadow-[0_2px_10px_rgba(23,27,77,0.05)] hover:text-navy",
              )}
            >
              <Icon size={18} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </PageHero>
      <PageContainer className="pb-16 pt-2">
        <div id="contexto-painel" role="tabpanel" aria-labelledby={`contexto-aba-${tab}`}>
          {load.status === "loading" && (
            <div className="flex flex-col gap-4" aria-busy="true">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          )}
          {load.status === "error" && <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />}
          {load.status === "ready" &&
            (tab === "proposta" ? (
              <ProposalTab onEditFields={setFieldsEdit} onShowPlatforms={() => setTab("plataformas", true)} />
            ) : (
              <PlatformsTab onEditFields={setFieldsEdit} />
            ))}
        </div>

        {fieldsEdit && (
          <ContextFieldsEditor title={fieldsEdit.title} fields={fieldsEdit.fields} read={fieldsEdit.read} apply={fieldsEdit.apply} onClose={() => setFieldsEdit(null)} />
        )}
      </PageContainer>
    </>
  );
}
