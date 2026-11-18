"use client";

import { X } from "lucide-react";
import { useId, useMemo } from "react";
import { Avatar } from "@/components/org/avatar";
import { SelectField } from "@/components/ui/fields";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import type { Person } from "@/lib/domain/types";

const collator = new Intl.Collator("pt-BR", { sensitivity: "base" });

/** Colaboradores de Times & Squads em ordem alfabética. */
function usePeople() {
  const { data } = useRoadmap();
  return useMemo(() => [...data.people].sort((a, b) => collator.compare(a.name, b.name)), [data.people]);
}

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[14.5px] text-ink transition-colors hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12 aria-[invalid=true]:border-[#c42b3a]";

const optionLabel = (p: Person) => (p.role ? `${p.name} · ${p.role}` : p.name);

/** Escolha de um colaborador de Times & Squads (ou "Não informado"). */
export function PersonSelectField({
  label,
  value,
  onChange,
  hint,
  error,
  className,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
  hint?: string;
  error?: string;
  className?: string;
}) {
  const people = usePeople();
  const missing = !!value && !people.some((p) => p.id === value);
  return (
    <SelectField
      label={label}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
      hint={hint ?? (people.length ? undefined : "Cadastre as pessoas em Times & Squads para escolher aqui.")}
      error={error}
      className={className}
    >
      <option value="">Não informado</option>
      {missing && <option value={value!}>Colaborador removido de Times & Squads</option>}
      {people.map((p) => (
        <option key={p.id} value={p.id}>
          {optionLabel(p)}
        </option>
      ))}
    </SelectField>
  );
}

/** Vários colaboradores de Times & Squads: escolhidos aparecem com foto e podem ser retirados. */
export function PeopleMultiField({
  label,
  value,
  onChange,
  exclude = [],
  hint,
  error,
  className,
}: {
  label: string;
  value: string[];
  onChange: (ids: string[]) => void;
  /** Quem não deve aparecer para escolha (ex.: quem já é o criador). */
  exclude?: (string | null)[];
  hint?: string;
  error?: string;
  className?: string;
}) {
  const people = usePeople();
  const id = useId();
  const available = people.filter((p) => !value.includes(p.id) && !exclude.includes(p.id));
  const describedBy = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset className={cn("flex flex-col gap-2", className)} aria-describedby={describedBy}>
      <legend className="mb-1.5 text-[13px] font-bold text-navy">{label}</legend>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {value.map((personId) => {
            const person = people.find((p) => p.id === personId);
            const name = person?.name ?? "Colaborador removido";
            return (
              <li key={personId} className="inline-flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-1.5 text-[13px] font-semibold text-ink">
                {person ? <Avatar person={person} size={24} /> : <span className="h-6 w-6 rounded-full bg-[#eef2fa]" aria-hidden />}
                {name}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== personId))}
                  aria-label={`Retirar ${name}`}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-[#f2f5fb] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                >
                  <X size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {available.length > 0 ? (
        <Select
          value=""
          onChange={(v) => v && onChange([...value, v])}
          aria-label={`Adicionar: ${label}`}
          aria-invalid={!!error}
          className={cn(control, "h-11 pr-3")}
        >
          <option value="">Adicionar colaborador…</option>
          {available.map((p) => (
            <option key={p.id} value={p.id}>
              {optionLabel(p)}
            </option>
          ))}
        </Select>
      ) : (
        !value.length && <p className="text-[13px] text-muted">Cadastre as pessoas em Times & Squads para escolher aqui.</p>
      )}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs font-semibold text-[#c42b3a]">
          {error}
        </p>
      )}
    </fieldset>
  );
}
