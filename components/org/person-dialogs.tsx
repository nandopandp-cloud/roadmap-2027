"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/org/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Checkbox, HiddenInput, SelectField, TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn, plural } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { directReports, orderIn, sameZone, squadMembers, squadsLedBy } from "@/lib/domain/org";
import type { OrgZone, Person, PersonMove, Squad } from "@/lib/domain/types";

const squadName = (squads: { id: string; name: string }[], id: string | null) => squads.find((s) => s.id === id)?.name ?? "Sem squad";

const names = (squads: Squad[], ids: string[]) => {
  const list = ids.map((id) => squadName(squads, id));
  return list.length > 1 ? `${list.slice(0, -1).join(", ")} e ${list.at(-1)}` : (list[0] ?? "");
};

/** Mensagem de sucesso de uma realocação (arrastar ou diálogo). */
export function describeMove(squads: Squad[], person: Person, move: PersonMove): string {
  const { from = null, to, keep = false } = move;
  const leaders = (zone: OrgZone) => (zone.kind === "leaders" ? names(squads, zone.squadIds) : "");
  if (from && sameZone(from, to)) return to.kind === "leaders" ? "Ordem das lideranças atualizada." : `Ordem de ${squadName(squads, to.squadId)} atualizada.`;
  if (to.kind === "leaders") return keep ? `${person.name} agora também lidera ${leaders(to)}.` : `${person.name} passou a liderar ${leaders(to)}.`;
  const target = squadName(squads, to.squadId);
  if (!to.squadId) return from?.kind === "leaders" ? `${person.name} deixou a liderança de ${leaders(from)}.` : `${person.name} saiu de ${from?.squadId ? squadName(squads, from.squadId) : "todos os squads"}.`;
  if (keep) return `${person.name} agora também participa de ${target}.`;
  if (from?.kind === "leaders") return `${person.name} deixou a liderança de ${leaders(from)} e entrou em ${target}.`;
  if (!from?.squadId) return `${person.name} entrou em ${target}.`;
  return `${person.name} foi realocado de ${squadName(squads, from.squadId)} para ${target}.`;
}

/** Realocar pelo teclado ou toque: alternativa ao arrastar no organograma. */
export function MoveDialog({ person, onClose }: { person: Person; onClose: () => void }) {
  const { data, movePerson } = useRoadmap();
  const notify = useToast();
  const current = data.squads.filter((s) => orderIn(person, s.id) !== undefined);
  const [fromId, setFromId] = useState<string | null>(current[0]?.id ?? null);
  const [squadId, setSquadId] = useState<string | null>(fromId);
  const [keep, setKeep] = useState(false);
  const members = squadMembers(data.people, squadId, person.id);
  // Posição = id de quem fica antes ("" = primeira posição); começa na posição atual, se já participa.
  const positionIn = (target: string | null) => {
    if (!target) return "";
    const own = squadMembers(data.people, target);
    const index = own.findIndex((p) => p.id === person.id);
    if (index < 0) return own.at(-1)?.id ?? "";
    return index > 0 ? own[index - 1].id : "";
  };
  const [afterId, setAfterId] = useState<string>(() => positionIn(fromId));
  const [saving, setSaving] = useState(false);
  const canKeep = !!fromId && !!squadId && squadId !== fromId;

  const changeSquad = (next: string | null) => {
    setSquadId(next);
    setAfterId(positionIn(next));
  };

  async function submit() {
    setSaving(true);
    try {
      const first = members[0]?.id ?? null;
      const move: PersonMove = {
        from: { kind: "squad", squadId: fromId },
        to: { kind: "squad", squadId },
        keep: keep && canKeep,
        ...(afterId ? { afterId } : { beforeId: first }),
      };
      await movePerson(person.id, move);
      notify("success", fromId === squadId ? "Posição atualizada." : describeMove(data.squads, person, move));
      onClose();
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível realocar o colaborador.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      title={`Realocar ${person.name}`}
      description="Escolha o squad de destino e a posição. No organograma, você também pode arrastar o card (segure Alt/Option ao soltar para adicionar sem tirar do squad atual)."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            {keep && canKeep ? "Adicionar" : "Realocar"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {current.length > 1 && (
          <SelectField label="Sair de" value={fromId ?? ""} onChange={(e) => setFromId(e.target.value || null)}>
            {current.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </SelectField>
        )}
        <SelectField label="Squad de destino" value={squadId ?? ""} onChange={(e) => changeSquad(e.target.value || null)} data-autofocus>
          {data.squads.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
              {orderIn(person, s.id) !== undefined ? " (atual)" : ""}
            </option>
          ))}
          <option value="">Sem squad</option>
        </SelectField>
        {squadId && (
          <SelectField label="Posição" value={afterId} onChange={(e) => setAfterId(e.target.value)}>
            <option value="">Primeira posição</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                Depois de {m.name}
              </option>
            ))}
          </SelectField>
        )}
        {canKeep && (
          <Checkbox
            label={`Continuar também em ${squadName(data.squads, fromId)}`}
            hint="A pessoa passa a aparecer nos dois squads."
            checked={keep}
            onChange={setKeep}
          />
        )}
      </div>
    </Modal>
  );
}

/**
 * Substituir: o substituto assume squads e posições, squads liderados, liderados diretos e a
 * liderança de quem sai; opcionalmente também o cargo e as responsabilidades.
 */
