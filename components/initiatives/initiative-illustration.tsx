"use client";

import { useState } from "react";
import { useFirstAvailable } from "@/lib/client/assets";
import { cn } from "@/lib/client/cn";
import { ILLUSTRATION_ASSET, ILLUSTRATION_LABEL } from "@/lib/domain/labels";
import type { IllustrationKey } from "@/lib/domain/types";

/** Fallback visual estável por iniciativa quando nenhuma ilustração foi escolhida. */
const FALLBACK_ORDER: IllustrationKey[] = ["planeta", "foguete", "satelite", "ilha", "tecnologia", "astronauta"];

export function illustrationFor(id: string, chosen: IllustrationKey | null): IllustrationKey {
  if (chosen) return chosen;
  const n = Number(id.slice(-3)) || 0;
  return FALLBACK_ORDER[n % FALLBACK_ORDER.length];
}

/** Imagem que troca para o arquivo de fallback se o principal ainda não existir. */
export function FallbackImg({
  src,
  fallback,
  finalFallback,
  className,
  style,
}: {
  src: string;
  fallback?: string;
  /** Segundo nível de fallback (ex.: arte principal → SVG). */
  finalFallback?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const first = useFirstAvailable([src, fallback, finalFallback]);
  const chain = [first, fallback, finalFallback].filter((v, i, all): v is string => !!v && all.indexOf(v) === i);
  const [index, setIndex] = useState(0);
  const current = chain[Math.min(index, chain.length - 1)];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- ilustrações locais; next/image não agrega aqui
    <img
      src={current}
      alt=""
      draggable={false}
      onError={() => index < chain.length - 1 && setIndex(index + 1)}
      className={className}
      style={style}
    />
  );
}

/**
 * Ilustração da iniciativa (biblioteca em public/illustrations). Artes de fundo
 * claro são exibidas inteiras sobre um fundo lilás; artes de fundo escuro preenchem o quadro.
 * Decorativa: o título já identifica a iniciativa.
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
  const asset = ILLUSTRATION_ASSET[key];
  return (
    <span
      aria-hidden
      title={ILLUSTRATION_LABEL[key]}
      className={cn(
        "relative block shrink-0 overflow-hidden rounded-2xl",
        asset.fit === "contain" ? "bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#efe9ff_60%,#e2d8ff_100%)]" : "bg-[#efeaff]",
        className,
      )}
    >
      <FallbackImg
        src={asset.src}
        fallback={asset.fallback}
        className={cn(
          "absolute inset-0 h-full w-full",
          asset.fit === "contain" ? "object-contain p-[6%] mix-blend-multiply" : "object-cover",
        )}
        style={asset.focus ? { objectPosition: asset.focus } : undefined}
      />
    </span>
  );
}
