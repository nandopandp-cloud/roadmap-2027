"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** Select de filtro com rótulo interno (padrão visual da referência). */
export function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="relative flex h-[54px] w-full flex-col justify-center rounded-[14px] border border-[#e3e9f4] bg-surface pl-4 pr-10 shadow-[0_1px_3px_rgba(23,27,77,0.04)] transition-colors hover:border-line-strong has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12 sm:w-[172px]">
      <span className="text-[11.5px] font-semibold text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate bg-transparent text-[15px] font-semibold text-ink focus:outline-none"
      >
        {children}
      </select>
      <ChevronDown size={18} aria-hidden className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink" />
    </label>
  );
}
