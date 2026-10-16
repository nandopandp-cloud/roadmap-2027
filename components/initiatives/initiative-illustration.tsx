import { cn } from "@/lib/client/cn";
import { ILLUSTRATION_LABEL, ILLUSTRATION_SRC } from "@/lib/domain/labels";
import type { IllustrationKey } from "@/lib/domain/types";

/** Fallback visual estável por iniciativa quando nenhuma ilustração foi escolhida. */
const FALLBACK_ORDER: IllustrationKey[] = ["planeta", "foguete", "satelite", "ilha", "tecnologia", "astronauta"];

export function illustrationFor(id: string, chosen: IllustrationKey | null): IllustrationKey {
  if (chosen) return chosen;
  const n = Number(id.slice(-3)) || 0;
  return FALLBACK_ORDER[n % FALLBACK_ORDER.length];
}

/**
 * Ilustração da iniciativa (biblioteca em public/illustrations; arte oficial do
 * Exploradores e astronauta em SVG). Decorativa: o título já identifica a iniciativa.
 */
export function InitiativeIllustration({
  id,
  illustration,
  className,
}: {
  id: string;
  illustration: IllustrationKey | null;
  className?: string;
}) {
  const key = illustrationFor(id, illustration);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- imagens locais pequenas; next/image não agrega aqui
    <img
      src={ILLUSTRATION_SRC[key]}
      alt=""
      aria-hidden
      title={ILLUSTRATION_LABEL[key]}
      loading="lazy"
      className={cn("shrink-0 rounded-2xl object-cover", className)}
      draggable={false}
    />
  );
}
