"use client";

import { DisciplineBadge, DisciplineSummary } from "@/components/org/discipline";
import { ArrowDownToLine, ArrowLeftRight, ChevronDown, ChevronRight, ChevronUp, Crown, Plus, UserPlus, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Avatar, AvatarStack } from "@/components/org/avatar";
import { useOrgActions } from "@/components/org/org-actions";
import { AREA_TONE } from "@/components/org/person-panel";
import { PLATFORM_GLYPHS } from "@/components/platforms/platform-icon";
import { ActionMenu } from "@/components/ui/action-menu";
import { EmptyState } from "@/components/ui/feedback";
import { Badge } from "@/components/ui/badges";
import { useToast } from "@/components/ui/toast";
import { useCardDrag, type ActiveDrag, type DropTarget } from "@/components/ui/use-card-drag";
import { ApiError } from "@/lib/client/api";
import { cn, plural } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { ACCENT_TONE } from "@/lib/client/tones";
import { describeMove } from "@/components/org/person-dialogs";
import { squadMembers } from "@/lib/domain/org";
import type { OrgZone, Person, PersonMove, Squad } from "@/lib/domain/types";

const NOTHING_FOUND = <EmptyState compact title="Nada encontrado com os filtros atuais" description="Ajuste a busca ou limpe os filtros." />;

/** Integrantes exibidos por squad antes do resumo "+N". */
const PREVIEW = 3;
/** Zona de soltura dos colaboradores sem squad. */
export const NO_SQUAD = "sem-squad";
/** Prefixo da zona de soltura do topo de um grupo (lideranças), seguido dos ids dos squads. */
const LEADERS = "lideres:";

/** Zona do arraste (data-drop-zone) → lugar do organograma. */
const zoneOf = (zone: string): OrgZone =>
  zone.startsWith(LEADERS) ? { kind: "leaders", squadIds: zone.slice(LEADERS.length).split(",") } : { kind: "squad", squadId: zone === NO_SQUAD ? null : zone };

export interface OrgFilter {
  /** Squad selecionado no filtro ("todos", id do squad ou NO_SQUAD). */
  squad: string;
  /** Há busca, área ou cargo filtrando as pessoas. */
  active: boolean;
  person: (p: Person) => boolean;
  squadMatches: (s: Squad) => boolean;
}

export interface OrgGroup {
  /** Ids das lideranças, na ordem exibida no topo (vazio = sem liderança). */
  key: string;
  leaders: Person[];
  squads: Array<{ squad: Squad; members: Person[]; total: number }>;
}

/** Zona de soltura do topo do grupo (os squads exibidos sob as lideranças). */
const leadersZone = (group: OrgGroup) => LEADERS + group.squads.map((s) => s.squad.id).join(",");

/** Estrutura exibida: lideranças → squads → integrantes, já com os filtros aplicados. */
export function buildOrg(people: Person[], squads: Squad[], filter: OrgFilter) {
  const visibleSquads = filter.squad === "todos" ? squads : squads.filter((s) => s.id === filter.squad);
  const groups: OrgGroup[] = [];
  for (const squad of visibleSquads) {
    const all = squadMembers(people, squad.id);
    const members = !filter.active || filter.squadMatches(squad) ? all : all.filter(filter.person);
    if (filter.active && !members.length && !filter.squadMatches(squad)) continue;
    const leaders = squad.leaderIds.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p);
    const key = leaders.map((p) => p.id).join(",");
    let group = groups.find((g) => g.key === key);
    if (!group) groups.push((group = { key, leaders, squads: [] }));
    group.squads.push({ squad, members, total: all.length });
  }
  // Grupo sem liderança vai por último.
  groups.sort((a, b) => Number(!a.leaders.length) - Number(!b.leaders.length));
  const leaderIds = new Set(squads.flatMap((s) => s.leaderIds));
  const unassigned =
    filter.squad === "todos" || filter.squad === NO_SQUAD
      ? squadMembers(people, null).filter((p) => !leaderIds.has(p.id) && (!filter.active || filter.person(p)))
      : [];
  return { groups, unassigned };
}

