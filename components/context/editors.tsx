"use client";

import { useState } from "react";
import { PLATFORM_GLYPHS, PLATFORM_ICON_LABEL } from "@/components/platforms/platform-icon";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { ChipMultiSelect, LinesField, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { PLATFORM_ACCENTS, PLATFORM_ICONS, PROBLEM_VALIDATION } from "@/lib/domain/constants";
import { PROBLEM_VALIDATION_LABEL } from "@/lib/domain/labels";
import type { Driver, Platform, PlatformInput, StructuralProblem } from "@/lib/domain/types";
import { slugify } from "@/lib/validation/paths";
import { driverSchema, fieldErrors, platformInputSchema, structuralProblemSchema } from "@/lib/validation/schemas";

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

export function DriverEditor({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const { data, saveContext } = useRoadmap();
  const notify = useToast();
  const [draft, setDraft] = useState({ title: driver?.title ?? "", description: driver?.description ?? "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = draft.title !== (driver?.title ?? "") || draft.description !== (driver?.description ?? "");
  const close = useGuardedClose(dirty, onClose);

  async function save() {
    const id = driver?.id ?? uniqueId(draft.title, data.context.drivers.map((d) => d.id));
    const parsed = driverSchema.safeParse({ id, ...draft });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setSaving(true);
    try {
      const drivers = driver
        ? data.context.drivers.map((d) => (d.id === driver.id ? parsed.data : d))
        : [...data.context.drivers, parsed.data];
      await saveContext({ ...data.context, drivers });
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
      onClose={close}
      title={driver ? "Editar direcionador" : "Novo direcionador"}
      description="Direcionadores orientam a priorização; não são metas ou compromissos aprovados."
      footer={
        <>
          <Button variant="ghost" onClick={close}>Cancelar</Button>
          <Button variant="primary" loading={saving} onClick={save}>Salvar</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Título" required value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} error={errors.title} data-autofocus />
        <TextAreaField label="Descrição" required rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} error={errors.description} />
      </div>
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
                    "flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border-2 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                    draft.icon === icon ? "border-violet bg-brand-soft text-brand" : "border-line text-muted",
                  )}
                >
                  <input type="radio" name="platform-icon" className="sr-only" checked={draft.icon === icon} onChange={() => setDraft({ ...draft, icon })} aria-label={PLATFORM_ICON_LABEL[icon]} />
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
                  "flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                  draft.accent === accent ? "border-navy" : "border-transparent",
                )}
              >
                <input type="radio" name="platform-accent" className="sr-only" checked={draft.accent === accent} onChange={() => setDraft({ ...draft, accent })} aria-label={`Cor ${accent}`} />
                <span className="h-7 w-7 rounded-full" style={{ background: ACCENT_TONE[accent].solid }} />
              </label>
            ))}
          </div>
        </fieldset>
      </div>
    </Modal>
  );
}
