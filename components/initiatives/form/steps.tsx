"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { newDocument, newMetric, newMilestone, newPhase, newPrototype } from "@/components/initiatives/form/defaults";
import { illustrationFor } from "@/components/initiatives/initiative-illustration";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { Button, IconButton } from "@/components/ui/button";
import { Checkbox, ChipMultiSelect, LinesField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { cn } from "@/lib/client/cn";
import {
  DOCUMENT_KINDS,
  DOCUMENT_STATUSES,
  ILLUSTRATIONS,
  INITIATIVE_STATUSES,
  METRIC_TARGET_STATES,
  METRIC_VALUE_STATES,
  PHASE_STATES,
  PRIORITIES,
  PROTOTYPE_STATUSES,
  QUARTERS,
} from "@/lib/domain/constants";
import {
  DOCUMENT_KIND_LABEL,
  DOCUMENT_STATUS_LABEL,
  ILLUSTRATION_LABEL,
  ILLUSTRATION_SRC,
  METRIC_TARGET_STATE_LABEL,
  METRIC_VALUE_STATE_LABEL,
  PHASE_STATE_LABEL,
  PRIORITY_LABEL,
  PROTOTYPE_STATUS_LABEL,
  QUARTER_LABEL,
  STATUS_LABEL,
} from "@/lib/domain/labels";
import type { Initiative, InitiativeInput, Platform } from "@/lib/domain/types";

export interface StepProps {
  draft: InitiativeInput;
  set: <K extends keyof InitiativeInput>(key: K, value: InitiativeInput[K]) => void;
  errors: Record<string, string>;
  platforms: Platform[];
  /** Outras iniciativas (exclui a que está sendo editada). */
  others: Initiative[];
  /** Pasta da iniciativa no repositório (somente na edição). */
  folder?: string;
  editingId: string | null;
  nextId: string;
}

function Group({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h3 className="text-[15px] font-extrabold text-navy">{title}</h3>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {children}
    </section>
  );
}

/** Lista editável de objetos (marcos, documentos, protótipos, métricas). */
function Repeater<T extends { id: string }>({
  items,
  onChange,
  create,
  addLabel,
  empty,
  render,
  itemLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  create: () => T;
  addLabel: string;
  empty: string;
  itemLabel: (item: T, idx: number) => string;
  render: (item: T, update: (patch: Partial<T>) => void, idx: number) => ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && <p className="rounded-xl bg-[#f7f9fd] px-4 py-3 text-[13.5px] text-muted">{empty}</p>}
      {items.map((item, idx) => (
        <fieldset key={item.id} className="rounded-2xl border border-line p-4">
          <legend className="sr-only">{itemLabel(item, idx)}</legend>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[13px] font-extrabold text-brand">{itemLabel(item, idx)}</p>
            <IconButton label={`Remover ${itemLabel(item, idx)}`} onClick={() => onChange(items.filter((x) => x.id !== item.id))}>
              <Trash2 size={17} />
            </IconButton>
          </div>
          {render(item, (patch) => onChange(items.map((x) => (x.id === item.id ? { ...x, ...patch } : x))), idx)}
        </fieldset>
      ))}
      <div>
        <Button size="sm" icon={<Plus size={15} />} onClick={() => onChange([...items, create()])}>
          {addLabel}
        </Button>
      </div>
    </div>
  );
}

