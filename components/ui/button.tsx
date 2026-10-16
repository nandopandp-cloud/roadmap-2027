import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/client/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "brand";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-action text-white hover:bg-action-strong shadow-sm",
  brand: "bg-violet text-white hover:bg-brand shadow-sm",
  secondary: "bg-surface text-ink border border-line hover:border-line-strong hover:bg-[#f8faff]",
  outline: "bg-surface text-navy border-[1.5px] border-navy hover:bg-[#f5f6ff]",
  ghost: "text-muted hover:text-ink hover:bg-[#eef2fa]",
  danger: "bg-[#c42b3a] text-white hover:bg-[#a5202e]",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-5 text-[15px] gap-2.5 rounded-xl",
};

export function buttonClass(variant: Variant = "secondary", size: Size = "md", extra?: string) {
  return cn(
    "inline-flex items-center justify-center font-bold whitespace-nowrap transition-colors duration-150",
    "disabled:opacity-50 disabled:pointer-events-none select-none",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  loading?: boolean;
}

export function Button({ variant, size, icon, loading, className, children, disabled, type = "button", ...rest }: ButtonProps) {
  return (
    <button type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function LinkButton({
  variant,
  size,
  icon,
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size; icon?: ReactNode }) {
  return (
    <Link className={buttonClass(variant, size, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-[#eef2fa] hover:text-ink disabled:opacity-40",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent", className)}
    />
  );
}
