"use client";

import { Hourglass } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { TextAreaField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { fieldErrors, upcomingInitiativeSchema } from "@/lib/validation/schemas";

const FORM_ID = "sinalizar-iniciativa";

/**
 * Sinalizar uma iniciativa "em breve": só nome e descrição, para avisar que ela será
 * considerada. O cadastro completo (problema, PRD, planejamento…) fica para depois.
 */
export function UpcomingInitiativeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return <UpcomingForm onClose={onClose} />;
}

function UpcomingForm({ onClose }: { onClose: () => void }) {
  const { data, upsertInitiative } = useRoadmap();
  const { open } = useInitiativeSelection();
  const confirm = useConfirm();
  const notify = useToast();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = !!(title.trim() || summary.trim());

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const clash = title.trim() ? data.initiatives.find((i) => norm(i.title) === norm(title)) : undefined;

  async function requestClose() {
    if (saving) return;
    if (dirty) {
      const discard = await confirm({
        title: "Descartar iniciativa?",
        message: "O nome e a descrição preenchidos serão perdidos.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });
      if (!discard) return;
    }
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const parsed = upcomingInitiativeSchema.safeParse({ title, summary });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setSaving(true);
    try {
      const saved = await api.createUpcomingInitiative(parsed.data);
      upsertInitiative(saved);
      onClose();
      notify("success", `${saved.id} sinalizada como em breve.`);
      open(saved.id);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else {
        notify("error", "Não foi possível sinalizar a iniciativa.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={requestClose}
      title="Sinalizar iniciativa em breve"
      description="Avise que uma nova iniciativa será considerada. Basta o nome e, se quiser, uma descrição — problema, PRD e planejamento podem ser completados depois."
      footer={
        <>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} icon={<Hourglass size={16} />} loading={saving}>
            Sinalizar iniciativa
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={submit} noValidate className="flex flex-col gap-5">
        <TextField
          label="Nome da iniciativa"
          required
          maxLength={160}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setErrors((prev) => ({ ...prev, title: "" }));
          }}
          error={errors.title || (clash ? `Já existe uma iniciativa com este nome (${clash.id}).` : undefined)}
          placeholder="Ex.: Trilhas de leitura para o 1º ano"
          data-autofocus
        />
        <TextAreaField
          label="Descrição"
          hint="Opcional. Uma ou duas linhas exibidas no card da iniciativa."
          rows={3}
          maxLength={400}
          value={summary}
          onChange={(e) => {
            setSummary(e.target.value);
            setErrors((prev) => ({ ...prev, summary: "" }));
          }}
          error={errors.summary || undefined}
        />
      </form>
    </Modal>
  );
}
