"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { InitiativeDrawer } from "@/components/initiatives/initiative-drawer";
import { InitiativeFormHost } from "@/components/initiatives/initiative-form";
import { BrandLogo } from "@/components/layout/brand-logo";
import { Sidebar } from "@/components/layout/sidebar";
import { useFocusTrap } from "@/components/ui/dialog";

const COLLAPSE_KEY = "jg-roadmap:sidebar-collapsed";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const mobileRef = useFocusTrap(mobileOpen, () => setMobileOpen(false));

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
    } catch {
      /* preferência opcional */
    }
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);

  const toggle = () =>
    setCollapsed((prev) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, prev ? "0" : "1");
      } catch {
        /* preferência opcional */
      }
      return !prev;
    });

  return (
    <div className="flex h-dvh overflow-hidden">
      <a
        href="#conteudo"
        className="sr-only z-[70] rounded-lg bg-surface px-3 py-2 font-bold text-navy focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Pular para o conteúdo
      </a>

      <div className="hidden lg:flex">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggle} />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-[#171b4d]/45" onClick={() => setMobileOpen(false)} aria-hidden />
          <div ref={mobileRef} data-layer role="dialog" aria-modal="true" aria-label="Menu" className="relative h-full w-fit animate-drawer-in">
            <Sidebar collapsed={false} mobile onToggleCollapsed={toggle} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-3 bg-[linear-gradient(90deg,#2a1f86,#17145b)] px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-white hover:bg-white/10"
            aria-label="Abrir menu"
            aria-expanded={mobileOpen}
          >
            <Menu size={22} />
          </button>
          <BrandLogo className="w-[118px]" />
        </header>
        <main id="conteudo" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>

      <Suspense fallback={null}>
        <InitiativeDrawer />
      </Suspense>
      <InitiativeFormHost />
    </div>
  );
}
