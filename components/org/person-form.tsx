"use client";

import { Camera, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ImageEditor } from "@/components/initiatives/form/image-editor";
import { Avatar } from "@/components/org/avatar";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { LinesField, SelectField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { useRoadmap } from "@/lib/client/store";
import { createsCycle } from "@/lib/domain/org";
import type { Person, PersonInput } from "@/lib/domain/types";
import { fieldErrors, personInputSchema } from "@/lib/validation/schemas";

/** Valor do select de liderança para "fora do organograma". */
const EXTERNAL = "__externo__";

export const emptyPerson = (defaults: Partial<PersonInput> = {}): PersonInput => ({
  name: "",
  role: "",
  area: "",
  email: "",
  location: "",
  managerId: null,
  externalManager: "",
  squadId: null,
  responsibilities: [],
  photo: null,
  ...defaults,
});

const toInput = ({ id: _id, squadOrder: _order, ...input }: Person): PersonInput => input;

export function PersonForm({
  person,
  defaults,
  onClose,
  onSaved,
}: {
  /** null = novo colaborador */
  person: Person | null;
  defaults?: Partial<PersonInput>;
  onClose: () => void;
  onSaved: (person: Person) => void;
}) {
  const { data, savePerson } = useRoadmap();
  const notify = useToast();
  const confirm = useConfirm();
  const initial = useMemo(() => (person ? toInput(person) : emptyPerson(defaults)), [person, defaults]);
  const [draft, setDraft] = useState<PersonInput>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [external, setExternal] = useState(!initial.managerId && !!initial.externalManager);
  const savingRef = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const areas = useMemo(() => [...new Set(data.people.map((p) => p.area).filter(Boolean))].sort(), [data.people]);
  // Lideranças possíveis: qualquer pessoa, exceto a própria e quem já responde a ela (evita ciclos).
  const managers = data.people
    .filter((p) => !person || (p.id !== person.id && !createsCycle(data.people, person.id, p.id)))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  const set = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) => {
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
    const payload = {
      ...draft,
      externalManager: external ? draft.externalManager : "",
      responsibilities: draft.responsibilities.map((r) => r.trim()).filter(Boolean),
    };
    const parsed = personInputSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify("error", "Revise os campos destacados antes de salvar.");
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const saved = await savePerson(person?.id ?? null, parsed.data);
      notify("success", person ? "Colaborador atualizado." : `${saved.name} foi adicionado ao organograma.`);
      onSaved(saved);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else notify("error", "Não foi possível salvar o colaborador.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const managerValue = external ? EXTERNAL : (draft.managerId ?? "");

  return (
    <>
      <Modal
        open
        onClose={requestClose}
        size="lg"
        title={person ? `Editar ${person.name}` : "Novo colaborador"}
        description="Dados exibidos no organograma e no painel de detalhes. Campos com * são obrigatórios."
        footer={
          <>
            <Button variant="ghost" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" loading={saving} onClick={submit}>
              {person ? "Salvar alterações" : "Adicionar colaborador"}
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
          <div className="flex items-center gap-4">
            <Avatar person={{ id: person?.id ?? (draft.name || "novo"), name: draft.name || "?", photo: draft.photo }} size={72} />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" icon={<Camera size={15} />} onClick={() => setEditingPhoto(true)}>
                {draft.photo ? "Ajustar foto" : "Enviar foto"}
              </Button>
              {draft.photo && (
                <Button size="sm" variant="ghost" icon={<Trash2 size={15} />} onClick={() => set("photo", null)}>
                  Remover foto
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nome" required value={draft.name} error={errors.name} onChange={(e) => set("name", e.target.value)} data-autofocus />
            <TextField label="Cargo" required value={draft.role} error={errors.role} placeholder="Ex.: Product Manager" onChange={(e) => set("role", e.target.value)} />
            <TextField
              label="Área"
              value={draft.area}
              error={errors.area}
              list="org-areas"
              placeholder="Ex.: Produto, Engenharia, Design"
              onChange={(e) => set("area", e.target.value)}
            />
            <datalist id="org-areas">
              {areas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
            <SelectField label="Squad" value={draft.squadId ?? ""} error={errors.squadId} onChange={(e) => set("squadId", e.target.value || null)}>
              <option value="">Sem squad</option>
              {data.squads.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </SelectField>
            <TextField label="E-mail" type="email" value={draft.email} error={errors.email} onChange={(e) => set("email", e.target.value)} />
            <TextField label="Localização" value={draft.location} error={errors.location} placeholder="Ex.: Rio de Janeiro, RJ" onChange={(e) => set("location", e.target.value)} />
            <SelectField
              label="Liderança direta"
              value={managerValue}
              error={errors.managerId}
              onChange={(e) => {
                const value = e.target.value;
                setExternal(value === EXTERNAL);
                set("managerId", value && value !== EXTERNAL ? value : null);
              }}
            >
              <option value="">Não definida</option>
              {managers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.role}
                </option>
              ))}
              <option value={EXTERNAL}>Fora do organograma…</option>
            </SelectField>
            {external && (
              <TextField
                label="Liderança fora do organograma"
                value={draft.externalManager}
                error={errors.externalManager}
                placeholder="Ex.: CEO · Jovens Gênios"
                hint="Use quando a liderança não está cadastrada aqui."
                onChange={(e) => set("externalManager", e.target.value)}
              />
            )}
          </div>

          <LinesField
            label="Responsabilidades"
            value={draft.responsibilities}
            error={errors.responsibilities}
            rows={4}
            onChange={(v) => set("responsibilities", v)}
          />
          {/* Envio pelo Enter nos campos de texto. */}
          <button type="submit" hidden />
        </form>
      </Modal>

      {editingPhoto && (
        <ImageEditor
          current={draft.photo}
          title="Foto do colaborador"
          description="Envie uma foto e ajuste o enquadramento. Ela aparece em círculo no organograma."
          onClose={() => setEditingPhoto(false)}
          onApply={(img) => {
            set("photo", img);
            setEditingPhoto(false);
          }}
        />
      )}
    </>
  );
}
