import type { ReactNode } from "react";
import { cn } from "@/lib/client/cn";
import { PRIORITY_TONE, QUARTER_TONE, STATUS_TONE, TRANSVERSAL_TONE, VALIDATION_TONE, type Tone } from "@/lib/client/tones";
import { PRIORITY_LABEL, PROBLEM_VALIDATION_LABEL, QUARTER_LABEL, STATUS_LABEL } from "@/lib/domain/labels";
import type { InitiativeStatus, Priority, ProblemValidation, Quarter } from "@/lib/domain/types";

export function Badge({
  tone,
  children,
  dot = false,
  className,
  size = "md",
}: {
  tone: Tone;
  children: ReactNode;
  dot?: boolean;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold",
        size === "sm" ? "h-6 px-2.5 text-[11.5px]" : "h-7 px-3 text-xs",
        className,
      )}
      style={{ background: tone.bg, color: tone.fg }}
    >
      {dot && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status, size }: { status: InitiativeStatus; size?: "sm" | "md" }) {
  return (
    <Badge tone={STATUS_TONE[status]} dot size={size}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

export function PriorityBadge({ priority, size }: { priority: Priority | null; size?: "sm" | "md" }) {
  if (!priority) {
    return (
      <Badge tone={{ bg: "#F4F6FA", fg: "#5F6C8F", dot: "#B4BCD3" }} size={size}>
        Prioridade a definir
      </Badge>
    );
  }
  return (
    <Badge tone={PRIORITY_TONE[priority]} size={size}>
      Prioridade {PRIORITY_LABEL[priority].toLowerCase()}
    </Badge>
  );
}

export function QuarterBadge({ quarter, size }: { quarter: Quarter | null; size?: "sm" | "md" }) {
  return (
    <Badge tone={quarter ? QUARTER_TONE : { bg: "#F4F6FA", fg: "#5F6C8F", dot: "" }} size={size}>
      {quarter ? QUARTER_LABEL[quarter] : "Sem quarter"}
    </Badge>
  );
}

export function TransversalBadge({ size }: { size?: "sm" | "md" }) {
  return (
    <Badge tone={TRANSVERSAL_TONE} size={size}>
      Transversal
    </Badge>
  );
}

export function ValidationBadge({ validation }: { validation: ProblemValidation }) {
  return (
    <Badge tone={VALIDATION_TONE[validation]} dot size="sm">
      {PROBLEM_VALIDATION_LABEL[validation]}
    </Badge>
  );
}

/** Indicador textual neutro (ex.: "Definido", "Pendente"). */
export function StateTag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" }) {
  const palette = {
    neutral: { bg: "#F1F3F8", fg: "#4B5577", dot: "" },
    ok: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "" },
    warn: { bg: "#FFF8DB", fg: "#735600", dot: "" },
  }[tone];
  return (
    <Badge tone={palette} size="sm">
      {children}
    </Badge>
  );
}
