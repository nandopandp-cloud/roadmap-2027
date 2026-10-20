"use client";

import { Check } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { PLATFORM_GLYPHS, PLATFORM_ICON_LABEL } from "@/components/platforms/platform-icon";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { ChipMultiSelect, HiddenInput, SelectField, TextAreaField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { PLATFORM_ACCENTS, PLATFORM_ICONS } from "@/lib/domain/constants";
import type { Squad, SquadInput } from "@/lib/domain/types";
import { fieldErrors, squadInputSchema } from "@/lib/validation/schemas";

const ACCENT_LABEL: Record<SquadInput["accent"], string> = {
  blue: "Azul",
  purple: "Roxo",
  teal: "Turquesa",
  orange: "Laranja",
  pink: "Rosa",
  indigo: "Índigo",
};

export const emptySquad = (): SquadInput => ({ name: "", description: "", icon: "layers", accent: "indigo", leaderId: null, platformIds: [] });

export function SquadForm({ squad, onClose, onSaved }: { squad: Squad | null; onClose: () => void; onSaved: (squad: Squad) => void }) {
  const { data, saveSquad } = useRoadmap();
  const notify = useToast();
  const confirm = useConfirm();
  const initial = useMemo<SquadInput>(() => (squad ? (({ id: _id, ...rest }) => rest)(squad) : emptySquad()), [squad]);
  const [draft, setDraft] = useState<SquadInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const people = [...data.people].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const set = <K extends keyof SquadInput>(key: K, value: SquadInput[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => (e[key] ? Object.fromEntries(Object.entries(e).filter(([k]) => k !== key)) : e));
  };

  async function requestClose() {
    if (saving) return;
    if (dirty) {
      const discard = await confirm({
        title: "Descartar alterações?",
        message: "Há alterações não salvas neste formulário. Se continuar, elas serão perdidas.",
        confirmLabel: "Descartar alterações",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });
      if (!discard) return;
    }
    onClose();
  }

  async function submit() {
    if (savingRef.current) return;
    const parsed = squadInputSchema.safeParse(draft);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify("error", "Revise os campos destacados antes de salvar.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await saveSquad(squad?.id ?? null, parsed.data);
      notify("success", squad ? "Squad atualizado." : `Squad ${saved.name} criado.`);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else notify("error", "Não foi possível salvar o squad.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const tile = "relative flex h-11 w-11 items-center justify-center rounded-xl border transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20";

  return (
    <Modal
      open
      onClose={requestClose}
      size="lg"
      title={squad ? `Editar squad ${squad.name}` : "Novo squad"}
      description="Squads aparecem no organograma abaixo da liderança escolhida."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {squad ? "Salvar alterações" : "Criar squad"}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="Nome" required value={draft.name} error={errors.name} onChange={(e) => set("name", e.target.value)} data-autofocus />
          <SelectField
            label="Liderança"
            value={draft.leaderId ?? ""}
            error={errors.leaderId}
            hint="Pessoa a quem o squad responde (topo do organograma)."
            onChange={(e) => set("leaderId", e.target.value || null)}
          >
            <option value="">Sem liderança definida</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role}
              </option>
            ))}
          </SelectField>
        </div>
        <TextAreaField label="Descrição" value={draft.description} error={errors.description} rows={2} onChange={(e) => set("description", e.target.value)} />

        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-navy">Ícone</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ICONS.map((icon) => {
              const Glyph = PLATFORM_GLYPHS[icon];
              const checked = draft.icon === icon;
              return (
                <label key={icon} title={PLATFORM_ICON_LABEL[icon]} className={cn(tile, checked ? "border-violet bg-brand-soft text-violet" : "border-line text-muted hover:border-line-strong")}>
                  <HiddenInput type="radio" name="squad-icon" checked={checked} onChange={() => set("icon", icon)} aria-label={PLATFORM_ICON_LABEL[icon]} />
                  <Glyph size={20} aria-hidden />
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-[13px] font-bold text-navy">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {PLATFORM_ACCENTS.map((accent) => {
              const checked = draft.accent === accent;
              return (
                <label key={accent} title={ACCENT_LABEL[accent]} className={cn(tile, checked ? "border-violet" : "border-line hover:border-line-strong")}>
                  <HiddenInput type="radio" name="squad-accent" checked={checked} onChange={() => set("accent", accent)} aria-label={ACCENT_LABEL[accent]} />
                  <span aria-hidden className="flex h-7 w-7 items-center justify-center rounded-lg text-white" style={{ background: ACCENT_TONE[accent].solid }}>
                    {checked && <Check size={15} strokeWidth={3} />}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <ChipMultiSelect
          legend="Plataformas sob responsabilidade"
          hint="Define as iniciativas relacionadas ao squad e aos seus integrantes."
          error={errors.platformIds}
          options={data.platforms.map((p) => ({ value: p.id, label: p.name }))}
          value={draft.platformIds}
          onChange={(v) => set("platformIds", v)}
        />
        <button type="submit" hidden />
      </form>
    </Modal>
  );
}
