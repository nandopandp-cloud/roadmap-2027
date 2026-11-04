"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PLATFORM_GLYPHS, PLATFORM_ICON_LABEL } from "@/components/platforms/platform-icon";
import { Button, IconButton } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { ChipMultiSelect, HiddenInput, LinesField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { METRIC_TARGET_STATES, PLATFORM_ACCENTS, PLATFORM_ICONS, PROBLEM_VALIDATION } from "@/lib/domain/constants";
import { METRIC_TARGET_STATE_LABEL, PROBLEM_VALIDATION_LABEL } from "@/lib/domain/labels";
import type { Platform, PlatformGoal, PlatformIndicator, PlatformInput, PlatformStrategy, ProposalSection, StructuralProblem } from "@/lib/domain/types";
import { slugify } from "@/lib/validation/paths";
import {
  fieldErrors,
  platformInputSchema,
  platformStrategySchema,
  proposalSectionSchema,
  strategyContextSchema,
  structuralProblemSchema,
} from "@/lib/validation/schemas";

/** Hook comum: confirma descarte de alterações ao fechar um editor. */
function useGuardedClose(dirty: boolean, onClose: () => void) {
  const confirm = useConfirm();
  return async () => {
    if (dirty) {
      const ok = await confirm({
        title: "Descartar alterações?",
        message: "As alterações feitas ainda não foram salvas.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });
      if (!ok) return;
    }
    onClose();
  };
}

const uniqueId = (base: string, taken: string[]) => {
  const root = slugify(base) || "item";
  let id = root;
  for (let n = 2; taken.includes(id); n++) id = `${root}-${n}`;
  return id;
};

type ContextTextField = "intro" | "platformsIntro" | "measurement";

/** Edita um texto corrido do contexto (Markdown). */
export function ContextTextEditor({ field, title, description, onClose }: { field: ContextTextField; title: string; description?: string; onClose: () => void }) {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const initial = data.context[field];
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = useGuardedClose(draft !== initial, onClose);

  async function save() {
    const parsed = strategyContextSchema.safeParse({ ...data.context, [field]: draft });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      await saveContext(parsed.data);
      notify("success", "Texto atualizado.");
      onClose();
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={close}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save} disabled={draft === initial}>Salvar</Button>
        </>
      }
    >
      <TextAreaField label="Texto" hint={MARKDOWN_HINT} rows={14} value={draft} onChange={(e) => setDraft(e.target.value)} error={errors[field]} data-autofocus />
    </Modal>
  );
}

const MARKDOWN_HINT = "Aceita Markdown: **negrito**, listas com “- ”, tabelas e títulos com “### ”. Separe parágrafos com uma linha em branco.";

/** Seção narrativa da proposta do roadmap. */
export function ProposalSectionEditor({ section, onClose }: { section: ProposalSection | null; onClose: () => void }) {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const initial = { title: section?.title ?? "", subtitle: section?.subtitle ?? "", body: section?.body ?? "", highlight: section?.highlight ?? "" };
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = useGuardedClose(JSON.stringify(draft) !== JSON.stringify(initial), onClose);
  const set = <K extends keyof typeof draft>(k: K, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    const id = section?.id ?? uniqueId(draft.title, data.context.proposal.map((p) => p.id));
    const parsed = proposalSectionSchema.safeParse({ id, ...draft });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      const proposal = section ? data.context.proposal.map((p) => (p.id === section.id ? parsed.data : p)) : [...data.context.proposal, parsed.data];
      await saveContext({ ...data.context, proposal });
      notify("success", "Seção salva.");
      onClose();
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={close}
      title={section ? "Editar seção da proposta" : "Nova seção da proposta"}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Título" required value={draft.title} onChange={(e) => set("title", e.target.value)} error={errors.title} data-autofocus />
        <TextField label="Subtítulo (opcional)" value={draft.subtitle} onChange={(e) => set("subtitle", e.target.value)} error={errors.subtitle} />
        <TextAreaField label="Texto" required hint={MARKDOWN_HINT} rows={14} value={draft.body} onChange={(e) => set("body", e.target.value)} error={errors.body} />
        <TextAreaField label="Frase de destaque (opcional)" hint="Aparece em destaque ao final da seção." rows={2} value={draft.highlight} onChange={(e) => set("highlight", e.target.value)} error={errors.highlight} />
      </div>
    </Modal>
  );
}

const rowId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

type StrategyDraft = Omit<PlatformStrategy, "id">;

const emptyStrategy = (platformId: string): StrategyDraft => ({
  platformId,
  focus: "",
  statement: "",
  narrative: "",
  indicators: [],
  goals: [],
  outcomes: [],
  closing: "",
});

/** Direcionador estratégico de uma plataforma: porquê, indicadores atuais e metas. */
export function PlatformStrategyEditor({ strategy, onClose }: { strategy: PlatformStrategy | null; onClose: () => void }) {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const used = new Set(data.context.platformStrategies.filter((s) => s.id !== strategy?.id).map((s) => s.platformId));
  const available = data.platforms.filter((p) => !used.has(p.id) || p.id === strategy?.platformId);
  const initial: StrategyDraft = strategy ? { ...strategy } : emptyStrategy(available[0]?.id ?? "");
  const [draft, setDraft] = useState<StrategyDraft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const close = useGuardedClose(JSON.stringify(draft) !== JSON.stringify(initial), onClose);
  const set = <K extends keyof StrategyDraft>(k: K, v: StrategyDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const setIndicator = (idx: number, patch: Partial<PlatformIndicator>) =>
    set("indicators", draft.indicators.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const setGoal = (idx: number, patch: Partial<PlatformGoal>) => set("goals", draft.goals.map((x, i) => (i === idx ? { ...x, ...patch } : x)));

  async function save() {
    const platform = data.platforms.find((p) => p.id === draft.platformId);
    const id = strategy?.id ?? uniqueId(`${platform?.name ?? "plataforma"}-${draft.focus}`, data.context.platformStrategies.map((s) => s.id));
    const parsed = platformStrategySchema.safeParse({ ...draft, id, outcomes: draft.outcomes.map((o) => o.trim()).filter(Boolean) });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      const platformStrategies = strategy
        ? data.context.platformStrategies.map((s) => (s.id === strategy.id ? parsed.data : s))
        : [...data.context.platformStrategies, parsed.data];
      await saveContext({ ...data.context, platformStrategies });
      notify("success", "Direcionador salvo.");
      onClose();
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={close}
      title={strategy ? "Editar direcionador da plataforma" : "Novo direcionador da plataforma"}
      description="Registre apenas números e metas informados pelo time. Metas ficam como propostas até serem aprovadas."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save} disabled={!available.length}>Salvar</Button>
        </>
      }
    >
      {!available.length ? (
        <p className="text-[14.5px] text-muted">Todas as plataformas do catálogo já têm um direcionador. Edite o direcionador existente ou cadastre uma nova plataforma.</p>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[220px_1fr]">
            <SelectField label="Plataforma" required value={draft.platformId} onChange={(e) => set("platformId", e.target.value)} error={errors.platformId}>
              {available.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </SelectField>
            <TextField label="Direcionador" required placeholder="Ex.: Estabilidade e confiabilidade" value={draft.focus} onChange={(e) => set("focus", e.target.value)} error={errors.focus} data-autofocus />
          </div>
          <TextField label="Direcionador em uma frase" value={draft.statement} onChange={(e) => set("statement", e.target.value)} error={errors.statement} />
          <TextAreaField label="Por que este direcionador" hint={MARKDOWN_HINT} rows={10} value={draft.narrative} onChange={(e) => set("narrative", e.target.value)} error={errors.narrative} />

          <fieldset className="rounded-2xl border border-line p-4">
            <legend className="px-1 text-[13px] font-bold text-navy">Indicadores atuais</legend>
            {draft.indicators.length === 0 && <p className="text-[13px] italic text-subtle">Nenhum indicador registrado.</p>}
            <ul className="flex flex-col gap-3">
              {draft.indicators.map((ind, idx) => (
                <li key={ind.id} className="grid grid-cols-1 gap-3 rounded-xl bg-[#f7f9fd] p-3 sm:grid-cols-[1fr_130px_auto]">
                  <TextField label="Indicador" required value={ind.label} onChange={(e) => setIndicator(idx, { label: e.target.value })} error={errors[`indicators.${idx}.label`]} />
                  <TextField label="Valor" required value={ind.value} onChange={(e) => setIndicator(idx, { value: e.target.value })} error={errors[`indicators.${idx}.value`]} />
                  <div className="flex items-end justify-end pb-1">
                    <IconButton label={`Remover indicador ${ind.label || idx + 1}`} onClick={() => set("indicators", draft.indicators.filter((_, i) => i !== idx))}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                  <TextField label="Observação (opcional)" className="sm:col-span-3" value={ind.detail} onChange={(e) => setIndicator(idx, { detail: e.target.value })} error={errors[`indicators.${idx}.detail`]} />
                </li>
              ))}
            </ul>
            <Button size="sm" className="mt-3" icon={<Plus size={15} />} onClick={() => set("indicators", [...draft.indicators, { id: rowId("ind"), label: "", value: "", detail: "" }])}>
              Adicionar indicador
            </Button>
          </fieldset>

          <fieldset className="rounded-2xl border border-line p-4">
            <legend className="px-1 text-[13px] font-bold text-navy">Metas</legend>
            {draft.goals.length === 0 && <p className="text-[13px] italic text-subtle">Nenhuma meta registrada.</p>}
            <ul className="flex flex-col gap-3">
              {draft.goals.map((goal, idx) => (
                <li key={goal.id} className="grid grid-cols-1 gap-3 rounded-xl bg-[#f7f9fd] p-3 sm:grid-cols-2">
                  <TextField label="Indicador" required className="sm:col-span-2" value={goal.label} onChange={(e) => setGoal(idx, { label: e.target.value })} error={errors[`goals.${idx}.label`]} />
                  <TextField label="Valor atual" value={goal.current} onChange={(e) => setGoal(idx, { current: e.target.value })} error={errors[`goals.${idx}.current`]} />
                  <TextField label="Meta" required value={goal.target} onChange={(e) => setGoal(idx, { target: e.target.value })} error={errors[`goals.${idx}.target`]} />
                  <TextField label="Observação (opcional)" value={goal.detail} onChange={(e) => setGoal(idx, { detail: e.target.value })} error={errors[`goals.${idx}.detail`]} />
                  <div className="flex items-end gap-2">
                    <SelectField label="Situação da meta" className="flex-1" value={goal.state} onChange={(e) => setGoal(idx, { state: e.target.value as PlatformGoal["state"] })}>
                      {METRIC_TARGET_STATES.map((st) => (
                        <option key={st} value={st}>
                          {METRIC_TARGET_STATE_LABEL[st]}
                        </option>
                      ))}
                    </SelectField>
                    <div className="pb-1">
                      <IconButton label={`Remover meta ${goal.label || idx + 1}`} onClick={() => set("goals", draft.goals.filter((_, i) => i !== idx))}>
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <Button
              size="sm"
              className="mt-3"
              icon={<Plus size={15} />}
              onClick={() => set("goals", [...draft.goals, { id: rowId("meta"), label: "", current: "", target: "", detail: "", state: "proposta" }])}
            >
              Adicionar meta
            </Button>
          </fieldset>

          <LinesField label="O que queremos alcançar" rows={5} value={draft.outcomes} onChange={(v) => set("outcomes", v)} error={errors.outcomes} />
          <TextAreaField label="Fechamento (opcional)" hint={MARKDOWN_HINT} rows={4} value={draft.closing} onChange={(e) => set("closing", e.target.value)} error={errors.closing} />
        </div>
      )}
    </Modal>
  );
}

const emptyProblem = (): Omit<StructuralProblem, "id"> => ({
  name: "",
  description: "",
  audience: "",
  evidence: [],
  consequences: "",
  relatedInitiativeIds: [],
  validation: "hipotese",
});

export function ProblemEditor({ problem, onClose }: { problem: StructuralProblem | null; onClose: () => void }) {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const initial = problem ? { ...problem } : { id: "", ...emptyProblem() };
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const close = useGuardedClose(dirty, onClose);
  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function save() {
    const id = problem?.id ?? uniqueId(draft.name, data.context.problems.map((p) => p.id));
    const parsed = structuralProblemSchema.safeParse({ ...draft, id, evidence: draft.evidence.map((e) => e.trim()).filter(Boolean) });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      const problems = problem
        ? data.context.problems.map((p) => (p.id === problem.id ? parsed.data : p))
        : [...data.context.problems, parsed.data];
      await saveContext({ ...data.context, problems });
      notify("success", "Problema estrutural salvo.");
      onClose();
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      size="lg"
      onClose={close}
      title={problem ? "Editar problema estrutural" : "Novo problema estrutural"}
      description="Diferencie problemas confirmados por evidências de hipóteses ainda não validadas."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_200px]">
          <TextField label="Nome" required value={draft.name} onChange={(e) => set("name", e.target.value)} error={errors.name} data-autofocus />
          <SelectField label="Status de validação" value={draft.validation} onChange={(e) => set("validation", e.target.value as StructuralProblem["validation"])}>
            {PROBLEM_VALIDATION.map((v) => (
              <option key={v} value={v}>
                {PROBLEM_VALIDATION_LABEL[v]}
              </option>
            ))}
          </SelectField>
        </div>
        <TextAreaField label="Descrição" required rows={3} value={draft.description} onChange={(e) => set("description", e.target.value)} error={errors.description} />
        <TextAreaField label="Público afetado" rows={2} value={draft.audience} onChange={(e) => set("audience", e.target.value)} />
        <LinesField label="Evidências disponíveis" hint="Uma por linha, com a fonte. Um problema sem evidências deve ser tratado como hipótese." value={draft.evidence} onChange={(v) => set("evidence", v)} />
        <TextAreaField label="Consequências para o usuário e para a operação" rows={2} value={draft.consequences} onChange={(e) => set("consequences", e.target.value)} />
        <ChipMultiSelect
          legend="Iniciativas relacionadas"
          value={draft.relatedInitiativeIds}
          onChange={(v) => set("relatedInitiativeIds", v)}
          options={data.initiatives.map((i) => ({ value: i.id, label: `${i.id} · ${i.title}` }))}
        />
      </div>
    </Modal>
  );
}

export function PlatformEditor({ platform, onClose }: { platform: Platform | null; onClose: () => void }) {
  const { savePlatform } = useRoadmap();
  const notify = useToast();
  const initial: PlatformInput = platform
    ? { name: platform.name, description: platform.description, owner: platform.owner, icon: platform.icon, accent: platform.accent }
    : { name: "", description: "", owner: "", icon: "layers", accent: "indigo" };
  const [draft, setDraft] = useState<PlatformInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const close = useGuardedClose(dirty, onClose);

  async function save() {
    const parsed = platformInputSchema.safeParse(draft);
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      await savePlatform(platform?.id ?? null, parsed.data);
      notify("success", "Plataforma salva.");
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else notify("error", "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={close}
      title={platform ? "Editar plataforma" : "Nova plataforma"}
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Nome" required value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} data-autofocus />
        <TextAreaField label="Descrição" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <TextField label="Responsável (opcional)" value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} />
        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-navy">Ícone</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ICONS.map((icon) => {
              const Glyph = PLATFORM_GLYPHS[icon];
              return (
                <label
                  key={icon}
                  title={PLATFORM_ICON_LABEL[icon]}
                  className={cn(
                    "relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                    draft.icon === icon ? "border-violet bg-brand-soft text-brand" : "border-line text-muted",
                  )}
                >
                  <HiddenInput type="radio" name="platform-icon" checked={draft.icon === icon} onChange={() => setDraft({ ...draft, icon })} aria-label={PLATFORM_ICON_LABEL[icon]} />
                  <Glyph size={20} />
                </label>
              );
            })}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-navy">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ACCENTS.map((accent) => (
              <label
                key={accent}
                className={cn(
                  "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                  draft.accent === accent ? "border-navy" : "border-transparent",
                )}
              >
                <HiddenInput type="radio" name="platform-accent" checked={draft.accent === accent} onChange={() => setDraft({ ...draft, accent })} aria-label={`Cor ${accent}`} />
                <span className="h-7 w-7 rounded-full" style={{ background: ACCENT_TONE[accent].solid }} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
