"use client";

import { ArrowLeftRight, Pencil, Repeat2, Trash2, UserPlus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { MoveDialog, ReplaceDialog } from "@/components/org/person-dialogs";
import { PersonForm } from "@/components/org/person-form";
import { SquadForm } from "@/components/org/squad-form";
import type { MenuAction } from "@/components/ui/action-menu";
import { useConfirm } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { plural } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { directReports, squadMembers, squadsLedBy } from "@/lib/domain/org";
import type { Person, PersonInput, Squad } from "@/lib/domain/types";

type Dialog =
  | { type: "person"; person: Person | null; defaults?: Partial<PersonInput> }
  | { type: "squad"; squad: Squad | null }
  | { type: "move"; person: Person }
  | { type: "replace"; person: Person };

interface OrgActions {
  /** Colaborador aberto no painel de detalhes (?colaborador=<id>). */
  selectedId: string | null;
  openPerson: (id: string) => void;
  closePerson: () => void;
  canEdit: boolean;
  newPerson: (defaults?: Partial<PersonInput>) => void;
  editPerson: (person: Person) => void;
  newSquad: () => void;
  editSquad: (squad: Squad) => void;
  movePerson: (person: Person) => void;
  replacePerson: (person: Person) => void;
  removePerson: (person: Person) => Promise<void>;
  removeSquad: (squad: Squad) => Promise<void>;
  personMenu: (person: Person) => MenuAction[];
  squadMenu: (squad: Squad) => MenuAction[];
}

const OrgContext = createContext<OrgActions | null>(null);

export function OrgActionsProvider({ children }: { children: ReactNode }) {
  const { data, removePerson: deletePerson, removeSquad: deleteSquad } = useRoadmap();
  const notify = useToast();
  const confirm = useConfirm();
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const canEdit = data.writable;

  const selectedId = params.get("colaborador");
  const setSelected = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (id) next.set("colaborador", id);
      else next.delete("colaborador");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const removePerson = useCallback(
    async (person: Person) => {
      const led = squadsLedBy(data.squads, person.id);
      const reports = directReports(data.people, person.id);
      const effects = [
        led.length ? `${led.map((s) => s.name).join(", ")} ficará${led.length > 1 ? "ão" : ""} sem liderança` : null,
        reports.length ? `${plural(reports.length, "liderado direto ficará", "liderados diretos ficarão")} sem liderança` : null,
      ].filter(Boolean);
      const ok = await confirm({
        title: `Remover ${person.name}?`,
        message: (
          <>
            O cadastro será excluído do organograma.
            {effects.length > 0 && <> Além disso: {effects.join("; ")}.</>} Para manter a estrutura, use <strong>Substituir</strong>.
          </>
        ),
        confirmLabel: "Remover colaborador",
        tone: "danger",
      });
      if (!ok) return;
      try {
        await deletePerson(person.id);
        if (selectedId === person.id) setSelected(null);
        notify("success", `${person.name} foi removido do organograma.`);
      } catch (error) {
        notify("error", error instanceof ApiError ? error.message : "Não foi possível remover o colaborador.");
      }
    },
    [confirm, data.people, data.squads, deletePerson, notify, selectedId, setSelected],
  );

  const removeSquad = useCallback(
    async (squad: Squad) => {
      const members = squadMembers(data.people, squad.id);
      const ok = await confirm({
        title: `Excluir o squad ${squad.name}?`,
        message: members.length
          ? `${plural(members.length, "integrante continua", "integrantes continuam")} no cadastro, sem squad, e pode${members.length > 1 ? "m" : ""} ser realocado${members.length > 1 ? "s" : ""} depois.`
          : "O squad não tem integrantes.",
        confirmLabel: "Excluir squad",
        tone: "danger",
      });
      if (!ok) return;
      try {
        await deleteSquad(squad.id);
        notify("success", `Squad ${squad.name} excluído.`);
      } catch (error) {
        notify("error", error instanceof ApiError ? error.message : "Não foi possível excluir o squad.");
      }
    },
    [confirm, data.people, deleteSquad, notify],
  );

  const value = useMemo<OrgActions>(
    () => ({
      selectedId,
      openPerson: (id) => setSelected(id),
      closePerson: () => setSelected(null),
      canEdit,
      newPerson: (defaults) => setDialog({ type: "person", person: null, defaults }),
      editPerson: (person) => setDialog({ type: "person", person }),
      newSquad: () => setDialog({ type: "squad", squad: null }),
      editSquad: (squad) => setDialog({ type: "squad", squad }),
      movePerson: (person) => setDialog({ type: "move", person }),
      replacePerson: (person) => setDialog({ type: "replace", person }),
      removePerson,
      removeSquad,
      personMenu: (person) =>
        canEdit
          ? [
              { label: "Editar", icon: Pencil, onSelect: () => setDialog({ type: "person", person }) },
              { label: "Realocar", icon: ArrowLeftRight, onSelect: () => setDialog({ type: "move", person }) },
              { label: "Substituir", icon: Repeat2, onSelect: () => setDialog({ type: "replace", person }) },
              { label: "Remover", icon: Trash2, onSelect: () => void removePerson(person), danger: true },
            ]
          : [],
      squadMenu: (squad) =>
        canEdit
          ? [
              { label: "Editar squad", icon: Pencil, onSelect: () => setDialog({ type: "squad", squad }) },
              { label: "Adicionar colaborador", icon: UserPlus, onSelect: () => setDialog({ type: "person", person: null, defaults: { squadIds: [squad.id] } }) },
              { label: "Excluir squad", icon: Trash2, onSelect: () => void removeSquad(squad), danger: true },
            ]
          : [],
    }),
    [selectedId, setSelected, canEdit, removePerson, removeSquad],
  );

  const close = () => setDialog(null);
  return (
    <OrgContext.Provider value={value}>
      {children}
      {dialog?.type === "person" && (
        <PersonForm
          person={dialog.person}
          defaults={dialog.defaults}
          onClose={close}
          onSaved={(saved) => {
            close();
            setSelected(saved.id);
          }}
        />
      )}
      {dialog?.type === "squad" && <SquadForm squad={dialog.squad} onClose={close} onSaved={close} />}
      {dialog?.type === "move" && <MoveDialog person={dialog.person} onClose={close} />}
      {dialog?.type === "replace" && (
        <ReplaceDialog
          person={dialog.person}
          onClose={close}
          onDone={(substitute) => {
            close();
            setSelected(substitute.id);
          }}
        />
      )}
    </OrgContext.Provider>
  );
}

export function useOrgActions(): OrgActions {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error("useOrgActions deve ser usado dentro de <OrgActionsProvider>.");
  return ctx;
}
