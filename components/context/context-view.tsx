"use client";

import { ArrowRight, CheckCircle2, Compass, Pencil, Plus, Quote, Target, Trash2, type LucideIcon } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ContextTextEditor, PlatformEditor, PlatformStrategyEditor, ProblemEditor, ProposalSectionEditor } from "@/components/context/editors";
import { MarkdownView } from "@/components/documents/markdown";
import { PageContainer, PageHero } from "@/components/layout/page-header";
import { PlatformTile } from "@/components/platforms/platform-icon";
import { StateTag, ValidationBadge } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { PROBLEM_VALIDATION } from "@/lib/domain/constants";
import { METRIC_TARGET_STATE_LABEL, PROBLEM_VALIDATION_LABEL } from "@/lib/domain/labels";
import type { Platform, PlatformStrategy, ProblemValidation, ProposalSection, StructuralProblem } from "@/lib/domain/types";

const TABS: { key: "proposta" | "plataformas"; label: string; description: string; icon: LucideIcon }[] = [
  {
    key: "proposta",
    label: "Proposta do Roadmap 2027",
    description: "A nova forma de pensar, planejar e executar produto em 2027.",
    icon: Compass,
  },
  {
    key: "plataformas",
    label: "Plataformas e indicadores",
    description: "Os números, os porquês e as metas que orientam cada plataforma no primeiro semestre.",
    icon: Target,
  },
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
    if (top) window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return { tab, setTab };
}

