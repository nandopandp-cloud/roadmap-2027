import { cn } from "@/lib/client/cn";
import { ILLUSTRATION_LABEL } from "@/lib/domain/labels";
import type { IllustrationKey } from "@/lib/domain/types";

/** Fallback visual estável por iniciativa quando nenhuma ilustração foi escolhida. */
const FALLBACK_ORDER: IllustrationKey[] = ["planeta", "foguete", "satelite", "cometa", "lua", "astronauta"];

export function illustrationFor(id: string, chosen: IllustrationKey | null): IllustrationKey {
  if (chosen) return chosen;
  const n = Number(id.slice(-3)) || 0;
  return FALLBACK_ORDER[n % FALLBACK_ORDER.length];
}

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
    // eslint-disable-next-line @next/next/no-img-element -- SVG estático local; next/image não agrega aqui
    <img
      src={`/illustrations/${key}.svg`}
      alt=""
      aria-hidden
      title={ILLUSTRATION_LABEL[key]}
      className={cn("shrink-0 rounded-2xl object-cover shadow-[0_4px_14px_rgba(23,20,91,0.25)]", className)}
      draggable={false}
    />
  );
}
