"use client";

import { Check } from "lucide-react";
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/client/cn";
import { Select } from "@/components/ui/select";

/**
 * Checkbox/radio visualmente oculto. O rótulo que o contém DEVE ser `relative`: sem isso, o
 * navegador posiciona o input em relação a um ancestral distante e, ao focá-lo, rola o modal
 * inteiro para fora da tela (tela "em branco").
 */
export function HiddenInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="peer absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0" />;
}

const control =
  "w-full rounded-xl border border-line bg-surface px-3.5 text-[14.5px] text-ink placeholder:text-subtle transition-colors hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12 aria-[invalid=true]:border-[#c42b3a]";

interface FieldShellProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  className?: string;
}

/** Estrutura padrão de campo: rótulo, controle, dica e erro acessíveis. */
export function Field({ label, hint, error, required, children, className }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-[13px] font-bold text-navy">
        {label}
        {required && (
          <span className="ml-0.5 text-[#c42b3a]" aria-hidden>
            *
          </span>
        )}
      </label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-semibold text-[#c42b3a]">
          {error}
        </p>
      )}
    </div>
  );
}

type Base = { label: string; hint?: ReactNode; error?: string; required?: boolean; className?: string };

export function TextField({ label, hint, error, required, className, ...rest }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          aria-required={required}
          className={cn(control, "h-11")}
          {...rest}
        />
      )}
    </Field>
  );
}

export function TextAreaField({
  label,
  hint,
  error,
  required,
  className,
  rows = 3,
  ...rest
}: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          aria-required={required}
          className={cn(control, "resize-y py-2.5 leading-relaxed")}
          {...rest}
        />
      )}
    </Field>
  );
}

/** Evento mínimo compatível com o `<select>` nativo (`e.target.value`). */
export type SelectChange = { target: { value: string } };

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  children,
  value,
  onChange,
  disabled,
  ...rest
}: Base & {
  value: string;
  onChange: (e: SelectChange) => void;
  disabled?: boolean;
  children: ReactNode;
  "data-autofocus"?: boolean;
}) {
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {({ id, describedBy, invalid }) => (
        <Select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(v) => onChange({ target: { value: v } })}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          aria-required={required}
          className={cn(control, "h-11 pr-3")}
          {...rest}
        >
          {children}
        </Select>
      )}
    </Field>
  );
}

/** Lista editada como texto: um item por linha. */
export function LinesField({
  label,
  hint,
  error,
  value,
  onChange,
  rows = 3,
  placeholder,
  className,
}: Base & { value: string[]; onChange: (value: string[]) => void; rows?: number; placeholder?: string }) {
  return (
    <TextAreaField
      label={label}
      hint={hint ?? "Um item por linha."}
      error={error}
      rows={rows}
      placeholder={placeholder}
      className={className}
      value={value.join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      onBlur={(e) => onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean))}
    />
  );
}

/** Seleção múltipla em chips (checkbox acessível). */
export function ChipMultiSelect<T extends string>({
  legend,
  hint,
  error,
  options,
  value,
  onChange,
}: {
  legend: string;
  hint?: ReactNode;
  error?: string;
  options: Array<{ value: T; label: string; icon?: ReactNode; description?: string }>;
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-bold text-navy">{legend}</legend>
      {options.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma opção disponível.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const checked = value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className={cn(
                  "relative inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors",
                  "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#6045d8]/20",
                  checked ? "border-violet bg-brand-soft text-brand-strong" : "border-line bg-surface text-ink hover:border-line-strong",
                )}
                title={opt.description}
              >
                <HiddenInput type="checkbox" checked={checked} onChange={() => onChange(checked ? value.filter((v) => v !== opt.value) : [...value, opt.value])} />
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-[5px] border",
                    checked ? "border-violet bg-violet text-white" : "border-line-strong",
                  )}
                >
                  {checked && <Check size={12} strokeWidth={3} />}
                </span>
                {opt.icon}
                {opt.label}
              </label>
            );
          })}
        </div>
      )}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && <p className="text-xs font-semibold text-[#c42b3a]">{error}</p>}
    </fieldset>
  );
}

export function Checkbox({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-[#00857c]"
      />
      <span>
        <span className="block text-sm font-bold text-ink">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
