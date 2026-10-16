"use client";

import { createContext, useContext, type ReactNode } from "react";

const AssetsContext = createContext<Set<string> | null>(null);

export function AssetsProvider({ files, children }: { files: string[]; children: ReactNode }) {
  return <AssetsContext.Provider value={new Set(files)}>{children}</AssetsContext.Provider>;
}

/** Primeiro arquivo da lista que existe em public/illustrations (ou o último, como garantia). */
export function useFirstAvailable(candidates: Array<string | undefined>): string {
  const files = useContext(AssetsContext);
  const list = candidates.filter((c): c is string => !!c);
  if (!files) return list[0];
  return list.find((c) => files.has(c)) ?? list[list.length - 1];
}

/** Indica se o arquivo existe em public/illustrations. */
export function useHasAsset(file: string): boolean {
  const files = useContext(AssetsContext);
  return files ? files.has(file) : false;
}
