"use client";

import { CalendarDays, ChevronsLeft, ChevronsRight, FileText, House, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarSpace } from "@/components/illustrations/sidebar-space";
import { useHasAsset } from "@/lib/client/assets";
import { cn } from "@/lib/client/cn";
import { SIDEBAR_ART } from "@/lib/domain/labels";

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

export function Sidebar({ collapsed, onToggleCollapsed, mobile, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const compact = collapsed && !mobile;
  const hasArt = useHasAsset(SIDEBAR_ART);

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden text-white transition-[width] duration-200",
        "bg-[linear-gradient(180deg,#2b1d8c_0%,#21177a_40%,#17145b_100%)]",
        compact ? "w-[84px]" : "w-[184px]",
      )}
    >
      <div className={cn("relative z-10 flex items-center pt-6", compact ? "justify-center px-3" : "justify-between px-[18px]")}>
        <Link href="/iniciativas" onClick={onNavigate} className="rounded-xl" aria-label="Jovens Gênios — Roadmap 2027, ir para Iniciativas">
          <BrandLogo compact={compact} className={compact ? undefined : "w-[138px]"} />
        </Link>
        {mobile && (
          <button
            type="button"
            onClick={onNavigate}
            className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <ul className={cn("relative z-10 mt-9 flex flex-col gap-2.5", compact ? "px-3" : "px-3")}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={compact ? label : undefined}
                className={cn(
                  "group flex h-[50px] items-center gap-3.5 rounded-[14px] text-[16px] font-semibold transition-colors",
                  compact ? "justify-center" : "px-4",
                  active
                    ? "bg-[linear-gradient(90deg,#7352f5,#5f3fe0)] text-white shadow-[0_8px_22px_rgba(98,66,230,0.5)]"
                    : "text-white/85 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon size={24} strokeWidth={1.8} aria-hidden />
                {!compact && <span>{label}</span>}
                {compact && <span className="sr-only">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {hasArt ? (
        <div className="pointer-events-none absolute inset-0 z-0 select-none" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element -- arte decorativa local */}
          <img src={SIDEBAR_ART} alt="" draggable={false} className="h-full w-full object-cover object-bottom" />
          {/* Escurece o topo para manter logo e menu legíveis sobre o céu. */}
          <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-[#1b1466]/85 via-[#1b1466]/45 to-transparent" />
        </div>
      ) : (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none" aria-hidden>
          <SidebarSpace className={cn("w-full", compact ? "opacity-60" : "")} />
          {/* eslint-disable-next-line @next/next/no-img-element -- ilustração decorativa local */}
          <img
            src="/illustrations/astronauta-recorte.svg"
            alt=""
            className={cn("absolute bottom-3 left-1/2 -translate-x-[58%]", compact ? "w-[64px]" : "w-[132px]")}
            draggable={false}
          />
        </div>
      )}

      {!mobile && (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="absolute bottom-4 right-3 z-10 hidden rounded-xl bg-white/10 p-2 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white lg:inline-flex"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      )}
    </nav>
  );
}
