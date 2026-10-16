"use client";

import { ChevronRight } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { StatusBadge } from "@/components/ui/badges";
import { cn } from "@/lib/client/cn";
import type { Initiative } from "@/lib/domain/types";

/** Seção do drawer: ícone colorido + título + conteúdo alinhado ao título. */
export function DrawerSection({
  icon: Icon,
  color,
  title,
  children,
  action,
}: {
  icon: ComponentType<{ size?: number; strokeWidth?: number; className?: string; style?: React.CSSProperties }>;
  color: string;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="border-b border-line py-6 last:border-b-0">
      <div className="flex items-center gap-4">
        <Icon size={28} strokeWidth={2} style={{ color }} aria-hidden />
        <h3 className="flex-1 text-[17px] font-extrabold text-navy">{title}</h3>
        {action}
      </div>
      <div className="mt-3 pl-11 sm:pl-[44px]">{children}</div>
    </section>
  );
}

export function Prose({ children, empty }: { children?: string; empty: string }) {
  if (!children?.trim()) return <p className="text-[14.5px] italic leading-relaxed text-subtle">{empty}</p>;
  return <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-muted">{children}</p>;
}

export function BulletList({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-[14.5px] italic leading-relaxed text-subtle">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <li key={idx} className="flex gap-2.5 text-[14.5px] leading-relaxed text-muted">
          <span aria-hidden className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-violet" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** Linha clicável (entregáveis, iniciativas relacionadas). */
export function RowButton({
  icon,
  title,
  subtitle,
  onClick,
  trailing,
  className,
}: {
  icon: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  onClick: () => void;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-[#fafbff]",
        className,
      )}
    >
      <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-bold text-navy">{title}</span>
        {subtitle && <span className="block truncate text-[13px] text-muted">{subtitle}</span>}
      </span>
      {trailing}
      <ChevronRight size={18} className="shrink-0 text-navy" aria-hidden />
    </button>
  );
}

export function InitiativeRow({ initiative, onOpen, note }: { initiative: Initiative; onOpen: () => void; note?: string }) {
  return (
    <RowButton
      onClick={onOpen}
      icon={
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-[11px] font-extrabold text-brand">
          {initiative.id.slice(-3)}
        </span>
      }
      title={initiative.title}
      subtitle={note ?? initiative.id}
      trailing={<StatusBadge status={initiative.status} size="sm" />}
    />
  );
}

export function SubHeading({ children }: { children: ReactNode }) {
  return <h4 className="mb-2 mt-1 text-[13px] font-extrabold uppercase tracking-wide text-subtle">{children}</h4>;
}
