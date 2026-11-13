"use client";

import { Eye, PenLine, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badges";
import { RadioCards } from "@/components/ui/fields";
import { formatDate } from "@/lib/client/cn";
import { ACCESS_TONE } from "@/lib/client/tones";
import { ACCESS_LEVELS } from "@/lib/domain/constants";
import { ACCESS_LABEL, ACCESS_SUMMARY } from "@/lib/domain/access";
import { EFFORT_TRACK_LABEL } from "@/lib/domain/effort";
import { canPlanRoadmap2026, effortTracksByRole, evidenceTracksByRole } from "@/lib/domain/effort-access";
import type { AccessLevel, Person } from "@/lib/domain/types";

export const ACCESS_ICON: Record<AccessLevel, typeof Eye> = { admin: ShieldCheck, editor: PenLine, consulta: Eye };

/** Selo da permissão na plataforma (painel do colaborador, lista de pessoas). */
export function AccessBadge({ access, size = "sm", className }: { access: AccessLevel; size?: "sm" | "md"; className?: string }) {
  const Icon = ACCESS_ICON[access];
  return (
    <Badge tone={ACCESS_TONE[access]} size={size} className={className}>
      <Icon size={size === "sm" ? 12 : 13} aria-hidden className="-ml-0.5" />
      {ACCESS_LABEL[access]}
    </Badge>
  );
}

/** O que o cargo/função libera além do nível (esforço, justificativa, Roadmap 2026). */
export function roleExtras(person: Pick<Person, "role" | "discipline">): string[] {
  const out: string[] = [];
  const tracks = effortTracksByRole(person);
  const attach = evidenceTracksByRole(person).filter((t) => !tracks.includes(t));
  if (tracks.length) out.push(`estima o esforço de ${tracks.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ")}`);
  if (attach.length) out.push(`anexa a justificativa de ${attach.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ")}`);
  if (canPlanRoadmap2026(person)) out.push("planeja o Roadmap 2026");
  return out;
}

/**
 * Permissão na plataforma, no formulário do colaborador. Administradores escolhem o nível;
 * quem tem Edição vê o nível atual sem poder trocar.
 */
export function AccessField({
  value,
  onChange,
  canManage,
  email,
  person,
  roleInfo,
  isSelf,
  error,
}: {
  value: AccessLevel;
  onChange: (value: AccessLevel) => void;
  canManage: boolean;
  /** E-mail do formulário: é o que liga a permissão ao login. */
  email: string;
  /** Cadastro salvo (null = novo colaborador). */
  person: Person | null;
  roleInfo: Pick<Person, "role" | "discipline">;
  isSelf: boolean;
  error?: string;
}) {
  const extras = roleExtras(roleInfo);
  const notes: ReactNode[] = [];
  if (!email.trim()) {
    notes.push(
      <span key="email" className="flex items-start gap-1.5 font-semibold text-[#8a4b00]">
        <TriangleAlert size={14} className="mt-px shrink-0" aria-hidden />
        Sem e-mail, a permissão não tem efeito: ela vale para quem entra com a conta Google cadastrada acima.
      </span>,
    );
  }
  if (!canManage) notes.push(<span key="manage">Só administradores alteram a permissão.</span>);
  if (isSelf && canManage) notes.push(<span key="self">Esta é a sua permissão: ao reduzi-la, você deixa de poder alterar permissões.</span>);
  if (extras.length) notes.push(<span key="extras">Pelo cargo, também {extras.join(", ")} — vale em qualquer nível.</span>);
  if (person?.accessChange?.at) {
    notes.push(
      <span key="change">
        Última alteração por {person.accessChange.by || "um administrador"} em {formatDate(person.accessChange.at)}.
      </span>,
    );
  }

  return (
    <section className="flex flex-col gap-1 border-t border-line pt-5" aria-label="Permissão na plataforma">
      <RadioCards
        legend="Permissão na plataforma"
        name="access"
        value={value}
        onChange={onChange}
        disabled={!canManage}
        error={error}
        options={ACCESS_LEVELS.map((level) => {
          const Icon = ACCESS_ICON[level];
          return {
            value: level,
            label: ACCESS_LABEL[level],
            description: ACCESS_SUMMARY[level],
            icon: <Icon size={16} />,
            badge:
              person && person.access === level && value !== level ? (
                <span className="ml-auto rounded-full bg-canvas px-2 py-0.5 text-[11px] font-bold text-muted">Atual</span>
              ) : undefined,
          };
        })}
        hint={notes.length ? <span className="flex flex-col gap-1">{notes}</span> : undefined}
      />
    </section>
  );
}
