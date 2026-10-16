"use client";

import { CalendarRange, ChevronsLeft, ChevronsRight, Compass, FileText, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SidebarSpace } from "@/components/illustrations/sidebar-space";
import { cn } from "@/lib/client/cn";

/** As três (e somente três) seções de primeiro nível. */
export const NAV_ITEMS = [
  { href: "/contexto", label: "Contexto", icon: Compass },
  { href: "/iniciativas", label: "Iniciativas", icon: FileText },
  { href: "/roadmap", label: "Roadmap", icon: CalendarRange },
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

  return (
    <nav
      aria-label="Navegação principal"
      className={cn(
        "relative flex h-full shrink-0 flex-col overflow-hidden text-white transition-[width] duration-200",
        "bg-[linear-gradient(180deg,#2a1f86_0%,#1c1668_45%,#17145b_100%)]",
        compact ? "w-[84px]" : "w-[208px]",
      )}
    >
      <div className={cn("relative z-10 flex items-center pt-6", compact ? "justify-center px-3" : "justify-between px-5")}>
        <Link href="/iniciativas" onClick={onNavigate} className="rounded-xl" aria-label="Jovens Gênios — Roadmap 2027, ir para Iniciativas">
          <BrandLogo compact={compact} />
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

      <ul className={cn("relative z-10 mt-10 flex flex-col gap-2", compact ? "px-3" : "px-3.5")}>
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
                  "group flex h-12 items-center gap-3.5 rounded-2xl text-[15.5px] font-semibold transition-colors",
                  compact ? "justify-center" : "px-4",
                  active
                    ? "bg-[linear-gradient(90deg,#6a4bf0,#5b3fd6)] text-white shadow-[0_6px_18px_rgba(91,63,214,0.45)]"
                    : "text-white/85 hover:bg-white/8 hover:text-white",
                )}
              >
                <Icon size={21} strokeWidth={1.9} aria-hidden />
                {!compact && <span>{label}</span>}
                {compact && <span className="sr-only">{label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 select-none" aria-hidden>
        <SidebarSpace className={cn("w-full", compact ? "opacity-60" : "")} />
      </div>

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
