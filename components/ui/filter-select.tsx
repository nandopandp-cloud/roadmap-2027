"use client";

import { useId, type ReactNode } from "react";
import { Select } from "@/components/ui/select";

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
  const id = useId();
  return (
    <div className="relative flex h-[54px] w-full flex-col justify-center rounded-[14px] border border-[#e3e9f4] bg-surface shadow-[0_1px_3px_rgba(23,27,77,0.04)] transition-colors hover:border-line-strong has-[:focus-visible]:border-violet has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/12 has-[[aria-expanded=true]]:border-violet sm:w-[172px]">
      <label htmlFor={id} className="pointer-events-none absolute left-4 top-[8px] text-[11.5px] font-semibold text-muted">
        {label}
      </label>
      <Select
        id={id}
        value={value}
        onChange={onChange}
        chevronSize={18}
        className="h-full rounded-[14px] pl-4 pr-3.5 pt-[18px] focus:outline-none"
        valueClassName="text-[15px] font-semibold text-ink"
      >
        {children}
      </Select>
    </div>
  );
}
