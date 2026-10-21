import { Badge } from "@/components/ui/badges";
import { cn } from "@/lib/client/cn";
import { DISCIPLINE_TONE } from "@/lib/client/tones";
import { DISCIPLINE_LABEL } from "@/lib/domain/labels";
import { disciplineCounts } from "@/lib/domain/org";
import type { Discipline, Person } from "@/lib/domain/types";

/** Badge da função no squad (Produto, Design, Engenharia, QA). */
export function DisciplineBadge({
  discipline,
  className,
}: {
  discipline: Discipline | null | undefined;
  className?: string;
}) {
  if (!discipline) return null;
  return (
    <Badge
      tone={DISCIPLINE_TONE[discipline]}
      size="sm"
      className={cn("h-5 px-2 text-[10.5px]", className)}
    >
      {DISCIPLINE_LABEL[discipline]}
    </Badge>
  );
}

/** Resumo da composição do squad: quantidade por função (funções sem ninguém aparecem esmaecidas). */
export function DisciplineSummary({
  people,
  className,
}: {
  people: Pick<Person, "discipline">[];
  className?: string;
}) {
  const counts = disciplineCounts(people);
  const label = counts
    .map(({ discipline, count }) => `${count} ${DISCIPLINE_LABEL[discipline]}`)
    .join(", ");
  return (
    <>
      <p className="sr-only">Composição: {label}</p>
      <ul aria-hidden className={cn("flex flex-wrap gap-1.5", className)}>
        {counts.map(({ discipline, count }) => {
          const tone = DISCIPLINE_TONE[discipline];
          return (
            <li
              key={discipline}
              title={`${DISCIPLINE_LABEL[discipline]}: ${count}`}
              className={cn(
                "inline-flex h-6 items-center gap-1.5 rounded-full px-2 text-[11.5px] font-bold",
                count === 0 && "opacity-45",
              )}
              style={{ background: tone.bg, color: tone.fg }}
            >
              <span className="text-[12.5px] font-extrabold">{count}</span>
              {DISCIPLINE_LABEL[discipline]}
            </li>
          );
        })}
      </ul>
    </>
  );
}
