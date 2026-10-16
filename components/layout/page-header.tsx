import { ChevronRight, House } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/client/cn";

interface Crumb {
  label: string;
  href?: string;
}

/** Trilha de navegação (Roadmap 2027 › …). */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="min-w-0">
      <ol className="flex flex-wrap items-center gap-2 text-[14px] text-muted">
        <li className="flex items-center gap-2">
          <House size={16} aria-hidden />
          <Link href="/iniciativas" className="hover:text-ink">
            Roadmap 2027
          </Link>
        </li>
        {crumbs.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-2">
            <ChevronRight size={15} aria-hidden className="shrink-0" />
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="truncate hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-bold text-violet">
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Barra simples com trilha (páginas de documento e protótipo). */
export function TopBar({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <div className="border-b border-line pb-4">
      <Breadcrumbs crumbs={crumbs} />
    </div>
  );
}

/**
 * Cabeçalho ilustrado das seções principais: cenário espacial à direita,
 * clareando para a esquerda para manter o título legível.
 */
export function PageHero({
  crumbs,
  title,
  subtitle,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="relative">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[270px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG decorativo local */}
        <img
          src="/illustrations/hero-ceu.svg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right opacity-35 sm:opacity-100"
          draggable={false}
        />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-canvas" />
      </div>
      <PageContainer className="relative pt-6">
        <Breadcrumbs crumbs={crumbs} />
        <h1 className="mt-9 max-w-[640px] text-[34px] font-black leading-[1.08] tracking-[-0.02em] text-navy sm:text-[42px]">{title}</h1>
        {subtitle && <p className="mt-2.5 max-w-[560px] text-[16.5px] leading-relaxed text-[#4a5680]">{subtitle}</p>}
        {children}
      </PageContainer>
    </div>
  );
}

/** Container padrão do conteúdo principal. */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  // O espaçamento vertical padrão só é aplicado quando nenhum é informado (evita classes conflitantes).
  return <div className={cn("mx-auto w-full max-w-[1240px] px-4 sm:px-8 lg:px-11", className ?? "pb-16 pt-6")}>{children}</div>;
}

/** Título simples (sem hero), usado onde não há cabeçalho ilustrado. */
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