export function SquadTile({ squad, size = 40 }: { squad: Squad; size?: number }) {
  const Glyph = PLATFORM_GLYPHS[squad.icon];
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full text-white shadow-sm" style={{ width: size, height: size, background: ACCENT_TONE[squad.accent].solid }}>
      <Glyph size={Math.round(size * 0.5)} strokeWidth={2.2} />
    </span>
  );
}

function MemberContent({ person }: { person: Person }) {
  return (
    <>
      <Avatar person={person} size={36} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-extrabold text-navy">{person.name}</span>
        <span className="block truncate text-[12px] text-muted">{person.role}</span>
        <DisciplineBadge discipline={person.discipline} className="mt-1" />
      </span>
    </>
  );
}

const MEMBER_CARD = "flex w-full items-center gap-2.5 rounded-2xl border bg-surface py-2.5 pl-2.5 pr-1.5 text-left";

function MemberCard({ person, draggable, onPointerDown }: { person: Person; draggable: boolean; onPointerDown: (e: React.PointerEvent<HTMLElement>) => void }) {
  const { selectedId, openPerson, personMenu } = useOrgActions();
  const selected = selectedId === person.id;
  const menu = personMenu(person);
  return (
    <div
      className={cn(
        MEMBER_CARD,
        "relative transition-all [-webkit-touch-callout:none]",
        draggable && "cursor-grab select-none active:cursor-grabbing",
        selected ? "border-[#3f6fe6] shadow-[0_0_0_1px_#3f6fe6]" : "border-line shadow-[var(--shadow-card)] hover:border-line-strong",
      )}
      onPointerDown={onPointerDown}
    >
      <button
        type="button"
        onClick={() => openPerson(person.id)}
        aria-pressed={selected}
        aria-label={`${person.name}, ${person.role}`}
        aria-describedby={draggable ? "org-drag-hint" : undefined}
        className="absolute inset-0 rounded-2xl"
      />
      <MemberContent person={person} />
      {menu.length > 0 && <ActionMenu vertical label={`Ações de ${person.name}`} actions={menu} className="relative" />}
    </div>
  );
}

function LeaderCard({ person, draggable, onPointerDown }: { person: Person; draggable: boolean; onPointerDown: (e: React.PointerEvent<HTMLElement>) => void }) {
  const { selectedId, openPerson, personMenu } = useOrgActions();
  const selected = selectedId === person.id;
  const menu = personMenu(person);
  return (
    <div
      className={cn(
        "relative flex w-full items-center gap-4 rounded-[22px] border-[1.5px] bg-surface p-4 pr-3 shadow-[0_8px_26px_rgba(70,50,160,0.10)] transition-colors [-webkit-touch-callout:none]",
        draggable && "cursor-grab select-none active:cursor-grabbing",
        selected ? "border-[#3f6fe6]" : "border-[#b9b0f0] hover:border-violet",
      )}
      onPointerDown={onPointerDown}
    >
      <button
        type="button"
        onClick={() => openPerson(person.id)}
        aria-pressed={selected}
        aria-label={`${person.name}, ${person.role}`}
        aria-describedby={draggable ? "org-drag-hint" : undefined}
        className="absolute inset-0 rounded-[22px]"
      />
      <Avatar person={person} size={64} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15.5px] font-extrabold text-navy">
          <Crown size={15} className="shrink-0 fill-[#f6b73c] text-[#e3a21a]" aria-hidden />
          <span className="truncate">{person.name}</span>
        </span>
        <span className="block truncate text-[13px] text-muted">{person.role}</span>
        {(person.area || person.discipline) && (
          <span className="mt-2 flex flex-wrap items-center gap-1.5">
            <DisciplineBadge discipline={person.discipline} className="h-6 px-2.5 text-[11.5px]" />
            {person.area && (
              <Badge tone={AREA_TONE} dot size="sm">
                {person.area}
              </Badge>
            )}
          </span>
        )}
      </span>
      {menu.length > 0 && <ActionMenu label={`Ações de ${person.name}`} actions={menu} className="relative self-start" />}
    </div>
  );
}

