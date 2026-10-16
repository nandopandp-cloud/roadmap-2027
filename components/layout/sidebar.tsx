"use client";

import { CalendarDays, ChevronsLeft, ChevronsRight, FileText, House, Lock, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { useHasAsset } from "@/lib/client/assets";
import { cn } from "@/lib/client/cn";
import { SIDEBAR_ART } from "@/lib/domain/labels";
import { CONTEXT_LOCKED } from "@/lib/features";

/** As três (e somente três) seções de primeiro nível. */
export const NAV_ITEMS = [
  { href: "/contexto", label: "Contexto", icon: House },
  { href: "/iniciativas", label: "Iniciativas", icon: FileText },
  { href: "/roadmap", label: "Roadmap", icon: CalendarDays },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Modo móvel: menu sobreposto. */
  mobile?: boolean;
  onNavigate?: () => void;
}

/**
 * Sidebar em cartão flutuante claro. Expandida: logo + textos. Recolhida: só ícones
 * (o rótulo aparece em dica ao passar o mouse ou focar). A arte do astronauta fica no rodapé.
 */
export function Sidebar({ collapsed, onToggleCollapsed, mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const compact = collapsed && !mobile;
  const hasArt = useHasAsset(SIDEBAR_ART);

  return (
    <div className={cn("h-full shrink-0 p-3 transition-[width] duration-200", compact ? "w-[84px]" : "w-[208px]", mobile && "w-[232px]")}>
      <nav
        aria-label="Navegação principal"
        className="relative flex h-full flex-col overflow-hidden rounded-[28px] bg-[linear-gradient(180deg,#f7f5ff_0%,#f1eeff_55%,#e9e4ff_100%)] shadow-[0_10px_40px_rgba(70,50,160,0.14),0_0_0_1px_rgba(120,100,220,0.08)]"
      >
        {hasArt && (
          <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element -- arte decorativa local */}
            <img
              src={SIDEBAR_ART}
              alt=""
              draggable={false}
              // Recolhida: arte menor e deslocada para a esquerda, para o astronauta aparecer inteiro no cartão estreito.
              className={cn("absolute bottom-0 h-auto max-w-none transition-all duration-200 [mask-image:linear-gradient(to_bottom,transparent_0%,#000_26%)]", compact ? "-left-[10px] w-[215px]" : "left-0 w-[360px]")}
            />
          </div>
        )}

        <div className={cn("relative z-10 flex items-center pt-5", compact ? "justify-center px-2" : "justify-between px-4")}>
          <Link
            href="/iniciativas"
            onClick={onNavigate}
            className={cn("rounded-xl", compact && "rounded-2xl bg-white/80 p-1 shadow-[0_4px_14px_rgba(70,50,160,0.12)]")}
            aria-label="Jovens Gênios, Roadmap 2027. Ir para Iniciativas"
          >
            <BrandLogo compact={compact} className={compact ? undefined : "w-[122px]"} />
          </Link>
          {mobile && (
            <button type="button" onClick={onNavigate} className="rounded-lg p-1.5 text-muted hover:bg-white/70 hover:text-ink" aria-label="Fechar menu">
              <X size={20} />
            </button>
          )}
        </div>

        <ul className={cn("relative z-10 mt-8 flex flex-col gap-1.5", compact ? "px-2.5" : "px-3")}>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const locked = href === "/contexto" && CONTEXT_LOCKED;
            const active = !locked && (pathname === href || pathname.startsWith(`${href}/`));
            const row = cn(
              "group relative flex h-[50px] items-center rounded-[14px] text-[15.5px] font-semibold transition-all",
              compact ? "justify-center" : "gap-3.5 px-4",
            );
            const tip = compact && (
              <span
                role="presentation"
                className="pointer-events-none absolute left-full top-1/2 z-30 ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-navy px-2.5 py-1.5 text-[12.5px] font-bold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                {label}
                {locked && " (em breve)"}
              </span>
            );

            if (locked) {
              return (
                <li key={href}>
                  <span role="link" aria-disabled="true" title="Em breve" className={cn(row, "cursor-not-allowed text-[#8e97b8]")}>
                    <Icon size={23} strokeWidth={1.8} aria-hidden />
                    {!compact && <span className="flex-1">{label}</span>}
                    {!compact && <Lock size={15} aria-hidden />}
                    <span className="sr-only">{compact ? `${label} (bloqueado)` : "(bloqueado)"}</span>
                    {tip}
                  </span>
                </li>
              );
            }
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    row,
                    active
                      ? "bg-white font-bold text-violet shadow-[0_8px_22px_rgba(98,66,230,0.16)] before:absolute before:left-0 before:top-1/2 before:h-7 before:w-[4px] before:-translate-y-1/2 before:rounded-r-full before:bg-violet"
                      : "text-[#4a557f] hover:bg-white/60 hover:text-navy",
                  )}
                >
                  <Icon size={23} strokeWidth={active ? 2.1 : 1.8} aria-hidden />
                  {!compact && <span>{label}</span>}
                  {compact && <span className="sr-only">{label}</span>}
                  {tip}
                </Link>
              </li>
            );
          })}
        </ul>

        {!mobile && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            className={cn(
              "absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-violet shadow-[0_8px_22px_rgba(70,50,160,0.22)] transition-colors hover:bg-[#f4f1ff] lg:flex",
              compact ? "left-1/2 -ml-[22px]" : "right-4",
            )}
            aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
          </button>
        )}
      </nav>
    </div>
  );
}
