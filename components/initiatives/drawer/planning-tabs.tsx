"use client";

import { Select } from "@/components/ui/select";
import { CalendarRange, CheckCircle2, Gauge, Circle, FileText, GitFork, History, Info, Layers, ListChecks, Scale, ShieldAlert, Wrench } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PhaseIcon } from "@/components/initiatives/drawer/overview-tab";
import { BulletList, DrawerSection, InitiativeRow, Prose, SubHeading } from "@/components/initiatives/drawer/parts";
import { ProgressBar } from "@/components/ui/progress";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { ValidationBadge } from "@/components/ui/badges";
import { buttonClass, Spinner } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn, formatDate, formatDateTime } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { documentReaderHref } from "@/lib/domain/artifacts";
import { INITIATIVE_STATUSES, PHASE_STATES, PRIORITIES, QUARTERS } from "@/lib/domain/constants";
import { PHASE_STATE_LABEL, PRIORITY_LABEL, QUARTER_LABEL, QUARTER_MONTHS, STATUS_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { Initiative, Phase, Platform } from "@/lib/domain/types";

function InlineSelect({
  label,
  value,
  onChange,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[12px] font-bold text-subtle">{label}</span>
      <Select
        value={value}
        disabled={disabled}
        onChange={onChange}
        aria-label={label}
        className="h-10 rounded-xl border border-line bg-surface px-3 text-[14px] font-semibold text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12"
      >
        {children}
      </Select>
    </div>
  );
}

/** Aba Roadmap: planejamento editável, marcos, dependências e histórico. */
export function RoadmapTab({ initiative: i, onOpen }: { initiative: Initiative; onOpen: (id: string) => void }) {
  const { patchPlanning, data } = useRoadmap();
  const notify = useToast();
  const [saving, setSaving] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);

  async function save(patch: Parameters<typeof patchPlanning>[1], message: string) {
    setSaving(true);
    try {
      await patchPlanning(i.id, patch);
      notify("success", message);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar a alteração.");
    } finally {
      setSaving(false);
    }
  }

  const deps = i.dependsOn.map((id) => data.initiatives.find((x) => x.id === id)).filter((x): x is Initiative => !!x);
  const milestonesByQuarter = QUARTERS.map((q) => ({ q, items: i.milestones.filter((m) => m.quarter === q) })).filter((g) => g.items.length);
  const history = showAllHistory ? i.history : i.history.slice(0, 6);
  const progress = progressOf(i.phases);

  async function setPhase(id: string, state: Phase["state"]) {
    const phases = i.phases.map((ph) => (ph.id === id ? { ...ph, state } : ph));
    await save({ phases }, "Etapa atualizada.");
  }

  return (
    <div className="flex flex-col gap-4">
      <DrawerSection
        icon={CalendarRange}
        color="#5938A6"
        title="Planejamento"
        action={saving ? <Spinner className="text-violet" /> : undefined}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InlineSelect
            label="Quarter"
            value={i.quarter ?? ""}
            disabled={saving}
            onChange={(v) => save({ quarter: (v || null) as Initiative["quarter"] }, "Quarter atualizado.")}
          >
            <option value="">Sem quarter</option>
            {QUARTERS.map((q) => (
              <option key={q} value={q}>
                {QUARTER_LABEL[q]}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Prioridade"
            value={i.priority ?? ""}
            disabled={saving}
            onChange={(v) => save({ priority: (v || null) as Initiative["priority"] }, "Prioridade atualizada.")}
          >
            <option value="">A definir</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </InlineSelect>
          <InlineSelect
            label="Status"
            value={i.status}
            disabled={saving}
            onChange={(v) => save({ status: v as Initiative["status"] }, "Status atualizado.")}
          >
            {INITIATIVE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </InlineSelect>
        </div>
        <div className="mt-4">
          <Checkbox
            label="Quarter e prioridade validados"
            hint="Marque somente após validação com as áreas envolvidas."
            checked={i.planningValidated}
            onChange={(v) => save({ planningValidated: v }, v ? "Planejamento marcado como validado." : "Planejamento marcado como pendente.")}
          />
        </div>
        {!i.planningValidated && (
          <p className="mt-3 flex gap-2 rounded-xl bg-[#fff8db] px-3 py-2 text-[13px] font-semibold text-[#735600]">
            <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
            Planejamento a validar: quarter e prioridade são propostas iniciais.
          </p>
        )}
        {i.owner && (
          <p className="mt-3 text-[13.5px] text-muted">
            <span className="font-bold text-ink">Responsável: </span>
            {i.owner}
          </p>
        )}
      </DrawerSection>

      <DrawerSection icon={Gauge} color="#2868E8" title="Etapas de progresso" action={progress !== null ? <span className="text-[14px] font-extrabold text-navy">{progress}%</span> : undefined}>
        {i.phases.length === 0 ? (
          <Prose empty="Nenhuma etapa definida. Adicione etapas na edição da iniciativa." />
        ) : (
          <>
            <ProgressBar value={progress} showLabel={false} />
            <ul className="mt-3 flex flex-col gap-2">
              {i.phases.map((ph) => (
                <li key={ph.id} className="flex items-center gap-3">
                  <PhaseIcon state={ph.state} />
                  <span className="flex-1 text-[14px] font-semibold text-ink">{ph.title}</span>
                  <Select
                    aria-label={`Situação da etapa ${ph.title}`}
                    value={ph.state}
                    disabled={saving}
                    onChange={(v) => setPhase(ph.id, v as Phase["state"])}
                    chevronSize={15}
                    className="h-9 w-auto min-w-[150px] rounded-lg border border-line bg-surface px-2.5 text-[13px] font-semibold text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12"
                  >
                    {PHASE_STATES.map((st) => (
                      <option key={st} value={st}>
                        {PHASE_STATE_LABEL[st]}
                      </option>
                    ))}
                  </Select>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[12.5px] text-muted">O percentual considera apenas etapas concluídas.</p>
          </>
        )}
      </DrawerSection>

      <DrawerSection icon={ListChecks} color="#00A99D" title="Marcos previstos">
        {milestonesByQuarter.length === 0 ? (
          <Prose empty="Nenhum marco definido." />
        ) : (
          <ol className="flex flex-col gap-4">
            {milestonesByQuarter.map(({ q, items }) => (
              <li key={q}>
                <p className="text-[12.5px] font-extrabold text-brand">
                  {QUARTER_LABEL[q]} <span className="font-semibold text-subtle">· {QUARTER_MONTHS[q]}</span>
                </p>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {items.map((m) => (
                    <li key={m.id} className="flex items-center gap-2.5 text-[14px]">
                      {m.done ? (
                        <CheckCircle2 size={17} className="shrink-0 text-[#22A05A]" aria-label="Concluído" />
                      ) : (
                        <Circle size={17} className="shrink-0 text-subtle" aria-label="Previsto" />
                      )}
                      <span className={cn("flex-1 font-semibold", m.done ? "text-muted line-through" : "text-ink")}>{m.title}</span>
                      <span className="text-[12.5px] text-muted">{m.date ? formatDate(m.date) : "Data a definir"}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </DrawerSection>

      <DrawerSection icon={GitFork} color="#2868E8" title="Dependências de outras iniciativas">
        {deps.length === 0 ? (
          <Prose empty="Esta iniciativa não depende de outras iniciativas." />
        ) : (
          <div className="flex flex-col gap-2.5">
            {deps.map((d) => (
              <InitiativeRow key={d.id} initiative={d} onOpen={() => onOpen(d.id)} note={`${d.id} · ${d.quarter ? QUARTER_LABEL[d.quarter] : "sem quarter"}`} />
            ))}
          </div>
        )}
      </DrawerSection>

      <DrawerSection icon={History} color="#68769A" title="Histórico de alterações">
        <p className="mb-3 text-[12.5px] text-muted">
          Criada em {formatDateTime(i.createdAt)} · Atualizada em {formatDateTime(i.updatedAt)}
        </p>
        {i.history.length === 0 ? (
          <Prose empty="Nenhuma alteração registrada." />
        ) : (
          <ol className="flex flex-col gap-2.5 border-l-2 border-line pl-4">
            {history.map((h) => (
              <li key={h.id} className="text-[13.5px] leading-snug">
                <span className="block text-[12px] font-bold text-subtle">{formatDateTime(h.at)}</span>
                <span className="text-ink">{h.description}</span>
              </li>
            ))}
          </ol>
        )}
        {i.history.length > 6 && (
          <button type="button" onClick={() => setShowAllHistory((v) => !v)} className="mt-3 text-[13px] font-bold text-blue hover:underline">
            {showAllHistory ? "Mostrar menos" : `Ver histórico completo (${i.history.length})`}
          </button>
        )}
      </DrawerSection>
    </div>
  );
}

/** Aba Dependências: relações, plataformas, dependências técnicas, riscos e decisões. */
export function DependenciesTab({
  initiative: i,
  platforms,
  onOpen,
}: {
  initiative: Initiative;
  platforms: Platform[];
  onOpen: (id: string) => void;
}) {
  const { data } = useRoadmap();
  const find = (id: string) => data.initiatives.find((x) => x.id === id);
  const dependsOn = i.dependsOn.map(find).filter((x): x is Initiative => !!x);
  const blocks = data.initiatives.filter((x) => x.dependsOn.includes(i.id));
  const related = Array.from(
    new Set([...i.relatedInitiativeIds, ...data.initiatives.filter((x) => x.relatedInitiativeIds.includes(i.id)).map((x) => x.id)]),
  )
    .filter((id) => !i.dependsOn.includes(id))
    .map(find)
    .filter((x): x is Initiative => !!x);
  const impacted = i.platformIds.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  const problems = data.context.problems.filter((p) => p.relatedInitiativeIds.includes(i.id));
  const decisionsDoc = i.documents.find((d) => d.kind === "decisoes" && d.source === "repo");

  return (
    <div className="flex flex-col gap-4">
      <DrawerSection icon={GitFork} color="#2868E8" title="Iniciativas relacionadas">
        {dependsOn.length + blocks.length + related.length === 0 ? (
          <Prose empty="Nenhuma iniciativa relacionada." />
        ) : (
          <div className="flex flex-col gap-4">
            {dependsOn.length > 0 && (
              <div>
                <SubHeading>Depende de</SubHeading>
                <div className="flex flex-col gap-2.5">
                  {dependsOn.map((d) => (
                    <InitiativeRow key={d.id} initiative={d} onOpen={() => onOpen(d.id)} />
                  ))}
                </div>
              </div>
            )}
            {blocks.length > 0 && (
              <div>
                <SubHeading>É pré-requisito para</SubHeading>
                <div className="flex flex-col gap-2.5">
                  {blocks.map((d) => (
                    <InitiativeRow key={d.id} initiative={d} onOpen={() => onOpen(d.id)} />
                  ))}
                </div>
              </div>
            )}
            {related.length > 0 && (
              <div>
                <SubHeading>Relacionadas</SubHeading>
                <div className="flex flex-col gap-2.5">
                  {related.map((d) => (
                    <InitiativeRow key={d.id} initiative={d} onOpen={() => onOpen(d.id)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DrawerSection>

      <DrawerSection icon={Layers} color="#7B4FE3" title="Plataformas, jornadas e áreas">
        {impacted.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {impacted.map((p) => (
              <PlatformChip key={p.id} platform={p} />
            ))}
          </div>
        ) : (
          <Prose empty="Plataformas a definir." />
        )}
        {i.journeys.length > 0 && (
          <div className="mt-4">
            <SubHeading>Jornadas afetadas</SubHeading>
            <BulletList items={i.journeys} empty="" />
          </div>
        )}
        {i.userProfiles.length > 0 && (
          <div className="mt-4">
            <SubHeading>Perfis impactados</SubHeading>
            <BulletList items={i.userProfiles} empty="" />
          </div>
        )}
        {i.areas.length > 0 && (
          <p className="mt-4 text-[13.5px] text-muted">
            <span className="font-bold text-ink">Áreas envolvidas: </span>
            {i.areas.join(", ")}
          </p>
        )}
      </DrawerSection>

      <DrawerSection icon={Wrench} color="#F28A1F" title="Dependências técnicas e operacionais">
        <SubHeading>Técnicas</SubHeading>
        <BulletList items={i.technicalDependencies} empty="Nenhuma dependência técnica registrada." />
        <div className="mt-4">
          <SubHeading>Impactos operacionais</SubHeading>
          <BulletList items={i.operationalImpacts} empty="Nenhum impacto operacional registrado." />
        </div>
      </DrawerSection>

      <DrawerSection icon={ShieldAlert} color="#E8505B" title="Riscos">
        <BulletList items={i.risks} empty="Nenhum risco registrado." />
      </DrawerSection>

      <DrawerSection
        icon={Scale}
        color="#5938A6"
        title="Decisões pendentes"
        action={
          decisionsDoc ? (
            <Link href={documentReaderHref(i.id, decisionsDoc)} className={buttonClass("ghost", "sm")}>
              <FileText size={15} aria-hidden /> Registro de decisões
            </Link>
          ) : undefined
        }
      >
        <BulletList items={i.pendingDecisions} empty="Nenhuma decisão pendente registrada." />
      </DrawerSection>

      {problems.length > 0 && (
        <DrawerSection icon={Info} color="#2868E8" title="Problemas estruturais relacionados">
          <ul className="flex flex-col gap-2">
            {problems.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-2 text-[14px]">
                <Link href={`/contexto#problema-${p.id}`} className="font-bold text-navy hover:underline">
                  {p.name}
                </Link>
                <ValidationBadge validation={p.validation} />
              </li>
            ))}
          </ul>
        </DrawerSection>
      )}
    </div>
  );
}
