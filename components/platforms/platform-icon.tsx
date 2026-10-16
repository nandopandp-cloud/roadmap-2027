import { BookOpen, GraduationCap, Layers, Settings, Sparkles, Users, type LucideProps } from "lucide-react";
import type { ComponentType } from "react";
import { ACCENT_TONE } from "@/lib/client/tones";
import { cn } from "@/lib/client/cn";
import type { Platform, PlatformIcon as PlatformIconKey } from "@/lib/domain/types";

/** Rosto de explorador (capacete) — ícone próprio da plataforma Exploradores. */
function ExplorerGlyph({ size = 16, className }: LucideProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M7.2 11.2c0-2.3 2.1-3.7 4.8-3.7s4.8 1.4 4.8 3.7c0 2.4-2.1 3.8-4.8 3.8s-4.8-1.4-4.8-3.8Z" fill="currentColor" />
      <circle cx="10" cy="11.3" r="1.1" fill="#fff" />
      <circle cx="14" cy="11.3" r="1.1" fill="#fff" />
      <path d="M10.6 13.4c.8.6 2 .6 2.8 0" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

export const PLATFORM_GLYPHS: Record<PlatformIconKey, ComponentType<LucideProps>> = {
  settings: Settings,
  explorer: ExplorerGlyph,
  teacher: GraduationCap,
  family: Users,
  book: BookOpen,
  sparkles: Sparkles,
  layers: Layers,
};

export const PLATFORM_ICON_LABEL: Record<PlatformIconKey, string> = {
  settings: "Engrenagem",
  explorer: "Explorador",
  teacher: "Educador",
  family: "Família",
  book: "Livro",
  sparkles: "Brilho",
  layers: "Camadas",
};

/** Ícone sólido (quadrado arredondado) usado em cards de plataforma. */
export function PlatformTile({ platform, size = 48 }: { platform: Platform; size?: number }) {
  const Glyph = PLATFORM_GLYPHS[platform.icon];
  const tone = ACCENT_TONE[platform.accent];
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
      style={{ width: size, height: size, background: tone.solid }}
    >
      <Glyph size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </span>
  );
}

/** Chip compacto de plataforma (cards e listas). */
export function PlatformChip({ platform, className }: { platform: Platform; className?: string }) {
  const Glyph = PLATFORM_GLYPHS[platform.icon];
  const tone = ACCENT_TONE[platform.accent];
  return (
    <span
      className={cn("inline-flex h-7 items-center gap-1.5 rounded-full pl-1 pr-3 text-xs font-bold", className)}
      style={{ background: tone.soft, color: tone.fg }}
    >
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-white" style={{ background: tone.solid }}>
        <Glyph size={12} strokeWidth={2.4} />
      </span>
      {platform.name}
    </span>
  );
}

/** Chip com borda (cards e cabeçalho do drawer), como na referência visual. */
export function PlatformPill({ platform, size = "md" }: { platform: Platform; size?: "sm" | "md" }) {
  const Glyph = PLATFORM_GLYPHS[platform.icon];
  const tone = ACCENT_TONE[platform.accent];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border border-line bg-surface font-semibold text-ink shadow-[0_1px_2px_rgba(23,27,77,0.04)]",
        size === "sm" ? "h-8 pl-1.5 pr-2.5 text-[12.5px]" : "h-9 pl-1.5 pr-3 text-[13px]",
      )}
    >
      <span
        aria-hidden
        className={cn("inline-flex items-center justify-center rounded-lg text-white", size === "sm" ? "h-[22px] w-[22px]" : "h-6 w-6")}
        style={{ background: tone.solid }}
      >
        <Glyph size={size === "sm" ? 13 : 14} strokeWidth={2.4} />
      </span>
      {platform.name}
    </span>
  );
}