export function ReplaceDialog({ person, onClose, onDone }: { person: Person; onClose: () => void; onDone: (substitute: Person) => void }) {
  const { data, replacePerson } = useRoadmap();
  const notify = useToast();
  const [mode, setMode] = useState<"existente" | "novo">("existente");
  const [substituteId, setSubstituteId] = useState("");
  const [newPerson, setNewPerson] = useState({ name: "", email: "" });
  const [takeRole, setTakeRole] = useState(true);
  const [outgoing, setOutgoing] = useState<"manter" | "remover">("manter");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const candidates = data.people.filter((p) => p.id !== person.id).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  const led = squadsLedBy(data.squads, person.id);
  const reports = directReports(data.people, person.id).filter((p) => p.id !== substituteId);
  const transfers = [
    person.memberships.length
      ? `posição ${person.memberships.length > 1 ? "nos squads" : "no squad"} ${names(data.squads, person.memberships.map((m) => m.squadId))}`
      : null,
    led.length ? `liderança de ${led.map((s) => s.name).join(", ")}` : null,
    reports.length ? plural(reports.length, "liderado direto", "liderados diretos") : null,
    person.managerId || person.externalManager ? "a mesma liderança direta" : null,
    takeRole ? `o cargo (${person.role}) e as responsabilidades` : null,
  ].filter(Boolean);

  async function submit() {
    const fields: Record<string, string> = {};
    if (mode === "existente" && !substituteId) fields.substituteId = "Escolha quem vai substituir.";
    if (mode === "novo" && !newPerson.name.trim()) fields["newPerson.name"] = "O nome é obrigatório.";
    if (Object.keys(fields).length) return setErrors(fields);
    setSaving(true);
    try {
      const substitute = await replacePerson(person.id, {
        substituteId: mode === "existente" ? substituteId : null,
        newPerson: mode === "novo" ? newPerson : null,
        takeRole,
        outgoing,
      });
      notify("success", `${substitute.name} substituiu ${person.name}.`);
      onDone(substitute);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else notify("error", "Não foi possível concluir a substituição.");
    } finally {
      setSaving(false);
    }
  }

  const option = (checked: boolean) =>
    cn(
      "relative flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-[14px] transition-colors has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
      checked ? "border-violet bg-brand-soft/60" : "border-line hover:border-line-strong",
    );
  const radio = (checked: boolean) => (
    <span aria-hidden className={cn("mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2", checked ? "border-violet" : "border-line-strong")}>
      {checked && <span className="h-2 w-2 rounded-full bg-violet" />}
    </span>
  );

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`Substituir ${person.name}`}
      description="Use quando outra pessoa assume a posição no organograma."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" loading={saving} onClick={submit}>
            Substituir
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-bold text-navy">Quem assume</legend>
          <label className={option(mode === "existente")}>
            <HiddenInput type="radio" name="replace-mode" checked={mode === "existente"} onChange={() => setMode("existente")} />
            {radio(mode === "existente")}
            <span className="font-semibold text-ink">Um colaborador já cadastrado</span>
          </label>
          <label className={option(mode === "novo")}>
            <HiddenInput type="radio" name="replace-mode" checked={mode === "novo"} onChange={() => setMode("novo")} />
            {radio(mode === "novo")}
            <span className="font-semibold text-ink">Uma pessoa nova (cadastrar agora)</span>
          </label>
        </fieldset>

        {mode === "existente" ? (
          <SelectField label="Substituto" required value={substituteId} error={errors.substituteId} onChange={(e) => setSubstituteId(e.target.value)}>
            <option value="">Selecione…</option>
            {candidates.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {p.role}
              </option>
            ))}
          </SelectField>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Nome" required value={newPerson.name} error={errors["newPerson.name"]} onChange={(e) => setNewPerson((v) => ({ ...v, name: e.target.value }))} />
            <TextField label="E-mail" type="email" value={newPerson.email} error={errors["newPerson.email"]} onChange={(e) => setNewPerson((v) => ({ ...v, email: e.target.value }))} />
          </div>
        )}

        <Checkbox label="Assumir cargo e responsabilidades" hint={`Cargo atual: ${person.role}.`} checked={takeRole} onChange={setTakeRole} />

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13px] font-bold text-navy">E {person.name}?</legend>
          <label className={option(outgoing === "manter")}>
            <HiddenInput type="radio" name="replace-outgoing" checked={outgoing === "manter"} onChange={() => setOutgoing("manter")} />
            {radio(outgoing === "manter")}
            <span>
              <span className="block font-semibold text-ink">Manter no cadastro, sem squad</span>
              <span className="block text-[12.5px] text-muted">Pode ser realocado depois.</span>
            </span>
          </label>
          <label className={option(outgoing === "remover")}>
            <HiddenInput type="radio" name="replace-outgoing" checked={outgoing === "remover"} onChange={() => setOutgoing("remover")} />
            {radio(outgoing === "remover")}
            <span>
              <span className="block font-semibold text-ink">Remover do organograma</span>
              <span className="block text-[12.5px] text-muted">O cadastro é excluído.</span>
            </span>
          </label>
        </fieldset>

        <div className="flex items-start gap-3 rounded-2xl bg-[#f6f8fd] px-4 py-3">
          <Avatar person={person} size={36} />
          <ArrowRight size={18} className="mt-2 shrink-0 text-muted" aria-hidden />
          <p className="text-[13.5px] leading-relaxed text-[#2b3163]">
            {transfers.length ? (
              <>O substituto assume: {transfers.join("; ")}.</>
            ) : (
              <>{person.name} não tem squad, liderados nem squads liderados para transferir.</>
            )}
          </p>
        </div>
      </div>
    </Modal>
  );
}