function Section({ id, title, description, action, children }: { id: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12 scroll-mt-6">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-[22px] font-black text-navy">
            {title}
          </h2>
          {description && <div className="mt-1 max-w-3xl text-[14.5px] text-muted">{description}</div>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">{children}</h4>;
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

/** Ações de editar/remover, exibidas só quando os dados podem ser alterados. */
function ItemActions({ label, onEdit, onRemove, className }: { label: string; onEdit: () => void; onRemove?: () => void; className?: string }) {
  const { data } = useRoadmap();
  if (!data.writable) return null;
  return (
    <div className={cn("flex shrink-0", className)}>
      <IconButton label={`Editar ${label}`} onClick={onEdit}>
        <Pencil size={16} />
      </IconButton>
      {onRemove && (
        <IconButton label={`Remover ${label}`} onClick={onRemove}>
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
  return async (title: string, message: string, next: Partial<typeof data.context>, done: string) => {
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

type TextEdit = { field: "intro" | "platformsIntro" | "measurement"; title: string };

/* ───────────────────────────── Proposta do Roadmap 2027 ───────────────────────────── */

function IntroBanner({ onEdit }: { onEdit: () => void }) {
  const { data } = useRoadmap();
  return (
    <div className="relative overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#2a1f86_0%,#3b2a9e_55%,#5938a6_100%)] p-7 text-white shadow-[var(--shadow-raised)] sm:p-9">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/foguete.jpg" alt="" aria-hidden className="pointer-events-none absolute -right-4 -top-4 hidden h-48 w-48 rotate-6 rounded-[36px] object-cover opacity-40 mix-blend-screen md:block" />
      <div className="relative max-w-3xl">
        <p className="text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-white/70">Contexto estratégico e direcionadores de produto</p>
        {data.context.intro ? (
          data.context.intro.split(/\n{2,}/).map((p, idx) => (
            <p key={idx} className={cn("leading-relaxed text-white/90", idx === 0 ? "mt-3 text-[19px] font-bold text-white" : "mt-3 text-[16px]")}>
              {p}
            </p>
          ))
        ) : (
          <p className="mt-3 text-[16px] italic text-white/75">Ainda não há texto introdutório.</p>
        )}
      </div>
      {data.writable && (
        <Button size="sm" className="relative mt-5 border-white/30 bg-white/10 text-white hover:bg-white/20" variant="secondary" icon={<Pencil size={14} />} onClick={onEdit}>
          Editar texto
        </Button>
      )}
    </div>
  );
}

function ProposalTab({ onEditText, onShowPlatforms }: { onEditText: (edit: TextEdit) => void; onShowPlatforms: () => void }) {
  const { data } = useRoadmap();
  const remove = useRemove();
  const [edit, setEdit] = useState<ProposalSection | null | undefined>(undefined);
  const sections = data.context.proposal;

  return (
    <>
      <IntroBanner onEdit={() => onEditText({ field: "intro", title: "Editar texto introdutório" })} />

      {sections.length > 0 && (
        <nav aria-label="Seções da proposta" className="mt-8 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[13px] font-bold text-muted">Nesta proposta:</span>
          {sections.map((s, idx) => (
            <a key={s.id} href={`#proposta-${s.id}`} className="rounded-full border border-line bg-surface px-3 py-1.5 text-[13px] font-bold text-ink hover:border-violet hover:text-violet">
              {idx + 1}. {s.title}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {sections.length === 0 && (
          <EmptyState
            title="Nenhuma seção na proposta"
            description="Registre aqui como o time vai pensar, planejar e executar produto em 2027."
            action={data.writable ? <Button variant="primary" icon={<Plus size={16} />} onClick={() => setEdit(null)}>Nova seção</Button> : undefined}
          />
        )}
        {sections.map((s, idx) => (
          <article key={s.id} id={`proposta-${s.id}`} aria-labelledby={`proposta-${s.id}-titulo`} className="scroll-mt-6 rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-9">
            <header className="relative flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-[17px] font-black text-brand" aria-hidden>
                {String(idx + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1 pr-16">
                {s.subtitle && <p className="text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-violet">{s.subtitle}</p>}
                <h2 id={`proposta-${s.id}-titulo`} className="mt-0.5 text-[21px] font-black leading-tight text-navy sm:text-[24px]">
                  {s.title}
                </h2>
              </div>
              <ItemActions
                label={s.title}
                className="absolute -right-2 -top-1"
                onEdit={() => setEdit(s)}
                onRemove={() =>
                  remove("Remover seção?", `“${s.title}” será removida da proposta.`, { proposal: sections.filter((x) => x.id !== s.id) }, "Seção removida.")
                }
              />
            </header>
            <div className="mt-5 max-w-[780px] sm:pl-[60px]">
              <MarkdownView content={s.body} />
              {s.highlight && (
                <blockquote className="mt-6 flex gap-3 rounded-2xl bg-[linear-gradient(120deg,#f1ecfb_0%,#eaf1fe_100%)] p-5">
                  <Quote size={22} className="mt-0.5 shrink-0 text-violet" aria-hidden />
                  <p className="text-[16.5px] font-extrabold leading-snug text-navy">{s.highlight}</p>
                </blockquote>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        {data.writable && sections.length > 0 ? (
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

function StrategyArticle({ strategy, platform, onEdit, onRemove }: { strategy: PlatformStrategy; platform: Platform | undefined; onEdit: () => void; onRemove: () => void }) {
  const { data } = useRoadmap();
  const tone = platform ? ACCENT_TONE[platform.accent] : ACCENT_TONE.indigo;
  const name = platform?.name ?? "Plataforma não encontrada no catálogo";
  const related = data.initiatives.filter((i) => i.platformIds.includes(strategy.platformId)).map((i) => i.id);
  const headingId = `plataforma-${strategy.id}-titulo`;

  return (
    <article id={`plataforma-${strategy.id}`} aria-labelledby={headingId} className="scroll-mt-6 overflow-hidden rounded-3xl border border-line bg-surface shadow-[var(--shadow-card)]">
      <header className="relative flex flex-col items-start gap-3 p-6 sm:flex-row sm:gap-4 sm:p-8" style={{ background: `linear-gradient(120deg, ${tone.soft} 0%, #ffffff 85%)` }}>
        {platform ? <PlatformTile platform={platform} size={56} /> : null}
        <div className="min-w-0 flex-1 sm:pr-20">
          <p className="text-[12.5px] font-extrabold uppercase tracking-[0.08em]" style={{ color: tone.fg }}>
            {name} · Direcionador estratégico
          </p>
          <h3 id={headingId} className="mt-0.5 text-[24px] font-black leading-tight text-navy sm:text-[26px]">
            {strategy.focus}
          </h3>
          {strategy.statement && <p className="mt-1.5 text-[16px] font-bold leading-snug text-[#4a5680]">{strategy.statement}</p>}
        </div>
        <ItemActions label={`direcionador ${name}`} className="absolute right-4 top-4 sm:right-6 sm:top-6" onEdit={onEdit} onRemove={onRemove} />
      </header>

      <div className="flex flex-col gap-8 p-6 pt-2 sm:p-8 sm:pt-2">
        <div>
          <SubHeading>Indicadores atuais</SubHeading>
          {strategy.indicators.length === 0 ? (
            <p className="mt-2 text-[13.5px] italic text-subtle">Nenhum indicador registrado.</p>
          ) : (
            <ul className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-3">
              {strategy.indicators.map((ind) => (
                <li key={ind.id} className="relative overflow-hidden rounded-2xl border border-line bg-[#fafbfe] p-4 pt-5">
                  <span aria-hidden className="absolute inset-x-0 top-0 h-1" style={{ background: tone.solid }} />
                  <p className="text-[24px] font-black leading-none tracking-[-0.02em] text-navy sm:text-[28px]">{ind.value}</p>
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
                <li key={g.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-line p-4">
                  <div className="min-w-[200px] flex-1">
                    <p className="text-[14.5px] font-extrabold text-navy">{g.label}</p>
                    {g.detail && <p className="mt-0.5 text-[13px] leading-snug text-muted">{g.detail}</p>}
                  </div>
                  <p className="flex items-center gap-2.5 text-[20px] font-black text-navy">
                    {g.current && (
                      <>
                        <span className="text-muted">
                          <span className="sr-only">De </span>
                          {g.current}
                        </span>
                        <ArrowRight size={18} className="text-subtle" aria-hidden />
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
            <div className="mt-3">
              {strategy.narrative ? <MarkdownView content={strategy.narrative} /> : <p className="text-[13.5px] italic text-subtle">Justificativa ainda não registrada.</p>}
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl bg-[#f7f9fd] p-5">
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
              <div className="rounded-2xl border-l-4 p-5" style={{ borderColor: tone.solid, background: tone.soft }}>
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
    </article>
  );
}

function PlatformsTab({ onEditText }: { onEditText: (edit: TextEdit) => void }) {
  const { data, removePlatform } = useRoadmap();
  const confirm = useConfirm();
  const notify = useToast();
  const remove = useRemove();
  const { open } = useInitiativeSelection();
  const [strategyEdit, setStrategyEdit] = useState<PlatformStrategy | null | undefined>(undefined);
  const [problemEdit, setProblemEdit] = useState<StructuralProblem | null | undefined>(undefined);
  const [platformEdit, setPlatformEdit] = useState<Platform | null | undefined>(undefined);
  const [validationFilter, setValidationFilter] = useState<ProblemValidation | "todos">("todos");
  const strategies = data.context.platformStrategies;
  const platformOf = (s: PlatformStrategy) => data.platforms.find((p) => p.id === s.platformId);
  const problems = data.context.problems.filter((p) => validationFilter === "todos" || p.validation === validationFilter);

  async function deletePlatform(p: Platform) {
    const ok = await confirm({ title: "Excluir plataforma?", message: `“${p.name}” será removida do catálogo.`, confirmLabel: "Excluir", tone: "danger" });
    if (!ok) return;
    try {
      await removePlatform(p.id);
      notify("success", "Plataforma excluída.");
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível excluir.");
    }
  }

  return (
    <>
      <section aria-labelledby="direcionadores" className="mt-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-3xl">
            <h2 id="direcionadores" className="text-[26px] font-black leading-tight text-navy">
              Direcionadores estratégicos do primeiro semestre
            </h2>
            <div className="mt-2 text-[15px] leading-relaxed text-muted [&_p]:text-muted">
              {data.context.platformsIntro ? <MarkdownView content={data.context.platformsIntro} /> : <p className="italic text-subtle">Texto de apresentação ainda não registrado.</p>}
            </div>
          </div>
          {data.writable && (
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => onEditText({ field: "platformsIntro", title: "Editar apresentação dos direcionadores" })}>
                Editar texto
              </Button>
              <Button size="sm" icon={<Plus size={15} />} onClick={() => setStrategyEdit(null)}>
                Novo direcionador
              </Button>
            </div>
          )}
        </div>

        {strategies.length === 0 ? (
          <EmptyState className="mt-6" title="Nenhum direcionador por plataforma" description="Registre o direcionador, os indicadores atuais e as metas de cada plataforma." />
        ) : (
          <>
            <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3" aria-label="Resumo por plataforma">
              {strategies.map((s) => {
                const platform = platformOf(s);
                return (
                  <li key={s.id}>
                    <a
                      href={`#plataforma-${s.id}`}
                      className="flex h-full flex-col gap-3 rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)] transition-colors hover:border-violet"
                    >
                      <span className="flex items-center gap-3">
                        {platform && <PlatformTile platform={platform} size={40} />}
                        <span className="text-[15px] font-extrabold text-navy">{platform?.name ?? "Plataforma não encontrada"}</span>
                      </span>
                      <span className="text-[17px] font-black leading-snug text-navy">{s.focus}</span>
                      {s.statement && <span className="text-[13.5px] leading-snug text-muted">{s.statement}</span>}
                      <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-bold text-violet">
                        Ver indicadores e porquês <ArrowRight size={14} aria-hidden />
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 flex flex-col gap-8">
              {strategies.map((s) => {
                const platform = platformOf(s);
                return (
                  <StrategyArticle
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
          </>
        )}
      </section>

      <Section
        id="acompanhamento"
        title="Como saberemos se estamos evoluindo?"
        action={
          data.writable ? (
            <Button size="sm" variant="ghost" icon={<Pencil size={14} />} onClick={() => onEditText({ field: "measurement", title: "Editar “Como saberemos se estamos evoluindo?”" })}>
              Editar texto
            </Button>
          ) : undefined
        }
      >
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="max-w-[860px]">
            {data.context.measurement ? <MarkdownView content={data.context.measurement} /> : <p className="text-[14px] italic text-subtle">Critérios de acompanhamento ainda não registrados.</p>}
          </div>
        </div>
      </Section>

      <Section
        id="problemas"
        title="Problemas estruturais"
        description="Problemas recorrentes que podem ser associados às iniciativas. Problemas confirmados têm evidências; hipóteses ainda precisam de validação."
        action={data.writable ? <Button size="sm" icon={<Plus size={15} />} onClick={() => setProblemEdit(null)}>Novo problema</Button> : undefined}
      >
        <div role="radiogroup" aria-label="Filtrar por validação" className="mb-4 flex flex-wrap gap-2">
          {(["todos", ...PROBLEM_VALIDATION] as const).map((v) => {
            const count = v === "todos" ? data.context.problems.length : data.context.problems.filter((p) => p.validation === v).length;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={validationFilter === v}
                onClick={() => setValidationFilter(v)}
                className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors", validationFilter === v ? "bg-navy text-white" : "bg-surface text-muted hover:text-ink")}
              >
                {v === "todos" ? "Todos" : PROBLEM_VALIDATION_LABEL[v]} ({count})
              </button>
            );
          })}
        </div>
        {problems.length === 0 ? (
          <EmptyState compact title={data.context.problems.length ? "Nenhum problema neste filtro" : "Nenhum problema estrutural cadastrado"} />
        ) : (
          <ul className="flex flex-col gap-4">
            {problems.map((p) => (
              <li key={p.id} id={`problema-${p.id}`} className="scroll-mt-6 rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-[17px] font-extrabold text-navy">{p.name}</h3>
                      <ValidationBadge validation={p.validation} />
                    </div>
                    <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{p.description}</p>
                  </div>
                  <ItemActions
                    label={p.name}
                    className="-mr-2 -mt-1"
                    onEdit={() => setProblemEdit(p)}
                    onRemove={() =>
                      remove(
                        "Remover problema estrutural?",
                        `“${p.name}” será removido. As iniciativas relacionadas não são afetadas.`,
                        { problems: data.context.problems.filter((x) => x.id !== p.id) },
                        "Problema removido.",
                      )
                    }
                  />
                </div>
                <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 border-t border-line pt-4 text-[14px] md:grid-cols-2">
                  <div>
                    <dt className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">Público afetado</dt>
                    <dd className="mt-1 text-ink">{p.audience || <span className="italic text-subtle">Não informado.</span>}</dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">Consequências</dt>
                    <dd className="mt-1 text-ink">{p.consequences || <span className="italic text-subtle">Não informadas.</span>}</dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">Evidências disponíveis</dt>
                    <dd className="mt-1">
                      {p.evidence.length ? (
                        <ul className="flex list-disc flex-col gap-1 pl-4 text-ink marker:text-violet">
                          {p.evidence.map((e, idx) => (
                            <li key={idx}>{e}</li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-subtle">Nenhuma evidência registrada.</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12.5px] font-extrabold uppercase tracking-wide text-subtle">Iniciativas relacionadas</dt>
                    <dd className="mt-1.5">
                      <InitiativeLinks ids={p.relatedInitiativeIds} />
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        id="plataformas"
        title="Catálogo de plataformas"
        description="Referência editável do ecossistema. Plataformas vinculadas a iniciativas ou a um direcionador não podem ser excluídas."
        action={data.writable ? <Button size="sm" icon={<Plus size={15} />} onClick={() => setPlatformEdit(null)}>Nova plataforma</Button> : undefined}
      >
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.platforms.map((p) => {
            const related = data.initiatives.filter((i) => i.platformIds.includes(p.id));
            return (
              <li key={p.id} className="flex flex-col rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3.5">
                  <PlatformTile platform={p} size={48} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-extrabold text-navy">{p.name}</h3>
                    <p className="mt-0.5 text-[13px] leading-snug text-muted">{p.description || "Sem descrição."}</p>
                  </div>
                  <ItemActions label={p.name} className="-mr-2 -mt-1" onEdit={() => setPlatformEdit(p)} onRemove={() => deletePlatform(p)} />
                </div>
                <p className="mt-3 text-[12.5px] text-muted">
                  <span className="font-bold text-ink">Responsável: </span>
                  {p.owner || "não definido"}
                </p>
                <div className="mt-3 border-t border-line pt-3">
                  {related.length === 0 ? (
                    <p className="text-[12.5px] italic text-subtle">Nenhuma iniciativa vinculada.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {related.map((i) => (
                        <button
                          key={i.id}
                          type="button"
                          onClick={() => open(i.id)}
                          className="rounded-full bg-[#f2f5fb] px-2.5 py-1 text-[12px] font-bold text-ink hover:bg-brand-soft hover:text-brand"
                          title={i.title}
                        >
                          {i.id}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {strategyEdit !== undefined && <PlatformStrategyEditor strategy={strategyEdit} onClose={() => setStrategyEdit(undefined)} />}
      {problemEdit !== undefined && <ProblemEditor problem={problemEdit} onClose={() => setProblemEdit(undefined)} />}
      {platformEdit !== undefined && <PlatformEditor platform={platformEdit} onClose={() => setPlatformEdit(undefined)} />}
    </>
  );
}

/* ───────────────────────────── Página ───────────────────────────── */

export function ContextView() {
  const { load, reload } = useRoadmap();
  const { tab, setTab } = useTab();
  const [textEdit, setTextEdit] = useState<TextEdit | null>(null);
  const current = TABS.find((t) => t.key === tab)!;

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
      <PageHero crumbs={[{ label: "Contexto" }]} title="Contexto estratégico" subtitle="A direção que orienta as iniciativas de Produto da Jovens Gênios em 2027." />
      <PageContainer className="pb-16 pt-4">
        <div
          role="tablist"
          aria-label="Conteúdo do contexto"
          className="-mx-1 flex w-fit max-w-full overflow-x-auto rounded-[18px] border border-[#e3e9f4] bg-surface p-1.5 shadow-[0_2px_10px_rgba(23,27,77,0.04)] [scrollbar-width:none]"
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
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-[13px] px-5 text-[14.5px] font-bold transition-colors",
                tab === key ? "bg-violet text-white shadow-[0_6px_16px_rgba(96,69,216,0.3)]" : "text-[#4a557f] hover:text-navy",
              )}
            >
              <Icon size={18} aria-hidden />
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-muted">{current.description}</p>

        <div id="contexto-painel" role="tabpanel" aria-labelledby={`contexto-aba-${tab}`} className="mt-6">
          {load.status === "loading" && (
            <div className="flex flex-col gap-4" aria-busy="true">
              <Skeleton className="h-44 rounded-3xl" />
              <Skeleton className="h-64 rounded-3xl" />
            </div>
          )}
          {load.status === "error" && <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />}
          {load.status === "ready" &&
            (tab === "proposta" ? (
              <ProposalTab onEditText={setTextEdit} onShowPlatforms={() => setTab("plataformas", true)} />
            ) : (
              <PlatformsTab onEditText={setTextEdit} />
            ))}
        </div>

        {textEdit && <ContextTextEditor field={textEdit.field} title={textEdit.title} onClose={() => setTextEdit(null)} />}
      </PageContainer>
    </>
  );
}
