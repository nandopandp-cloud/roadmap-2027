"use client";

import {
  Accessibility,
  Check,
  Compass,
  Pencil,
  Plus,
  Rocket,
  ShieldCheck,
  Trash2,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { DriverEditor, PlatformEditor, ProblemEditor } from "@/components/context/editors";
import { PageContainer, PageTitle, TopBar } from "@/components/layout/page-header";
import { PlatformTile } from "@/components/platforms/platform-icon";
import { ValidationBadge } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { PROBLEM_VALIDATION } from "@/lib/domain/constants";
import { PROBLEM_VALIDATION_LABEL } from "@/lib/domain/labels";
import type { Driver, Platform, ProblemValidation, StructuralProblem } from "@/lib/domain/types";

const DRIVER_ICONS: LucideIcon[] = [Accessibility, ShieldCheck, Rocket, Workflow, Compass];
const DRIVER_COLORS = ["#2868E8", "#00A99D", "#7B4FE3", "#F28A1F", "#E0508F"];

function Section({ id, title, description, action, children }: { id: string; title: string; description?: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={id} className="text-[22px] font-black text-navy">
            {title}
          </h2>
          {description && <p className="mt-1 max-w-3xl text-[14.5px] text-muted">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InitiativeLinks({ ids }: { ids: string[] }) {
  const { initiativeById } = useRoadmap();
  const { open } = useInitiativeSelection();
  const items = ids.map((id) => initiativeById(id)).filter((i) => !!i);
  if (!items.length) return <span className="text-[13px] italic text-subtle">Nenhuma iniciativa relacionada.</span>;
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

function IntroEditor() {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await saveContext({ ...data.context, intro: draft.trim() });
      notify("success", "Texto introdutório atualizado.");
      setEditing(false);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-6 rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
        <label htmlFor="intro" className="text-[13px] font-bold text-navy">
          Texto introdutório
        </label>
        <textarea
          id="intro"
          rows={7}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="mt-2 w-full resize-y rounded-xl border border-line p-3.5 text-[15px] leading-relaxed focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12"
          autoFocus
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" icon={<Check size={16} />} loading={saving} onClick={save} disabled={draft.trim() === data.context.intro.trim()}>
            Salvar texto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mt-6 overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#2a1f86_0%,#3b2a9e_55%,#5938a6_100%)] p-7 text-white shadow-[var(--shadow-raised)] sm:p-9">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/illustrations/foguete.svg" alt="" aria-hidden className="pointer-events-none absolute -right-6 -top-6 hidden h-44 w-44 rounded-[36px] opacity-30 md:block" />
      <div className="relative max-w-3xl">
        {data.context.intro ? (
          data.context.intro.split(/\n{2,}/).map((p, idx) => (
            <p key={idx} className={cn("text-[16px] leading-relaxed text-white/90", idx > 0 && "mt-3")}>
              {p}
            </p>
          ))
        ) : (
          <p className="text-[16px] italic text-white/75">Ainda não há texto introdutório.</p>
        )}
      </div>
      <Button
        size="sm"
        className="relative mt-5 border-white/30 bg-white/10 text-white hover:bg-white/20"
        variant="secondary"
        icon={<Pencil size={14} />}
        onClick={() => {
          setDraft(data.context.intro);
          setEditing(true);
        }}
      >
        Editar texto
      </Button>
    </div>
  );
}

export function ContextView() {
  const { load, data, reload, saveContext, removePlatform } = useRoadmap();
  const confirm = useConfirm();
  const notify = useToast();
  const { open } = useInitiativeSelection();
  const [driverEdit, setDriverEdit] = useState<Driver | null | undefined>(undefined);
  const [problemEdit, setProblemEdit] = useState<StructuralProblem | null | undefined>(undefined);
  const [platformEdit, setPlatformEdit] = useState<Platform | null | undefined>(undefined);
  const [validationFilter, setValidationFilter] = useState<ProblemValidation | "todos">("todos");

  async function removeDriver(d: Driver) {
    const ok = await confirm({ title: "Remover direcionador?", message: `“${d.title}” será removido do contexto estratégico.`, confirmLabel: "Remover", tone: "danger" });
    if (!ok) return;
    try {
      await saveContext({ ...data.context, drivers: data.context.drivers.filter((x) => x.id !== d.id) });
      notify("success", "Direcionador removido.");
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível remover.");
    }
  }

  async function removeProblem(p: StructuralProblem) {
    const ok = await confirm({ title: "Remover problema estrutural?", message: `“${p.name}” será removido. As iniciativas relacionadas não são afetadas.`, confirmLabel: "Remover", tone: "danger" });
    if (!ok) return;
    try {
      await saveContext({ ...data.context, problems: data.context.problems.filter((x) => x.id !== p.id) });
      notify("success", "Problema removido.");
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível remover.");
    }
  }

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

  const problems = data.context.problems.filter((p) => validationFilter === "todos" || p.validation === validationFilter);

  return (
    <PageContainer>
      <TopBar crumbs={[{ label: "Contexto" }]} />
      <PageTitle title="Contexto estratégico" subtitle="A direção que orienta as iniciativas de Produto da Jovens Gênios em 2027." />

      {load.status === "loading" && (
        <div className="mt-6 flex flex-col gap-4" aria-busy="true">
          <Skeleton className="h-44 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      )}
      {load.status === "error" && (
        <div className="mt-6">
          <ErrorBanner message={load.message} action={<Button size="sm" onClick={() => void reload()}>Tentar novamente</Button>} />
        </div>
      )}

      {load.status === "ready" && (
        <>
          <IntroEditor />

          <Section
            id="direcionadores"
            title="Direcionadores estratégicos"
            description="Pontos de partida para orientar escolhas. Estão em discussão e não representam metas ou compromissos aprovados."
            action={<Button size="sm" icon={<Plus size={15} />} onClick={() => setDriverEdit(null)}>Adicionar direcionador</Button>}
          >
            {data.context.drivers.length === 0 ? (
              <EmptyState compact title="Nenhum direcionador cadastrado" />
            ) : (
              <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {data.context.drivers.map((d, idx) => {
                  const Icon = DRIVER_ICONS[idx % DRIVER_ICONS.length];
                  const color = DRIVER_COLORS[idx % DRIVER_COLORS.length];
                  return (
                    <li key={d.id} className="group flex gap-4 rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow-card)]">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: color }} aria-hidden>
                        <Icon size={24} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-extrabold text-navy">{d.title}</h3>
                        <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{d.description}</p>
                      </div>
                      <div className="-mr-2 -mt-2 flex shrink-0 flex-col">
                        <IconButton label={`Editar ${d.title}`} onClick={() => setDriverEdit(d)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton label={`Remover ${d.title}`} onClick={() => removeDriver(d)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section
            id="problemas"
            title="Problemas estruturais"
            description="Problemas recorrentes que podem ser associados às iniciativas. Problemas confirmados têm evidências; hipóteses ainda precisam de validação."
            action={<Button size="sm" icon={<Plus size={15} />} onClick={() => setProblemEdit(null)}>Novo problema</Button>}
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
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-[13px] font-bold transition-colors",
                      validationFilter === v ? "bg-navy text-white" : "bg-surface text-muted hover:text-ink",
                    )}
                  >
                    {v === "todos" ? "Todos" : PROBLEM_VALIDATION_LABEL[v]} ({count})
                  </button>
                );
              })}
            </div>
            {problems.length === 0 ? (
              <EmptyState compact title="Nenhum problema neste filtro" />
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
                      <div className="-mr-2 -mt-1 flex">
                        <IconButton label={`Editar ${p.name}`} onClick={() => setProblemEdit(p)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton label={`Remover ${p.name}`} onClick={() => removeProblem(p)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
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

          <Section id="principios" title="Princípios de planejamento">
            <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {data.context.principles.map((p, idx) => (
                <li key={p.id} className="rounded-3xl border border-line bg-surface p-5 shadow-[var(--shadow-card)]">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-[15px] font-black text-brand" aria-hidden>
                    {idx + 1}
                  </span>
                  <h3 className="mt-3 text-[15.5px] font-extrabold leading-snug text-navy">{p.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted">{p.description}</p>
                </li>
              ))}
            </ol>
          </Section>

          <Section
            id="plataformas"
            title="Plataformas do ecossistema"
            description="Catálogo de referência, editável. Plataformas vinculadas a iniciativas não podem ser excluídas."
            action={<Button size="sm" icon={<Plus size={15} />} onClick={() => setPlatformEdit(null)}>Nova plataforma</Button>}
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
                      <div className="-mr-2 -mt-1 flex">
                        <IconButton label={`Editar ${p.name}`} onClick={() => setPlatformEdit(p)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton label={`Excluir ${p.name}`} onClick={() => deletePlatform(p)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </div>
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
        </>
      )}

      {driverEdit !== undefined && <DriverEditor driver={driverEdit} onClose={() => setDriverEdit(undefined)} />}
      {problemEdit !== undefined && <ProblemEditor problem={problemEdit} onClose={() => setProblemEdit(undefined)} />}
      {platformEdit !== undefined && <PlatformEditor platform={platformEdit} onClose={() => setPlatformEdit(undefined)} />}
    </PageContainer>
  );
}
