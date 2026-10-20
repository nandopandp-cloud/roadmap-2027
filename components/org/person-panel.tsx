"use client";

import { ArrowLeftRight, Crown, Mail, MapPin, Pencil, Repeat2, Trash2, UserX, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Avatar } from "@/components/org/avatar";
import { useOrgActions } from "@/components/org/org-actions";
import { Badge } from "@/components/ui/badges";
import { Button, IconButton } from "@/components/ui/button";
import { useFocusTrap } from "@/components/ui/dialog";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE, STATUS_TONE } from "@/lib/client/tones";
import { directReports, isLeader, relatedInitiatives, relatedSquads, squadsLedBy } from "@/lib/domain/org";
import { STATUS_LABEL } from "@/lib/domain/labels";
import type { Person } from "@/lib/domain/types";

const DOCK_QUERY = "(min-width: 1280px)";
const INITIATIVES_PREVIEW = 6;

/** Em telas largas o painel fica ao lado do conteúdo; nas demais, sobreposto. */
function useDocked() {
  const [docked, setDocked] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(DOCK_QUERY);
    const update = () => setDocked(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return docked;
}

export const AREA_TONE = { bg: "#F1ECFB", fg: "#4A2D91", dot: "#6045D8" };
export const LEADER_TONE = { bg: "#FDEBF3", fg: "#A3245F", dot: "#E0508F" };

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line py-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-[14px] font-extrabold text-navy">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function PanelBody({ person }: { person: Person }) {
  const { data } = useRoadmap();
  const actions = useOrgActions();
  const { open: openInitiative } = useInitiativeSelection();
  const [showAll, setShowAll] = useState(false);
  const manager = person.managerId ? data.people.find((p) => p.id === person.managerId) : undefined;
  const squads = relatedSquads(person, data.squads);
  const reports = directReports(data.people, person.id);
  const initiatives = relatedInitiatives(person, data.squads, data.initiatives);
  const leads = squadsLedBy(data.squads, person.id).length > 0;
  const shown = showAll ? initiatives : initiatives.slice(0, INITIATIVES_PREVIEW);
  const muted = "text-[13px] text-subtle";

  useEffect(() => setShowAll(false), [person.id]);

  return (
    <>
      <div className="flex items-start gap-4 pb-4">
        <Avatar person={person} size={76} />
        <div className="min-w-0 flex-1 pt-1">
          <p className="flex items-center gap-1.5 text-[17px] font-extrabold leading-tight text-navy">
            <span className="min-w-0 break-words">{person.name}</span>
            {leads && <Crown size={16} className="shrink-0 fill-[#f6b73c] text-[#e3a21a]" aria-label="Lidera squads" />}
          </p>
          <p className="mt-0.5 text-[13.5px] text-muted">{person.role}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {person.area && (
              <Badge tone={AREA_TONE} dot size="sm">
                {person.area}
              </Badge>
            )}
            {isLeader(person, data.people, data.squads) && (
              <Badge tone={LEADER_TONE} size="sm">
                Liderança
              </Badge>
            )}
          </div>
        </div>
      </div>

      {actions.canEdit && (
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-1 pb-4">
          <Button size="sm" className="px-2" icon={<Pencil size={14} />} onClick={() => actions.editPerson(person)}>
            Editar
          </Button>
          <Button size="sm" className="px-2" icon={<ArrowLeftRight size={14} />} onClick={() => actions.movePerson(person)}>
            Realocar
          </Button>
          <Button size="sm" className="px-2" icon={<Repeat2 size={14} />} onClick={() => actions.replacePerson(person)}>
            Substituir
          </Button>
          <IconButton label={`Remover ${person.name}`} onClick={() => void actions.removePerson(person)} className="h-8 w-8 hover:bg-[#fdf1f2] hover:text-[#b3242f]">
            <Trash2 size={16} />
          </IconButton>
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-line py-4 text-[13.5px] text-[#3b4470]">
        <p className="flex items-center gap-2.5">
          <Mail size={16} className="shrink-0 text-muted" aria-hidden />
          {person.email ? (
            <a href={`mailto:${person.email}`} className="truncate hover:text-violet hover:underline">
              {person.email}
            </a>
          ) : (
            <span className={muted}>E-mail não informado</span>
          )}
        </p>
        <p className="flex items-center gap-2.5">
          <MapPin size={16} className="shrink-0 text-muted" aria-hidden />
          {person.location || <span className={muted}>Localização não informada</span>}
        </p>
      </div>

      <Section title="Liderança direta">
        {manager ? (
          <button type="button" onClick={() => actions.openPerson(manager.id)} className="-mx-2 flex w-[calc(100%+16px)] items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-[#f4f6fb]">
            <Avatar person={manager} size={34} />
            <span className="min-w-0">
              <span className="block truncate text-[13.5px] font-bold text-ink">{manager.name}</span>
              <span className="block truncate text-[12.5px] text-muted">{manager.role}</span>
            </span>
          </button>
        ) : person.externalManager ? (
          <p className="text-[13.5px] font-semibold text-ink">
            {person.externalManager} <span className="font-normal text-subtle">(fora do organograma)</span>
          </p>
        ) : (
          <p className={muted}>Não definida.</p>
        )}
      </Section>

      <Section title="Squads relacionados">
        {squads.length ? (
          <div className="flex flex-wrap gap-1.5">
            {squads.map((s) => (
              <span key={s.id} className="inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-bold" style={{ background: ACCENT_TONE[s.accent].soft, color: ACCENT_TONE[s.accent].fg }}>
                <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: ACCENT_TONE[s.accent].solid }} />
                {s.name}
                {s.leaderId === person.id && <span className="font-semibold opacity-75">· liderança</span>}
              </span>
            ))}
          </div>
        ) : (
          <p className={muted}>Sem squad no momento.</p>
        )}
      </Section>

      {reports.length > 0 && (
        <Section title={`Liderados diretos (${reports.length})`}>
          <div className="flex flex-wrap gap-1">
            {reports.map((r) => (
              <button key={r.id} type="button" title={`${r.name} · ${r.role}`} aria-label={`${r.name}, ${r.role}`} onClick={() => actions.openPerson(r.id)} className="rounded-full">
                <Avatar person={r} size={32} />
              </button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Responsabilidades">
        {person.responsibilities.length ? (
          <ul className="flex list-disc flex-col gap-1 pl-5 text-[13.5px] text-[#3b4470] marker:text-subtle">
            {person.responsibilities.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ul>
        ) : (
          <p className={muted}>Nenhuma responsabilidade registrada.</p>
        )}
      </Section>

      <Section
        title={`Iniciativas relacionadas (${initiatives.length})`}
        action={
          initiatives.length > INITIATIVES_PREVIEW && (
            <button type="button" onClick={() => setShowAll((v) => !v)} className="text-[12.5px] font-bold text-violet hover:underline">
              {showAll ? "Ver menos" : "Ver todas"}
            </button>
          )
        }
      >
        {initiatives.length ? (
          <ul className="flex flex-col">
            {shown.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => openInitiative(i.id)}
                  title={STATUS_LABEL[i.status]}
                  className="-mx-2 flex w-[calc(100%+16px)] items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-[#f4f6fb]"
                >
                  <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_TONE[i.status].dot }} />
                  <span className="shrink-0 font-semibold text-muted">{i.id}</span>
                  <span className="truncate text-ink">{i.title}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className={muted}>Nenhuma. As iniciativas vêm das plataformas dos squads da pessoa e do campo “responsável”.</p>
        )}
      </Section>
    </>
  );
}

export function PersonPanel() {
  const { data, load } = useRoadmap();
  const { selectedId, closePerson } = useOrgActions();
  const docked = useDocked();
  const trapRef = useFocusTrap(!!selectedId && !docked, closePerson);
  if (!selectedId || load.status !== "ready") return null;
  const person = data.people.find((p) => p.id === selectedId);

  const body = (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface/95 px-5 py-4 backdrop-blur">
        <h2 className="text-[15px] font-extrabold text-navy">Detalhes do colaborador</h2>
        <IconButton label="Fechar detalhes" onClick={closePerson} className="-mr-2">
          <X size={19} />
        </IconButton>
      </header>
      <div className="px-5 pb-8 pt-4">
        {person ? (
          <PanelBody person={person} />
        ) : (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <UserX size={26} className="text-subtle" aria-hidden />
            <p className="text-[14px] font-bold text-navy">Colaborador não encontrado</p>
            <p className="text-[13px] text-muted">O cadastro pode ter sido removido.</p>
          </div>
        )}
      </div>
    </>
  );

  if (docked) {
    return (
      <aside aria-label="Detalhes do colaborador" className="sticky top-0 h-dvh w-[360px] shrink-0 self-start overflow-y-auto border-l border-line bg-surface shadow-[var(--shadow-drawer)]">
        {body}
      </aside>
    );
  }
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 animate-fade-in bg-[#171b4d]/40" onClick={closePerson} aria-hidden />
      <div
        ref={trapRef}
        data-layer
        role="dialog"
        aria-modal="true"
        aria-label="Detalhes do colaborador"
        className={cn("absolute inset-y-0 right-0 w-full animate-drawer-in overflow-y-auto bg-surface shadow-[var(--shadow-drawer)] sm:w-[400px]")}
      >
        {body}
      </div>
    </div>
  );
}
