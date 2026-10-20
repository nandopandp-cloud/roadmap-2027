import { cn } from "@/lib/client/cn";
import { ACCENT_TONE } from "@/lib/client/tones";
import { PLATFORM_ACCENTS } from "@/lib/domain/constants";
import { initials } from "@/lib/domain/org";
import type { Person } from "@/lib/domain/types";

/** Tom estável por pessoa (iniciais quando não há foto). */
function toneFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return ACCENT_TONE[PLATFORM_ACCENTS[hash % PLATFORM_ACCENTS.length]];
}

/** Foto do colaborador (imagem enviada) ou iniciais. */
export function Avatar({ person, size = 40, className }: { person: Pick<Person, "id" | "name" | "photo">; size?: number; className?: string }) {
  const style = { width: size, height: size };
  if (person.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- imagem enviada, servida por /api/images
      <img
        src={`/api/images/${person.photo.imageId}`}
        alt=""
        width={size}
        height={size}
        draggable={false}
        className={cn("shrink-0 rounded-full object-cover ring-2 ring-white", className)}
        style={style}
      />
    );
  }
  const tone = toneFor(person.id);
  return (
    <span
      aria-hidden
      className={cn("inline-flex shrink-0 select-none items-center justify-center rounded-full font-extrabold ring-2 ring-white", className)}
      style={{ ...style, background: tone.soft, color: tone.fg, fontSize: Math.max(10, Math.round(size * 0.36)) }}
    >
      {initials(person.name)}
    </span>
  );
}

/** Avatares sobrepostos com contador do restante (+N). */
export function AvatarStack({ people, max = 4, size = 30 }: { people: Pick<Person, "id" | "name" | "photo">[]; max?: number; size?: number }) {
  if (!people.length) return null;
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="flex items-center" aria-label={people.map((p) => p.name).join(", ")} role="img">
      {shown.map((p, idx) => (
        <Avatar key={p.id} person={p} size={size} className={cn(idx > 0 && "-ml-2")} />
      ))}
      {rest > 0 && (
        <span
          className="-ml-2 inline-flex shrink-0 items-center justify-center rounded-full bg-[#eef2fa] text-[11.5px] font-extrabold text-muted ring-2 ring-white"
          style={{ width: size, height: size }}
        >
          +{rest}
        </span>
      )}
    </span>
  );
}