function SquadHeader({ squad, total }: { squad: Squad; total: number }) {
  const { data } = useRoadmap();
  const { squadMenu } = useOrgActions();
  const menu = squadMenu(squad);
  const everyone = squadMembers(data.people, squad.id);
  return (
    <div className="rounded-[20px] border border-[#e3e9f4] bg-surface p-3.5 shadow-[0_2px_10px_rgba(23,27,77,0.05)]">
      <div className="flex items-start gap-2.5">
        <SquadTile squad={squad} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[15px] font-extrabold text-navy">{squad.name}</h3>
          <p className="text-[12.5px] text-muted">{plural(total, "pessoa", "pessoas")}</p>
        </div>
        {menu.length > 0 && <ActionMenu vertical label={`Ações do squad ${squad.name}`} actions={menu} />}
      </div>
      {squad.description ? (
        <p className="mt-2.5 line-clamp-2 text-[13px] leading-snug text-[#4a5680]">{squad.description}</p>
      ) : (
        <p className="mt-2.5 text-[12.5px] text-subtle">Sem descrição.</p>
      )}
      {everyone.length > 0 && <DisciplineSummary people={everyone} className="mt-2.5" />}
      <div className="mt-3 min-h-[30px]">
        {everyone.length ? <AvatarStack people={everyone} /> : <span className="text-[12.5px] text-subtle">Sem integrantes.</span>}
      </div>
    </div>
  );
}

function DropSlot({ drag, label, leader }: { drag: ActiveDrag; label: string; leader?: boolean }) {
  return (
    <li
      aria-hidden
      className={cn(
        "flex animate-fade-in items-center justify-center gap-2 border-2 border-dashed border-violet bg-brand-soft/70 px-3 text-center text-[12px] font-bold leading-tight text-brand",
        leader ? "h-[98px] w-[340px] max-w-full rounded-[22px]" : "rounded-2xl",
      )}
      style={leader ? undefined : { height: drag.height }}
    >
      <ArrowDownToLine size={15} className="shrink-0" />
      {label}
    </li>
  );
}

/** Linhas que ligam a liderança aos squads (barra horizontal + hastes). */
const BRANCH =
  "relative px-2 pt-7 before:absolute before:left-0 before:right-0 before:top-0 before:h-[1.5px] before:bg-[#c3cdea] first:before:left-1/2 last:before:right-1/2 after:absolute after:left-1/2 after:top-0 after:h-7 after:w-[1.5px] after:bg-[#c3cdea]";

/** Largura mínima de cada coluna de squad no organograma (usada também no ajuste à tela cheia). */
export const SQUAD_MIN_WIDTH = 236;

/**
 * `canvas`: modo tela cheia — os grupos não rolam sozinhos; quem rola (nos dois eixos) e aplica o zoom é a tela.
 */
