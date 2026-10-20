"use client";

import { Crown, Plus } from "lucide-react";
import { Avatar } from "@/components/org/avatar";
import { buildOrg, SquadTile, type OrgFilter } from "@/components/org/org-chart";
import { useOrgActions } from "@/components/org/org-actions";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { ActionMenu } from "@/components/ui/action-menu";
import { EmptyState } from "@/components/ui/feedback";
import { cn, plural } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { STATUS_TONE } from "@/lib/client/tones";
import { orderIn, squadInitiatives, squadsLedBy } from "@/lib/domain/org";
import type { Person, Squad } from "@/lib/domain/types";

/** Nomes dos squads da pessoa, separados por vírgula (undefined = sem squad). */
const squadNames = (squads: Squad[], person: Person) =>
  squads
    .filter((s) => orderIn(person, s.id) !== undefined)
    .map((s) => s.name)
    .join(", ") || undefined;

function PersonChip({ person, detail }: { person: Person; detail?: string }) {
  const { openPerson, selectedId } = useOrgActions();
  return (
    <button
      type="button"
      onClick={() => openPerson(person.id)}
      aria-pressed={selectedId === person.id}
      className={cn("flex w-full min-w-0 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left hover:bg-[#f4f6fb]", selectedId === person.id && "bg-[#eef3ff]")}
    >
      <Avatar person={person} size={32} />
      <span className="min-w-0">
        <span className="block truncate text-[13.5px] font-bold text-ink">{person.name}</span>
        <span className="block truncate text-[12px] text-muted">{detail ?? person.role}</span>
      </span>
    </button>
  );
}

const NO_RESULTS = <EmptyState compact title="Nada encontrado com os filtros atuais" description="Ajuste a busca ou limpe os filtros." />;