export function IdentificationStep({ draft, set, errors, others, editingId, nextId }: StepProps) {
  const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const clash = draft.title.trim() && others.find((o) => norm(o.title) === norm(draft.title));
  const previewKey = illustrationFor(editingId ?? nextId, draft.illustration);

  return (
    <div className="flex flex-col gap-6">
      <p className="rounded-xl bg-brand-soft px-4 py-3 text-[13.5px] text-brand-strong">
        {editingId ? (
          <>
            Identificador estável: <strong>{editingId}</strong>
          </>
        ) : (
          <>
            O identificador será gerado automaticamente ao salvar (próximo disponível: <strong>{nextId}</strong>).
          </>
        )}
      </p>
      <TextField
        label="Nome da iniciativa"
        required
        value={draft.title}
        onChange={(e) => set("title", e.target.value)}
        error={errors.title ?? (clash ? `Já existe uma iniciativa com este nome (${clash.id}).` : undefined)}
        placeholder="Ex.: Login simplificado do estudante"
        data-autofocus
      />
      <TextAreaField
        label="Descrição curta"
        hint="Uma ou duas linhas exibidas no card da iniciativa."
        rows={2}
        value={draft.summary}
        onChange={(e) => set("summary", e.target.value)}
        error={errors.summary}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Categoria" value={draft.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex.: Acesso e identidade" />
        <TextField
          label="Tags"
          hint="Separe por vírgula."
          value={draft.tags.join(", ")}
          onChange={(e) => set("tags", e.target.value.split(","))}
          onBlur={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
          placeholder="Acessibilidade, Autenticação"
        />
      </div>
      <fieldset>
        <legend className="mb-2 text-[13px] font-bold text-navy">Ilustração</legend>
        <div className="flex flex-wrap gap-3">
          <label
            className={cn(
              "flex h-[88px] w-[84px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 text-center text-[11.5px] font-bold has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
              draft.illustration === null ? "border-violet bg-brand-soft text-brand" : "border-line text-muted hover:border-line-strong",
            )}
          >
            <input type="radio" name="illustration" className="sr-only" checked={draft.illustration === null} onChange={() => set("illustration", null)} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ILLUSTRATION_SRC[previewKey]} alt="" className="h-9 w-9 rounded-lg opacity-70" />
            Automática
          </label>
          {ILLUSTRATIONS.map((key) => (
            <label
              key={key}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-2xl border-2 p-1 text-[11.5px] font-bold has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                draft.illustration === key ? "border-violet text-brand" : "border-transparent text-muted hover:border-line",
              )}
            >
              <input type="radio" name="illustration" className="sr-only" checked={draft.illustration === key} onChange={() => set("illustration", key)} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ILLUSTRATION_SRC[key]} alt="" className="h-[60px] w-[60px] rounded-xl" />
              {ILLUSTRATION_LABEL[key]}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

export function ProblemStep({ draft, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <TextAreaField label="Problema que queremos resolver" required rows={3} value={draft.problem} onChange={(e) => set("problem", e.target.value)} error={errors.problem} />
      <TextAreaField label="Contexto atual" rows={3} value={draft.currentContext} onChange={(e) => set("currentContext", e.target.value)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextAreaField label="Público afetado" rows={3} value={draft.audience} onChange={(e) => set("audience", e.target.value)} />
        <TextAreaField label="Dor do usuário" rows={3} value={draft.userPain} onChange={(e) => set("userPain", e.target.value)} />
      </div>
      <TextAreaField
        label="Motivador de negócio ou pedagógico"
        required
        rows={3}
        value={draft.motivator}
        onChange={(e) => set("motivator", e.target.value)}
        error={errors.motivator}
      />
      <LinesField
        label="Evidências disponíveis"
        hint="Uma evidência por linha, com a fonte. Deixe vazio se ainda não houver dados — o problema será tratado como hipótese."
        value={draft.evidence}
        onChange={(v) => set("evidence", v)}
      />
      <TextAreaField
        label="Hipótese de solução"
        hint="Formato sugerido: “Se fizermos X, esperamos Y, porque Z.”"
        rows={3}
        value={draft.hypothesis}
        onChange={(e) => set("hypothesis", e.target.value)}
      />
      <TextAreaField
        label="Resultado esperado"
        required
        rows={2}
        value={draft.expectedOutcome}
        onChange={(e) => set("expectedOutcome", e.target.value)}
        error={errors.expectedOutcome}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinesField label="Objetivos principais" value={draft.objectives} onChange={(v) => set("objectives", v)} rows={4} />
        <LinesField label="Principais entregas" value={draft.deliverables} onChange={(v) => set("deliverables", v)} rows={4} />
      </div>
    </div>
  );
}

export function ImpactStep({ draft, set, errors, platforms }: StepProps) {
  const selected = platforms.filter((p) => draft.platformIds.includes(p.id));
  return (
    <div className="flex flex-col gap-6">
      <ChipMultiSelect
        legend="Plataformas impactadas"
        hint="Selecionar mais de uma plataforma torna a iniciativa transversal — ela não é duplicada por plataforma."
        error={errors.platformIds}
        value={draft.platformIds}
        onChange={(v) => set("platformIds", v)}
        options={platforms.map((p) => {
          const Glyph = PLATFORM_GLYPHS[p.icon];
          return { value: p.id, label: p.name, icon: <Glyph size={15} aria-hidden />, description: p.description };
        })}
      />
      {selected.length > 0 && (
        <Group title="Impacto em cada plataforma" description="Opcional. Aparece no card da plataforma dentro dos detalhes.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {selected.map((p) => (
              <TextField
                key={p.id}
                label={p.name}
                value={draft.platformNotes[p.id] ?? ""}
                onChange={(e) => set("platformNotes", { ...draft.platformNotes, [p.id]: e.target.value })}
                placeholder="Ex.: Gestão de credenciais e permissões."
              />
            ))}
          </div>
        </Group>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinesField label="Jornadas afetadas" value={draft.journeys} onChange={(v) => set("journeys", v)} />
        <LinesField label="Perfis de usuários impactados" value={draft.userProfiles} onChange={(v) => set("userProfiles", v)} />
        <LinesField label="Áreas envolvidas" value={draft.areas} onChange={(v) => set("areas", v)} />
        <LinesField label="Impactos operacionais" value={draft.operationalImpacts} onChange={(v) => set("operationalImpacts", v)} />
      </div>
    </div>
  );
}

export function PlanningStep({ draft, set, errors }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SelectField label="Status" required value={draft.status} onChange={(e) => set("status", e.target.value as InitiativeInput["status"])} error={errors.status}>
          {INITIATIVE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Quarter principal" value={draft.quarter ?? ""} onChange={(e) => set("quarter", (e.target.value || null) as InitiativeInput["quarter"])}>
          <option value="">Sem quarter</option>
          {QUARTERS.map((q) => (
            <option key={q} value={q}>
              {QUARTER_LABEL[q]}
            </option>
          ))}
        </SelectField>
        <SelectField label="Prioridade" value={draft.priority ?? ""} onChange={(e) => set("priority", (e.target.value || null) as InitiativeInput["priority"])}>
          <option value="">A definir</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABEL[p]}
            </option>
          ))}
        </SelectField>
      </div>
      <Checkbox
        label="Quarter e prioridade validados"
        hint="Deixe desmarcado enquanto o planejamento for uma proposta."
        checked={draft.planningValidated}
        onChange={(v) => set("planningValidated", v)}
      />
      <TextField label="Responsável (opcional)" value={draft.owner} onChange={(e) => set("owner", e.target.value)} />
      <Group
        title="Etapas de progresso"
        description="O percentual de progresso é calculado pelas etapas concluídas — não é digitado manualmente."
      >
        <Repeater
          items={draft.phases}
          onChange={(v) => set("phases", v)}
          create={newPhase}
          addLabel="Adicionar etapa"
          empty="Nenhuma etapa definida. Sem etapas, o progresso não é exibido."
          itemLabel={(_p, idx) => `Etapa ${idx + 1}`}
          render={(ph, update, idx) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_200px]">
              <TextField label="Nome da etapa" required value={ph.title} onChange={(e) => update({ title: e.target.value })} error={errors[`phases.${idx}.title`]} />
              <SelectField label="Situação" value={ph.state} onChange={(e) => update({ state: e.target.value as typeof ph.state })}>
                {PHASE_STATES.map((st) => (
                  <option key={st} value={st}>
                    {PHASE_STATE_LABEL[st]}
                  </option>
                ))}
              </SelectField>
            </div>
          )}
        />
      </Group>
      <Group
        title="Marcos planejados"
        description="Uma iniciativa transversal mantém um único registro; seus marcos aparecem nos quarters correspondentes do roadmap."
      >
        <Repeater
          items={draft.milestones}
          onChange={(v) => set("milestones", v)}
          create={() => newMilestone(draft.quarter ?? "Q1")}
          addLabel="Adicionar marco"
          empty="Nenhum marco cadastrado."
          itemLabel={(_m, idx) => `Marco ${idx + 1}`}
          render={(m, update, idx) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_150px_170px]">
              <TextField label="Nome do marco" required value={m.title} onChange={(e) => update({ title: e.target.value })} error={errors[`milestones.${idx}.title`]} />
              <SelectField label="Quarter" value={m.quarter} onChange={(e) => update({ quarter: e.target.value as typeof m.quarter })}>
                {QUARTERS.map((q) => (
                  <option key={q} value={q}>
                    {QUARTER_LABEL[q]}
                  </option>
                ))}
              </SelectField>
              <TextField label="Data (opcional)" type="date" value={m.date} onChange={(e) => update({ date: e.target.value })} error={errors[`milestones.${idx}.date`]} />
              <div className="sm:col-span-3">
                <Checkbox label="Marco concluído" checked={m.done} onChange={(v) => update({ done: v })} />
              </div>
            </div>
          )}
        />
      </Group>
    </div>
  );
}