export function OrgChart({ filter, expandAll, canvas = false }: { filter: OrgFilter; expandAll: boolean; canvas?: boolean }) {
  const { data, movePerson } = useRoadmap();
  const { canEdit, newPerson } = useOrgActions();
  const notify = useToast();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { groups, unassigned } = buildOrg(data.people, data.squads, filter);

  const isExpanded = (id: string) => expandAll || expanded.has(id);
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /** Cards exibidos de uma zona (o resumo "+N" esconde o restante dos squads recolhidos). */
  const shownIn = (zone: string, exceptId?: string) => {
    if (zone === NO_SQUAD) return unassigned.filter((p) => p.id !== exceptId);
    if (zone.startsWith(LEADERS)) return (groups.find((g) => leadersZone(g) === zone)?.leaders ?? []).filter((p) => p.id !== exceptId);
    const entry = groups.flatMap((g) => g.squads).find((s) => s.squad.id === zone);
    const members = (entry?.members ?? []).filter((p) => p.id !== exceptId);
    return isExpanded(zone) ? members : members.slice(0, PREVIEW);
  };
  const hiddenIn = (zone: string, exceptId?: string) => {
    if (zone === NO_SQUAD || zone.startsWith(LEADERS) || isExpanded(zone)) return 0;
    const entry = groups.flatMap((g) => g.squads).find((s) => s.squad.id === zone);
    return Math.max(0, (entry?.members ?? []).filter((p) => p.id !== exceptId).length - PREVIEW);
  };
  /** Com Alt/Option, a pessoa entra no destino sem sair da origem (não vale para "Sem squad"). */
  const keepsOrigin = (target: string, origin: string, copy: boolean) => copy && target !== origin && target !== NO_SQUAD;

  async function move(id: string, zone: string, index: number, origin: string, copy: boolean) {
    // "Sem squad" é ordenado por nome: não há posição a escolher.
    const shown = zone === NO_SQUAD ? [] : shownIn(zone, id);
    // Depois do último exibido com integrantes recolhidos: vai para o fim do squad.
    const beforeId = shown[index]?.id ?? null;
    const afterId = beforeId || hiddenIn(zone, id) ? null : (shown[index - 1]?.id ?? null);
    const person = data.people.find((p) => p.id === id);
    const request: PersonMove = { from: zoneOf(origin), to: zoneOf(zone), beforeId, afterId, keep: keepsOrigin(zone, origin, copy) };
    try {
      await movePerson(id, request);
      if (!beforeId && hiddenIn(zone, id)) setExpanded((prev) => new Set(prev).add(zone));
      if (person) notify("success", describeMove(data.squads, person, request));
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível realocar o colaborador.");
    }
  }

  const { drag, onPointerDown } = useCardDrag({
    enabled: canEdit,
    onDrop: (id, target: DropTarget, origin: DropTarget, copy) => {
      if (target.zone === origin.zone && (target.index === origin.index || target.zone === NO_SQUAD)) return;
      void move(id, target.zone, target.index, origin.zone, copy);
    },
  });
  const copying = !!drag && keepsOrigin(drag.target.zone, drag.origin.zone, drag.copy);

  const slotLabel = (zone: string, index: number) => {
    const verb = copying ? "Adicionar" : "Soltar";
    if (zone.startsWith(LEADERS)) return `${verb} na liderança · posição ${index + 1}`;
    const name = data.squads.find((s) => s.id === zone)?.name ?? "";
    const hidden = hiddenIn(zone, drag?.id);
    const position = index >= shownIn(zone, drag?.id).length && hidden ? shownIn(zone, drag?.id).length + hidden + 1 : index + 1;
    return `${verb} em ${name} · posição ${position}`;
  };

  /** O card arrastado some da origem (salvo ao copiar) e do destino, onde a pessoa já pode estar. */
  const isLifted = (zone: string, id: string) => drag?.id === id && (zone === drag.target.zone || (zone === drag.origin.zone && !copying));

  /** Slot de soltura na posição de destino ("Sem squad" só destaca a área). */
  const withSlot = (zone: string, members: Person[], items: ReactNode[], leader?: boolean) => {
    if (drag && drag.target.zone === zone && zone !== NO_SQUAD) {
      const anchor = shownIn(zone, drag.id)[drag.target.index];
      items.splice(anchor ? members.indexOf(anchor) : members.length, 0, <DropSlot key="slot" drag={drag} leader={leader} label={slotLabel(zone, drag.target.index)} />);
    }
    return items;
  };

  /** Cards de uma zona; o arrastado continua montado (oculto) para o toque seguir funcionando. */
  const renderMembers = (zone: string, members: Person[]) =>
    withSlot(
      zone,
      members,
      members.map((p) => (
        <li key={p.id} data-drag-card={p.id} className={cn(isLifted(zone, p.id) && "hidden")}>
          <MemberCard person={p} draggable={canEdit} onPointerDown={(e) => onPointerDown(p.id, e)} />
        </li>
      )),
    );

  const renderLeaders = (zone: string, leaders: Person[]) =>
    withSlot(
      zone,
      leaders,
      leaders.map((p) => (
        <li key={p.id} data-drag-card={p.id} className={cn("w-[340px] max-w-full", isLifted(zone, p.id) && "hidden")}>
          <LeaderCard person={p} draggable={canEdit} onPointerDown={(e) => onPointerDown(p.id, e)} />
        </li>
      )),
      true,
    );

  const dragged = drag ? data.people.find((p) => p.id === drag.id) : undefined;
  if (!groups.length && !unassigned.length && !drag) return NOTHING_FOUND;

  return (
    <>
      <p id="org-drag-hint" className="sr-only">
        Arraste o card para realocar a pessoa em outro squad, posição ou no topo (liderança) de um grupo de squads. Segure Alt ou Option ao soltar para adicionar sem tirar do lugar atual. Pelo teclado,
        use a opção Realocar no menu de ações ou edite o colaborador e o squad.
      </p>

      {groups.map((group) => {
        const zone = leadersZone(group);
        const isTarget = drag?.over && drag.target.zone === zone;
        return (
          <div key={group.key || zone} data-org-group={group.squads.length} className={cn("pb-2", !canvas && "overflow-x-auto [scrollbar-width:thin]")}>
            <div className="mx-auto flex w-fit min-w-full flex-col items-center pt-2">
              <ul
                aria-label={group.leaders.length ? "Lideranças" : "Squads sem liderança definida"}
                data-drop-zone={zone}
                data-drop-grid
                className={cn("flex max-w-full flex-wrap justify-center gap-3 rounded-[28px] p-1.5 transition-colors", isTarget && "bg-[#f1edff] ring-2 ring-violet/50")}
              >
                {renderLeaders(zone, group.leaders)}
                {!group.leaders.length && !(drag?.target.zone === zone) && (
                  <li className="rounded-full border border-dashed border-line-strong bg-surface px-4 py-2 text-[13px] font-bold text-muted">
                    {drag ? "Solte aqui para definir a liderança" : "Squads sem liderança definida"}
                  </li>
                )}
              </ul>
              <span aria-hidden className="h-7 w-[1.5px] bg-[#c3cdea]" />
              <ul className="flex w-full">
                {group.squads.map(({ squad, members, total }) => {
                  const shown = isExpanded(squad.id) ? members : members.slice(0, PREVIEW);
                  const rest = members.slice(shown.length);
                  const isTarget = drag?.over && drag.target.zone === squad.id;
                  return (
                    <li key={squad.id} className={cn(BRANCH, "flex-1 basis-0")} style={{ minWidth: SQUAD_MIN_WIDTH }}>
                      <section
                        aria-label={`Squad ${squad.name}`}
                        data-drop-zone={squad.id}
                        className={cn("rounded-[24px] p-1 transition-colors", isTarget && "bg-[#f1edff] ring-2 ring-violet/50")}
                      >
                        <SquadHeader squad={squad} total={total} />
                        <ul className="relative ml-4 mt-2 flex flex-col gap-2 border-l-[1.5px] border-[#c3cdea] pl-3 pt-1">
                          {renderMembers(squad.id, shown)}
                          {rest.length > 0 && !isExpanded(squad.id) && (
                            <li>
                              <button
                                type="button"
                                onClick={() => toggle(squad.id)}
                                aria-expanded={false}
                                className="flex w-full items-center gap-2 rounded-2xl border border-line bg-surface px-2.5 py-2.5 text-left shadow-[var(--shadow-card)] transition-colors hover:border-line-strong"
                              >
                                <AvatarStack people={rest} max={3} size={28} />
                                <span className="min-w-0 flex-1 text-[12.5px] font-bold text-navy">+{plural(rest.length, "colaborador", "colaboradores")}</span>
                                <ChevronRight size={16} className="text-muted" aria-hidden />
                              </button>
                            </li>
                          )}
                          {isExpanded(squad.id) && !expandAll && members.length > PREVIEW && (
                            <li>
                              <button type="button" onClick={() => toggle(squad.id)} aria-expanded className="flex items-center gap-1.5 px-1 py-1 text-[12.5px] font-bold text-violet hover:underline">
                                <ChevronUp size={14} aria-hidden /> Recolher
                              </button>
                            </li>
                          )}
                          {members.length === 0 && !(drag?.target.zone === squad.id) && (
                            <li className="rounded-2xl border border-dashed border-line-strong px-3 py-4 text-center text-[12.5px] text-muted">
                              {filter.active && total ? "Ninguém deste squad corresponde aos filtros." : "Nenhum integrante ainda."}
                              {canEdit && !filter.active && (
                                <button type="button" onClick={() => newPerson({ squadIds: [squad.id] })} className="mt-1.5 flex w-full items-center justify-center gap-1 font-bold text-violet hover:underline">
                                  <UserPlus size={14} aria-hidden /> Adicionar colaborador
                                </button>
                              )}
                            </li>
                          )}
                        </ul>
                      </section>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}

      {(unassigned.length > 0 || (drag && filter.squad !== NO_SQUAD)) && (
        <section
          aria-labelledby="org-sem-squad"
          data-drop-zone={NO_SQUAD}
          data-drop-grid
          className={cn("mt-8 rounded-[24px] border p-4 transition-colors", drag?.over && drag.target.zone === NO_SQUAD ? "border-violet bg-[#f6f3ff]" : "border-[#e3e9f4] bg-white/70")}
        >
          <h3 id="org-sem-squad" className="flex items-center gap-2 text-[16px] font-black text-navy">
            <Users size={18} aria-hidden /> Colaboradores sem squad
          </h3>
          <p className="text-[13px] text-muted">Arraste para um squad ou para o topo de um grupo para realocar.</p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {renderMembers(NO_SQUAD, unassigned)}
            {drag && shownIn(NO_SQUAD, drag.id).length === 0 && (
              <li className="rounded-2xl border border-dashed border-line-strong px-3 py-4 text-center text-[12.5px] text-muted">
                {drag.origin.zone.startsWith(LEADERS) ? "Solte aqui para tirar a pessoa da liderança." : "Solte aqui para tirar a pessoa do squad."}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* No body: ancestrais com backdrop-filter mudariam a referência do position: fixed. */}
      {drag &&
        dragged &&
        createPortal(
          <div aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60]" style={{ width: drag.width, transform: `translate(${drag.x - drag.offsetX}px, ${drag.y - drag.offsetY}px)` }}>
            <div className={cn(MEMBER_CARD, "relative rotate-[1.5deg] border-violet shadow-[0_18px_40px_rgba(23,27,77,0.22)]", !drag.over && "opacity-70")}>
              <MemberContent person={dragged} />
              {copying && (
                <span className="absolute -right-2 -top-2.5 inline-flex items-center gap-1 rounded-full bg-action px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm">
                  <Plus size={12} strokeWidth={3} aria-hidden /> Adicionar
                </span>
              )}
            </div>
          </div>,
          document.body,
        )}
      {drag &&
        drag.origin.zone !== NO_SQUAD &&
        createPortal(
          <p aria-hidden className="pointer-events-none fixed bottom-6 left-1/2 z-[60] hidden -translate-x-1/2 animate-fade-in items-center gap-2 rounded-full bg-navy px-4 py-2 text-[12.5px] font-bold text-white shadow-[var(--shadow-raised)] sm:flex">
            {copying ? <Plus size={14} aria-hidden /> : <ArrowLeftRight size={14} aria-hidden />}
            {copying ? "Adicionando: a pessoa continua também no lugar de origem." : "Segure Alt (⌥ Option) para adicionar sem tirar do lugar atual."}
          </p>,
          document.body,
        )}
    </>
  );
}

/** Modo lista do organograma: a mesma estrutura em árvore indentada. */
export function OrgList({ filter }: { filter: OrgFilter }) {
  const { data } = useRoadmap();
  const { openPerson, selectedId, personMenu, squadMenu } = useOrgActions();
  const { groups, unassigned } = buildOrg(data.people, data.squads, filter);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!groups.length && !unassigned.length) return NOTHING_FOUND;

  const personRow = (p: Person, depth: number) => (
    <li key={p.id} className="flex items-center gap-1 rounded-xl hover:bg-[#f6f8fd]" style={{ paddingLeft: depth * 24 }}>
      <button type="button" onClick={() => openPerson(p.id)} aria-pressed={selectedId === p.id} className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left", selectedId === p.id && "bg-[#eef3ff]")}>
        <Avatar person={p} size={32} />
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-bold text-ink">{p.name}</span>
            <DisciplineBadge discipline={p.discipline} className="shrink-0" />
          </span>
          <span className="block truncate text-[12.5px] text-muted">
            {p.role}
            {p.area ? ` · ${p.area}` : ""}
          </span>
        </span>
      </button>
      {personMenu(p).length > 0 && <ActionMenu vertical label={`Ações de ${p.name}`} actions={personMenu(p)} />}
    </li>
  );

  return (
    <div className="rounded-[24px] border border-[#e3e9f4] bg-surface p-3 shadow-[0_2px_10px_rgba(23,27,77,0.04)]">
      <ul className="flex flex-col">
        {groups.map((group) => (
          <li key={group.key || leadersZone(group)} className="py-1">
            {group.leaders.length ? (
              <ul>{group.leaders.map((leader) => personRow(leader, 0))}</ul>
            ) : (
              <p className="px-2 py-2 text-[13px] font-bold text-muted">Squads sem liderança definida</p>
            )}
            <ul>
              {group.squads.map(({ squad, members, total }) => {
                const open = !collapsed.has(squad.id);
                return (
                  <li key={squad.id}>
                    <div className="flex items-center gap-1 rounded-xl hover:bg-[#f6f8fd]" style={{ paddingLeft: 24 }}>
                      <button type="button" onClick={() => toggle(squad.id)} aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left">
                        {open ? <ChevronDown size={16} className="shrink-0 text-muted" aria-hidden /> : <ChevronRight size={16} className="shrink-0 text-muted" aria-hidden />}
                        <SquadTile squad={squad} size={28} />
                        <span className="truncate text-[14px] font-extrabold text-navy">{squad.name}</span>
                        <span className="shrink-0 text-[12.5px] text-muted">{plural(total, "pessoa", "pessoas")}</span>
                      </button>
                      {squadMenu(squad).length > 0 && <ActionMenu vertical label={`Ações do squad ${squad.name}`} actions={squadMenu(squad)} />}
                    </div>
                    {open && (
                      <ul>
                        {members.map((p) => personRow(p, 2))}
                        {members.length === 0 && <li className="py-1.5 text-[12.5px] text-subtle" style={{ paddingLeft: 56 }}>Nenhum integrante.</li>}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
        {unassigned.length > 0 && (
          <li className="border-t border-line pt-2">
            <p className="px-2 py-2 text-[13px] font-bold text-muted">Colaboradores sem squad</p>
            <ul>{unassigned.map((p) => personRow(p, 1))}</ul>
          </li>
        )}
      </ul>
    </div>
  );
}