/** Aba Squads: um card por squad com liderança, plataformas, integrantes e iniciativas. */
export function SquadsTab({ filter }: { filter: OrgFilter }) {
  const { data } = useRoadmap();
  const { squadMenu, canEdit, newSquad, openPerson } = useOrgActions();
  const entries = buildOrg(data.people, data.squads, filter).groups.flatMap((g) => g.squads);
  if (!entries.length && filter.active) return NO_RESULTS;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {entries.map(({ squad, members, total }) => {
        const leaders = squad.leaderIds.map((id) => data.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
        const initiatives = squadInitiatives(squad, data.initiatives);
        const menu = squadMenu(squad);
        return (
          <article key={squad.id} className="flex flex-col gap-3 rounded-[22px] border border-[#e3e9f4] bg-surface p-4 shadow-[var(--shadow-card)]">
            <header className="flex items-start gap-3">
              <SquadTile squad={squad} size={44} />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[16px] font-extrabold text-navy">{squad.name}</h3>
                <p className="text-[12.5px] text-muted">{plural(total, "pessoa", "pessoas")}</p>
              </div>
              {menu.length > 0 && <ActionMenu vertical label={`Ações do squad ${squad.name}`} actions={menu} />}
            </header>
            <p className={cn("text-[13.5px] leading-snug", squad.description ? "text-[#4a5680]" : "text-subtle")}>{squad.description || "Sem descrição."}</p>
            <div className="flex items-center gap-2 text-[13px]">
              <Crown size={14} className="shrink-0 text-[#e3a21a]" aria-hidden />
              <span className="shrink-0 text-muted">{leaders.length > 1 ? "Lideranças:" : "Liderança:"}</span>
              {leaders.length ? (
                <span className="min-w-0 truncate">
                  {leaders.map((leader, idx) => (
                    <span key={leader.id}>
                      {idx > 0 && ", "}
                      <button type="button" onClick={() => openPerson(leader.id)} className="font-bold text-ink hover:text-violet hover:underline">
                        {leader.name}
                      </button>
                    </span>
                  ))}
                </span>
              ) : (
                <span className="text-subtle">não definida</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {squad.platformIds.length ? (
                squad.platformIds.map((id) => {
                  const p = data.platforms.find((x) => x.id === id);
                  return p ? <PlatformChip key={id} platform={p} /> : null;
                })
              ) : (
                <span className="text-[12.5px] text-subtle">Nenhuma plataforma vinculada.</span>
              )}
            </div>
            <div className="border-t border-line pt-2">
              <p className="mb-1 text-[12.5px] font-bold text-muted">Integrantes</p>
              {members.length ? (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-0.5">
                  {members.map((m) => (
                    <li key={m.id}>
                      <PersonChip person={m} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[12.5px] text-subtle">{filter.active && total ? "Ninguém corresponde aos filtros." : "Nenhum integrante ainda."}</p>
              )}
            </div>
            <div className="border-t border-line pt-2">
              <p className="mb-1 text-[12.5px] font-bold text-muted">Iniciativas relacionadas ({initiatives.length})</p>
              {initiatives.length ? (
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-[#3b4470]">
                  {initiatives.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5" title={i.title}>
                      <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: STATUS_TONE[i.status].dot }} />
                      {i.id}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-[12.5px] text-subtle">Vincule plataformas ao squad para ver as iniciativas.</p>
              )}
            </div>
          </article>
        );
      })}
      {canEdit && !filter.active && (
        <button
          type="button"
          onClick={newSquad}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-[22px] border-2 border-dashed border-line-strong text-[14px] font-bold text-muted transition-colors hover:border-violet hover:text-violet"
        >
          <Plus size={22} aria-hidden />
          Novo squad
        </button>
      )}
    </div>
  );
}

/** Aba Colaboradores: tabela (telas largas) ou cards (celular). */
export function PeopleTab({ people }: { people: Person[] }) {
  const { data } = useRoadmap();
  const { openPerson, selectedId, personMenu } = useOrgActions();
  if (!people.length) return NO_RESULTS;
  const squadOf = (p: Person) => squadNames(data.squads, p);
  const managerOf = (p: Person) => data.people.find((x) => x.id === p.managerId)?.name ?? (p.externalManager || undefined);
  const dash = <span className="text-subtle">—</span>;

  return (
    <div className="overflow-hidden rounded-[22px] border border-[#e3e9f4] bg-surface shadow-[var(--shadow-card)]">
      <table className="hidden w-full text-left text-[13.5px] md:table">
        <thead className="bg-[#fbfcff] text-[12.5px] font-extrabold text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">Colaborador</th>
            <th scope="col" className="px-3 py-3">Cargo</th>
            <th scope="col" className="px-3 py-3">Área</th>
            <th scope="col" className="px-3 py-3">Squad</th>
            <th scope="col" className="px-3 py-3">Liderança direta</th>
            <th scope="col" className="w-12 px-2 py-3"><span className="sr-only">Ações</span></th>
          </tr>
        </thead>
        <tbody>
          {people.map((p) => (
            <tr key={p.id} className={cn("border-t border-line", selectedId === p.id ? "bg-[#f1f5ff]" : "hover:bg-[#f8faff]")}>
              <td className="px-4 py-2.5">
                <button type="button" onClick={() => openPerson(p.id)} aria-pressed={selectedId === p.id} className="flex min-w-0 items-center gap-3 text-left">
                  <Avatar person={p} size={34} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold text-ink hover:text-violet">{p.name}</span>
                    <span className="block truncate text-[12.5px] text-muted">{p.email || "E-mail não informado"}</span>
                  </span>
                </button>
              </td>
              <td className="px-3 py-2.5 text-ink">{p.role}</td>
              <td className="px-3 py-2.5 text-ink">{p.area || dash}</td>
              <td className="px-3 py-2.5 text-ink">{squadOf(p) ?? <span className="text-subtle">Sem squad</span>}</td>
              <td className="px-3 py-2.5 text-ink">{managerOf(p) ?? dash}</td>
              <td className="px-2 py-2.5">{personMenu(p).length > 0 && <ActionMenu vertical label={`Ações de ${p.name}`} actions={personMenu(p)} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="divide-y divide-line md:hidden">
        {people.map((p) => (
          <li key={p.id} className="flex items-center gap-1 p-2">
            <div className="min-w-0 flex-1">
              <PersonChip person={p} detail={[p.role, squadOf(p) ?? "Sem squad"].join(" · ")} />
            </div>
            {personMenu(p).length > 0 && <ActionMenu vertical label={`Ações de ${p.name}`} actions={personMenu(p)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Visão por áreas: pessoas agrupadas pela área, com os squads envolvidos. */
export function AreasTab({ people }: { people: Person[] }) {
  const { data } = useRoadmap();
  if (!people.length) return NO_RESULTS;
  const areas = [...new Set(people.map((p) => p.area))].sort((a, b) => (!a ? 1 : !b ? -1 : a.localeCompare(b, "pt-BR")));

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {areas.map((area) => {
        const members = people.filter((p) => p.area === area);
        const squads = data.squads.filter((s) => members.some((m) => orderIn(m, s.id) !== undefined));
        const leaders = members.filter((m) => squadsLedBy(data.squads, m.id).length > 0);
        return (
          <section key={area || "sem-area"} aria-label={area || "Sem área definida"} className="flex flex-col gap-3 rounded-[22px] border border-[#e3e9f4] bg-surface p-4 shadow-[var(--shadow-card)]">
            <header className="flex items-baseline justify-between gap-2">
              <h3 className={cn("text-[16px] font-extrabold", area ? "text-navy" : "text-muted")}>{area || "Sem área definida"}</h3>
              <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-[12px] font-bold text-brand">{plural(members.length, "pessoa", "pessoas")}</span>
            </header>
            <p className="text-[12.5px] text-muted">
              {squads.length ? `Squads: ${squads.map((s) => s.name).join(", ")}` : "Nenhum squad."}
              {leaders.length > 0 && ` · Lideranças: ${leaders.map((l) => l.name).join(", ")}`}
            </p>
            <ul className="flex flex-col gap-0.5 border-t border-line pt-2">
              {members.map((m) => (
                <li key={m.id}>
                  <PersonChip person={m} detail={[m.role, squadNames(data.squads, m)].filter(Boolean).join(" · ")} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
