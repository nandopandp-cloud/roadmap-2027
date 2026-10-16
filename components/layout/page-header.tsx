import { ChevronRight, House, Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface Crumb {
  label: string;
  href?: string;
}

/** Barra superior das páginas: trilha de navegação + selo do ciclo de planejamento. */
export function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
      <nav aria-label="Trilha de navegação" className="min-w-0">
        <ol className="flex items-center gap-2 text-[14px] text-muted">
          <li className="flex items-center gap-2">
            <House size={15} aria-hidden />
            <Link href="/iniciativas" className="hover:text-ink">
              Roadmap 2027
            </Link>
          </li>
          {crumbs.map((c, i) => (
            <li key={c.label} className="flex min-w-0 items-center gap-2">
              <ChevronRight size={15} aria-hidden className="shrink-0" />
              {c.href && i < crumbs.length - 1 ? (
                <Link href={c.href} className="truncate hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page" className="truncate font-bold text-ink">
                  {c.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <span className="hidden shrink-0 items-center gap-2 rounded-full bg-[#ece9fd] px-4 py-1.5 text-[13px] font-bold text-[#3d2a9c] sm:inline-flex">
        <Sparkles size={15} aria-hidden />
        Planejamento 2027
      </span>
    </div>
  );
}

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <h1 className="min-w-0 text-[34px] font-black leading-tight tracking-[-0.02em] text-navy sm:text-[40px]">{title}</h1>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {subtitle && <p className="mt-1 max-w-2xl text-[16.5px] text-muted">{subtitle}</p>}
    </div>
  );
}

/** Container padrão do conteúdo principal. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-6 sm:px-8 lg:px-9">{children}</div>;
}
