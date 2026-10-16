"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const DRAWER_TABS = ["visao-geral", "prd", "prototipo", "roadmap", "dependencias"] as const;
export type DrawerTab = (typeof DRAWER_TABS)[number];

/**
 * A iniciativa aberta no drawer é representada na URL
 * (?iniciativa=JG-2027-001&aba=prd), permitindo compartilhar links diretos
 * e preservando a navegação (voltar/avançar) sem trocar de página.
 */
export function useInitiativeSelection() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const selectedId = params.get("iniciativa");
  const rawTab = params.get("aba");
  const tab: DrawerTab = (DRAWER_TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as DrawerTab) : "visao-geral";

  const update = useCallback(
    (mutate: (p: URLSearchParams) => void, mode: "push" | "replace" = "push") => {
      const next = new URLSearchParams(params.toString());
      mutate(next);
      const query = next.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (mode === "push") router.push(href, { scroll: false });
      else router.replace(href, { scroll: false });
    },
    [params, pathname, router],
  );

  const open = useCallback(
    (id: string, nextTab?: DrawerTab) =>
      update((p) => {
        p.set("iniciativa", id);
        if (nextTab && nextTab !== "visao-geral") p.set("aba", nextTab);
        else p.delete("aba");
      }, selectedId ? "replace" : "push"),
    [update, selectedId],
  );

  const setTab = useCallback(
    (next: DrawerTab) =>
      update((p) => {
        if (next === "visao-geral") p.delete("aba");
        else p.set("aba", next);
      }, "replace"),
    [update],
  );

  const close = useCallback(
    () =>
      update((p) => {
        p.delete("iniciativa");
        p.delete("aba");
      }, "replace"),
    [update],
  );

  return { selectedId, tab, open, setTab, close };
}