export function DocumentationStep({ draft, set, errors, platforms, folder }: StepProps) {
  const pathHint = folder
    ? `Caminho relativo à raiz do projeto, dentro de ${folder}/.`
    : "Caminho relativo à raiz do projeto, dentro de initiatives/. Após salvar, use “Criar PRD” na aba PRD para gerar o arquivo automaticamente.";
  return (
    <div className="flex flex-col gap-8">
      <Group title="Documentos" description="PRDs, registros de decisão e outros documentos. Nenhum documento é obrigatório para criar a iniciativa.">
        <Repeater
          items={draft.documents}
          onChange={(v) => set("documents", v)}
          create={() => newDocument(folder, draft.documents.some((d) => d.kind === "prd"))}
          addLabel="Adicionar documento"
          empty="Nenhum documento associado."
          itemLabel={(d, idx) => d.title || `Documento ${idx + 1}`}
          render={(d, update, idx) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Título" required value={d.title} onChange={(e) => update({ title: e.target.value })} error={errors[`documents.${idx}.title`]} />
              <SelectField label="Tipo" value={d.kind} onChange={(e) => update({ kind: e.target.value as typeof d.kind })}>
                {DOCUMENT_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {DOCUMENT_KIND_LABEL[k]}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Origem" value={d.source} onChange={(e) => update({ source: e.target.value as typeof d.source })}>
                <option value="repo">Arquivo Markdown no repositório</option>
                <option value="externo">Link externo</option>
              </SelectField>
              {d.source === "repo" ? (
                <TextField label="Caminho do arquivo" required value={d.path} onChange={(e) => update({ path: e.target.value.trim() })} error={errors[`documents.${idx}.path`]} hint={pathHint} placeholder="initiatives/JG-2027-00X-nome/prd.md" />
              ) : (
                <TextField label="URL" required type="url" value={d.url} onChange={(e) => update({ url: e.target.value.trim() })} error={errors[`documents.${idx}.url`]} placeholder="https://…" />
              )}
              <TextField label="Versão" value={d.version} onChange={(e) => update({ version: e.target.value })} placeholder="Ex.: 1.0" />
              <SelectField label="Status de elaboração" value={d.status} onChange={(e) => update({ status: e.target.value as typeof d.status })}>
                {DOCUMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {DOCUMENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </SelectField>
              <TextField label="Data de atualização" type="date" value={d.updatedAt} onChange={(e) => update({ updatedAt: e.target.value })} error={errors[`documents.${idx}.updatedAt`]} />
            </div>
          )}
        />
        {errors.documents && <p className="text-xs font-semibold text-[#c42b3a]">{errors.documents}</p>}
      </Group>

      <Group title="Protótipos" description="Experiências navegáveis em HTML local (pasta prototype/) ou URLs externas.">
        <Repeater
          items={draft.prototypes}
          onChange={(v) => set("prototypes", v)}
          create={() => newPrototype(folder)}
          addLabel="Adicionar protótipo"
          empty="Nenhum protótipo associado."
          itemLabel={(p, idx) => p.name || `Protótipo ${idx + 1}`}
          render={(p, update, idx) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Nome do protótipo" required value={p.name} onChange={(e) => update({ name: e.target.value })} error={errors[`prototypes.${idx}.name`]} />
              <SelectField label="Status da experiência" value={p.status} onChange={(e) => update({ status: e.target.value as typeof p.status })}>
                {PROTOTYPE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROTOTYPE_STATUS_LABEL[s]}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Origem" value={p.source} onChange={(e) => update({ source: e.target.value as typeof p.source })}>
                <option value="repo">HTML local no repositório</option>
                <option value="externo">URL externa</option>
              </SelectField>
              {p.source === "repo" ? (
                <TextField label="Caminho do HTML" required value={p.path} onChange={(e) => update({ path: e.target.value.trim() })} error={errors[`prototypes.${idx}.path`]} placeholder="initiatives/…/prototype/index.html" />
              ) : (
                <TextField label="URL" required type="url" value={p.url} onChange={(e) => update({ url: e.target.value.trim() })} error={errors[`prototypes.${idx}.url`]} placeholder="https://…" />
              )}
              <TextAreaField className="sm:col-span-2" label="O que está sendo demonstrado" rows={2} value={p.description} onChange={(e) => update({ description: e.target.value })} />
              <div className="sm:col-span-2">
                <ChipMultiSelect
                  legend="Plataformas representadas"
                  value={p.platformIds}
                  onChange={(v) => update({ platformIds: v })}
                  options={platforms.map((pl) => ({ value: pl.id, label: pl.name }))}
                  error={errors[`prototypes.${idx}.platformIds`]}
                />
              </div>
              <LinesField className="sm:col-span-2" label="Fluxos disponíveis" value={p.flows} onChange={(v) => update({ flows: v })} />
            </div>
          )}
        />
      </Group>
    </div>
  );
}

export function MetricsStep({ draft, set, errors, others }: StepProps) {
  const options = others.map((o) => ({ value: o.id, label: `${o.id} · ${o.title}` }));
  return (
    <div className="flex flex-col gap-8">
      <Group title="Métricas de sucesso" description="Não invente valores: registre como pendente o que ainda não foi medido ou aprovado.">
        <Repeater
          items={draft.metrics}
          onChange={(v) => set("metrics", v)}
          create={newMetric}
          addLabel="Adicionar métrica"
          empty="Nenhuma métrica definida."
          itemLabel={(m, idx) => m.indicator || `Métrica ${idx + 1}`}
          render={(m, update, idx) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField className="sm:col-span-2" label="Indicador de sucesso" required value={m.indicator} onChange={(e) => update({ indicator: e.target.value })} error={errors[`metrics.${idx}.indicator`]} />
              <TextField label="Valor de referência" value={m.baseline} onChange={(e) => update({ baseline: e.target.value })} placeholder="Deixe vazio se desconhecido" />
              <SelectField label="Situação do valor de referência" value={m.baselineState} onChange={(e) => update({ baselineState: e.target.value as typeof m.baselineState })}>
                {METRIC_VALUE_STATES.map((s) => (
                  <option key={s} value={s}>
                    {METRIC_VALUE_STATE_LABEL[s]}
                  </option>
                ))}
              </SelectField>
              <TextField label="Meta" value={m.target} onChange={(e) => update({ target: e.target.value })} placeholder="Somente se proposta ou aprovada" />
              <SelectField label="Situação da meta" value={m.targetState} onChange={(e) => update({ targetState: e.target.value as typeof m.targetState })}>
                {METRIC_TARGET_STATES.map((s) => (
                  <option key={s} value={s}>
                    {METRIC_TARGET_STATE_LABEL[s]}
                  </option>
                ))}
              </SelectField>
              <TextAreaField className="sm:col-span-2" label="Método de medição" rows={2} value={m.method} onChange={(e) => update({ method: e.target.value })} />
              <TextField label="Resultado observado" value={m.observed} onChange={(e) => update({ observed: e.target.value })} />
              <TextField label="Data da última avaliação" type="date" value={m.lastEvaluatedAt} onChange={(e) => update({ lastEvaluatedAt: e.target.value })} error={errors[`metrics.${idx}.lastEvaluatedAt`]} />
            </div>
          )}
        />
      </Group>

      <Group title="Relações com outras iniciativas">
        <ChipMultiSelect
          legend="Depende de"
          hint="Iniciativas que precisam avançar antes desta."
          error={errors.dependsOn}
          value={draft.dependsOn}
          onChange={(v) => set("dependsOn", v)}
          options={options}
        />
        <ChipMultiSelect
          legend="Iniciativas relacionadas"
          error={errors.relatedInitiativeIds}
          value={draft.relatedInitiativeIds}
          onChange={(v) => set("relatedInitiativeIds", v)}
          options={options}
        />
      </Group>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <LinesField label="Dependências técnicas" value={draft.technicalDependencies} onChange={(v) => set("technicalDependencies", v)} />
        <LinesField label="Riscos" value={draft.risks} onChange={(v) => set("risks", v)} />
        <LinesField className="sm:col-span-2" label="Decisões pendentes" value={draft.pendingDecisions} onChange={(v) => set("pendingDecisions", v)} />
      </div>
    </div>
  );
}

export const STEP_COMPONENTS = [IdentificationStep, ProblemStep, ImpactStep, PlanningStep, DocumentationStep, MetricsStep];
