"use client";

import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { cleanInput, emptyInput, FORM_STEPS, stepForField, toInput } from "@/components/initiatives/form/defaults";
import { STEP_COMPONENTS } from "@/components/initiatives/form/steps";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import type { InitiativeInput } from "@/lib/domain/types";

type InputState = InitiativeInput;
import { fieldErrors, initiativeInputSchema } from "@/lib/validation/schemas";

/** Monta o formulário quando solicitado pelo store (nova iniciativa ou edição). */
export function InitiativeFormHost() {
  const { form } = useRoadmap();
  if (!form) return null;
  return (
    <Suspense fallback={null}>
      <InitiativeForm key={`${form.initiativeId ?? "nova"}-${form.step ?? 0}`} initiativeId={form.initiativeId} initialStep={form.step ?? 0} />
    </Suspense>
  );
}

function InitiativeForm({ initiativeId, initialStep }: { initiativeId: string | null; initialStep: number }) {
  const { data, initiativeById, closeForm, upsertInitiative } = useRoadmap();
  const { open } = useInitiativeSelection();
  const confirm = useConfirm();
  const notify = useToast();
  const editing = initiativeId ? initiativeById(initiativeId) : undefined;

  // Estado inicial congelado na abertura: base para detectar alterações não salvas.
  const [initial] = useState<InputState>(() => (editing ? toInput(editing) : emptyInput()));
  const [draft, setDraft] = useState<InitiativeInput>(initial);
  const [step, setStep] = useState(initialStep);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const dirty = JSON.stringify(cleanInput(draft)) !== JSON.stringify(cleanInput(initial));

  // Alerta ao sair/recarregar a página com alterações não salvas.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  useEffect(() => {
    bodyRef.current?.closest(".overflow-y-auto")?.scrollTo({ top: 0 });
  }, [step]);

  const nextId = useMemo(() => {
    const max = data.initiatives.reduce((acc, i) => Math.max(acc, Number(i.id.slice(-3)) || 0), 0);
    return `JG-2027-${String(max + 1).padStart(3, "0")}`;
  }, [data.initiatives]);

  const set = <K extends keyof InitiativeInput>(key: K, value: InitiativeInput[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      if (!Object.keys(e).some((k) => k === key || k.startsWith(`${String(key)}.`))) return e;
      return Object.fromEntries(Object.entries(e).filter(([k]) => k !== key && !k.startsWith(`${String(key)}.`)));
    });
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
    closeForm();
  }

  function showErrors(map: Record<string, string>) {
    setErrors(map);
    const steps = Object.keys(map).map(stepForField);
    if (steps.length) setStep(Math.min(...steps));
  }

  async function submit() {
    if (savingRef.current) return; // impede envio duplicado
    const payload = cleanInput(draft);
    const parsed = initiativeInputSchema.safeParse(payload);
    if (!parsed.success) {
      showErrors(fieldErrors(parsed.error));
      notify("error", "Revise os campos destacados antes de salvar.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = editing ? await api.updateInitiative(editing.id, parsed.data) : await api.createInitiative(parsed.data);
      upsertInitiative(saved);
      closeForm();
      notify("success", editing ? "Iniciativa atualizada." : `Iniciativa ${saved.id} criada.`);
      if (!editing) open(saved.id);
    } catch (error) {
      if (error instanceof ApiError) {
        if (Object.keys(error.fields).length) showErrors(error.fields);
        notify("error", error.message);
      } else {
        notify("error", "Não foi possível salvar a iniciativa.");
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (initiativeId && !editing) {
    return (
      <Modal open onClose={closeForm} title="Iniciativa não encontrada" size="sm" footer={<Button onClick={closeForm}>Fechar</Button>}>
        <p className="text-sm text-muted">A iniciativa {initiativeId} não existe mais.</p>
      </Modal>
    );
  }

  const StepComponent = STEP_COMPONENTS[step];
  const stepsWithErrors = new Set(Object.keys(errors).map(stepForField));
  const last = step === FORM_STEPS.length - 1;

  return (
    <Modal
      open
      onClose={requestClose}
      size="xl"
      bare
      title={editing ? `Editar ${editing.id}` : "Nova iniciativa"}
      description={editing ? editing.title : "Campos obrigatórios: nome, problema, motivador, resultado esperado e status. O restante pode ser preenchido aos poucos."}
      footer={
        <>
          <p className="mr-auto hidden text-[13px] text-muted sm:block" aria-live="polite">
            {dirty ? "Alterações não salvas" : "Nenhuma alteração"}
          </p>
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancelar
          </Button>
          {step > 0 && (
            <Button icon={<ChevronLeft size={16} />} onClick={() => setStep((s) => s - 1)} disabled={saving}>
              Voltar
            </Button>
          )}
          {!last && (
            <Button onClick={() => setStep((s) => s + 1)} disabled={saving}>
              Próxima etapa <ChevronRight size={16} aria-hidden />
            </Button>
          )}
          <Button variant="primary" icon={<Check size={16} />} loading={saving} onClick={submit} disabled={editing ? !dirty : false}>
            {editing ? "Salvar alterações" : "Criar iniciativa"}
          </Button>
        </>
      }
    >
      <div className="flex min-h-full flex-col md:flex-row">
        <nav aria-label="Etapas do formulário" className="shrink-0 border-b border-line bg-[#f8faff] p-3 md:w-64 md:border-b-0 md:border-r md:p-5">
          <ol className="flex gap-1 overflow-x-auto md:flex-col md:gap-1.5">
            {FORM_STEPS.map((s, idx) => (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setStep(idx)}
                  aria-current={step === idx ? "step" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    step === idx ? "bg-surface shadow-[var(--shadow-card)]" : "hover:bg-white/70",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold",
                      stepsWithErrors.has(idx) ? "bg-[#fdecec] text-[#b3242f]" : step === idx ? "bg-violet text-white" : "bg-[#e9edf7] text-muted",
                    )}
                  >
                    {stepsWithErrors.has(idx) ? "!" : idx + 1}
                  </span>
                  <span className="min-w-0">
                    <span className={cn("block whitespace-nowrap text-[13.5px] font-bold md:whitespace-normal", step === idx ? "text-navy" : "text-ink")}>{s.label}</span>
                    <span className="hidden text-[12px] text-muted md:block">{s.hint}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
        <div ref={bodyRef} className="min-w-0 flex-1 px-5 py-6 sm:px-8">
          <h3 className="mb-5 text-[18px] font-black text-navy">
            {step + 1}. {FORM_STEPS[step].label}
          </h3>
          <StepComponent
            draft={draft}
            set={set}
            errors={errors}
            platforms={data.platforms}
            others={data.initiatives.filter((i) => i.id !== initiativeId)}
            folder={editing?.repoFolder}
            editingId={editing?.id ?? null}
            nextId={nextId}
          />
        </div>
      </div>
    </Modal>
  );
}
