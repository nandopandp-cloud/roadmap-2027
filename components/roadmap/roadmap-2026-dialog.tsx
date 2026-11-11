"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, Minus, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { Checkbox, SelectField, TextField } from "@/components/ui/fields";
import { Select } from "@/components/ui/select";
import { cn, formatDateTime, plural } from "@/lib/client/cn";
import { STATUS_2026_TONE, WORK_2026_TONE } from "@/lib/client/tones";
import { ROADMAP_2026_STATUSES, ROADMAP_2026_WEEK_COUNT, ROADMAP_2026_WORK } from "@/lib/domain/constants";
import {
  CYCLE_2026_MONTHS,
  OWNER_TRACK_DISCIPLINE,
  OWNER_TRACK_LABEL,
  OWNER_TRACKS_2026,
  STATUS_2026_LABEL,
  WEEKS_PER_MONTH,
  editableEnd,
  lateReason,
  weekLabel,
  WORK_2026_LABEL,
  weekPosition,
  workPeriod,
  type OwnerTrack2026,
  type Owners2026,
  type Work2026,
} from "@/lib/domain/roadmap-2026";
import type { Person, Platform, Roadmap2026Item, Roadmap2026Work } from "@/lib/domain/types";
import { Avatar } from "@/components/org/avatar";
import { OWNER_TRACK_ICON } from "@/components/roadmap/roadmap-2026";

const WEEKS = ROADMAP_2026_WEEK_COUNT;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const control =
  "h-10 rounded-xl border border-line bg-surface px-3 text-[13.5px] font-semibold text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12";

/** Prévia da linha do tempo da iniciativa enquanto é editada. */
function TimelinePreview({ segments }: { segments: Roadmap2026Work[] }) {
  return (
    <div aria-hidden className="rounded-xl border border-line bg-[#fbfcff] px-3 pb-2 pt-1.5">
      <div className="grid grid-cols-10 text-[10.5px] font-bold text-subtle">
        {CYCLE_2026_MONTHS.map((m) => (
          <span key={m.short} className="px-1">
            {m.short}
          </span>
        ))}
      </div>
      <div
        className="relative mt-1 h-7 rounded-md bg-surface"
        style={{
          backgroundImage: "linear-gradient(to right, #d5deee 1px, transparent 1px), linear-gradient(to right, #eef1f7 1px, transparent 1px)",
          backgroundSize: "10% 100%, 2.5% 100%",
        }}
      >
        {segments.map((s) => (
          <span
            key={s.id}
            className="absolute top-1 h-5 rounded"
            style={{ left: `${weekPosition(s.start)}%`, width: `calc(${weekPosition(s.weeks)}% - 1px)`, background: WORK_2026_TONE[s.work].solid }}
          />
        ))}
      </div>
    </div>
  );
}

function SegmentRow({
  segment: s,
  index,
  onChange,
  onRemove,
}: {
  segment: Roadmap2026Work;
  index: number;
  onChange: (s: Roadmap2026Work) => void;
  onRemove: () => void;
}) {
  const month = Math.floor(s.start / WEEKS_PER_MONTH);
  const week = s.start % WEEKS_PER_MONTH;
  const setStart = (start: number) => onChange({ ...s, start: clamp(start, 0, WEEKS - 1), weeks: clamp(s.weeks, 1, WEEKS - clamp(start, 0, WEEKS - 1)) });
  const n = index + 1;
  return (
    <li className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
      <span aria-hidden className="h-8 w-1.5 shrink-0 rounded-full" style={{ background: WORK_2026_TONE[s.work].solid }} />
      <span className="w-[170px] shrink-0">
      <Select value={s.work} onChange={(v) => onChange({ ...s, work: v as Work2026 })} aria-label={`Fase ${n}: tipo de trabalho`} className={control}>
        {ROADMAP_2026_WORK.map((w) => (
          <option key={w} value={w}>
            {WORK_2026_LABEL[w]}
          </option>
        ))}
      </Select>
      </span>
      <span className="text-[12.5px] font-semibold text-muted">início</span>
      <span className="w-[74px] shrink-0">
      <Select value={String(week)} onChange={(v) => setStart(month * WEEKS_PER_MONTH + Number(v))} aria-label={`Fase ${n}: semana de início`} className={control}>
        {[0, 1, 2, 3].map((w) => (
          <option key={w} value={String(w)}>
            S{w + 1}
          </option>
        ))}
      </Select>
      </span>
      <span className="w-[104px] shrink-0">
      <Select value={String(month)} onChange={(v) => setStart(Number(v) * WEEKS_PER_MONTH + week)} aria-label={`Fase ${n}: mês de início`} className={control}>
        {CYCLE_2026_MONTHS.map((m, idx) => (
          <option key={m.short} value={String(idx)}>
            {m.short.toLowerCase()}/{String(m.year).slice(2)}
          </option>
        ))}
      </Select>
      </span>
      <span className="mr-auto flex items-center rounded-xl border border-line" role="group" aria-label={`Fase ${n}: duração`}>
        <button
          type="button"
          onClick={() => onChange({ ...s, weeks: Math.max(1, s.weeks - 1) })}
          disabled={s.weeks <= 1}
          aria-label="Diminuir uma semana"
          className="flex h-10 w-9 items-center justify-center rounded-l-xl text-muted hover:bg-canvas disabled:opacity-40"
        >
          <Minus size={15} />
        </button>
        <span className="min-w-[92px] text-center text-[13.5px] font-extrabold text-navy" aria-live="polite">
          {plural(s.weeks, "semana", "semanas")}
        </span>
        <button
          type="button"
          onClick={() => onChange({ ...s, weeks: Math.min(WEEKS - s.start, s.weeks + 1) })}
          disabled={s.start + s.weeks >= WEEKS}
          aria-label="Aumentar uma semana"
          className="flex h-10 w-9 items-center justify-center rounded-r-xl text-muted hover:bg-canvas disabled:opacity-40"
        >
          <Plus size={15} />
        </button>
      </span>
      <button type="button" onClick={onRemove} aria-label={`Remover a fase ${n}`} className="flex h-9 w-9 items-center justify-center rounded-lg text-subtle hover:bg-[#fdecec] hover:text-[#c42b3a]">
        <X size={16} />
      </button>
      <span className="basis-full pl-3.5 text-[12px] text-subtle">{workPeriod(s)}</span>
    </li>
  );
}

/** Pessoas responsáveis por uma frente: escolhidas no organograma, com avatar. */
function OwnerPicker({ track, people, value, onChange }: { track: OwnerTrack2026; people: Person[]; value: string[]; onChange: (ids: string[]) => void }) {
  const Icon = OWNER_TRACK_ICON[track];
  const chosen = value.map((id) => people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const discipline = OWNER_TRACK_DISCIPLINE[track];
  // Quem tem a função da frente aparece primeiro; depois as demais pessoas.
  const options = people
    .filter((p) => !value.includes(p.id))
    .sort((a, b) => Number(b.discipline === discipline) - Number(a.discipline === discipline) || a.name.localeCompare(b.name, "pt-BR"));
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-2.5">
      <span className="flex w-[104px] shrink-0 items-center gap-1.5 text-[13px] font-bold text-ink">
        <Icon size={15} aria-hidden className="text-muted" />
        {OWNER_TRACK_LABEL[track]}
      </span>
      {chosen.map((p) => (
        <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas py-0.5 pl-0.5 pr-1 text-[13px] font-semibold text-ink">
          <Avatar person={p} size={24} />
          {p.name}
          <button
            type="button"
            onClick={() => onChange(value.filter((id) => id !== p.id))}
            aria-label={`Remover ${p.name} de ${OWNER_TRACK_LABEL[track]}`}
            className="flex h-6 w-6 items-center justify-center rounded-full text-subtle hover:bg-[#fdecec] hover:text-[#c42b3a]"
          >
            <X size={13} />
          </button>
        </span>
      ))}
      {options.length > 0 ? (
        <span className="w-[210px]">
          <Select value="" onChange={(id) => id && onChange([...value, id])} aria-label={`Adicionar responsável de ${OWNER_TRACK_LABEL[track]}`} className={control}>
            <option value="">{chosen.length ? "Adicionar outra pessoa…" : "Escolher pessoa…"}</option>
            {options.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
                {p.role ? ` · ${p.role}` : ""}
              </option>
            ))}
          </Select>
        </span>
      ) : (
        !people.length && <span className="text-[12.5px] text-muted">Cadastre as pessoas em Times &amp; Squads.</span>
      )}
    </div>
  );
}

/** Edição de uma iniciativa do Roadmap 2026: status, identificação, responsáveis e semanas. */
export function Item2026Dialog({
  item,
  platforms,
  owners: initialOwners,
  people,
  onClose,
  onSave,
  onRemove,
}: {
  item: Roadmap2026Item;
  platforms: Platform[];
  /** Responsáveis atuais e o organograma (Times & Squads). */
  owners: Owners2026;
  people: Person[];
  onClose: () => void;
  /** Devolve se salvou (em caso de erro a janela continua aberta). */
  onSave: (item: Roadmap2026Item, owners: Owners2026) => Promise<boolean>;
  onRemove: (id: string) => Promise<boolean>;
}) {
  const confirm = useConfirm();
  const [draft, setDraft] = useState(item);
  const [busy, setBusy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const set = <K extends keyof Roadmap2026Item>(key: K, value: Roadmap2026Item[K]) => setDraft((d) => ({ ...d, [key]: value }));
  // Pessoas que saíram de Times & Squads não aparecem nem são reenviadas.
  const [start] = useState(() => {
    const known = (ids: string[]) => ids.filter((id) => people.some((p) => p.id === id));
    return { design: known(initialOwners.design), engineering: known(initialOwners.engineering), qa: known(initialOwners.qa) };
  });
  const [owners, setOwners] = useState(start);
  const dirty = JSON.stringify(draft) !== JSON.stringify(item) || JSON.stringify(owners) !== JSON.stringify(start);
  const sheetText = OWNER_TRACKS_2026.filter((t) => item[t])
    .map((t) => `${OWNER_TRACK_LABEL[t]} “${item[t]}”`)
    .join(" · ");
  const squads = [...platforms.map((p) => ({ value: p.id, label: p.name })), { value: "", label: "Transversais" }];

  const close = async () => {
    if (dirty && !(await confirm({ title: "Descartar alterações?", message: "As mudanças nesta iniciativa ainda não foram salvas.", confirmLabel: "Descartar", tone: "danger" }))) return;
    onClose();
  };
  const remove = async () => {
    if (!(await confirm({ title: `Remover “${item.title}”?`, message: "A iniciativa sai do Roadmap 2026. Essa ação não pode ser desfeita.", confirmLabel: "Remover", tone: "danger" }))) return;
    setBusy(true);
    if (!(await onRemove(item.id))) setBusy(false);
  };
  const shiftAll = (delta: number) =>
    set(
      "segments",
      draft.segments.map((s) => ({ ...s, start: clamp(s.start + delta, 0, WEEKS - s.weeks) })),
    );
  const first = draft.segments.length ? Math.min(...draft.segments.map((s) => s.start)) : 0;
  const last = draft.segments.length ? Math.max(...draft.segments.map((s) => s.start + s.weeks)) : 0;

  return (
    <Modal
      open
      onClose={() => void close()}
      size="lg"
      title="Editar iniciativa · Roadmap 2026"
      footer={
        <>
          <Button variant="ghost" className="mr-auto text-[#c42b3a] hover:bg-[#fdecec]" icon={<Trash2 size={15} />} disabled={busy} onClick={() => void remove()}>
            Remover iniciativa
          </Button>
          <Button onClick={() => void close()}>Cancelar</Button>
          <Button
            variant="primary"
            loading={busy}
            disabled={!dirty || !draft.title.trim()}
            onClick={async () => {
              setBusy(true);
              if (!(await onSave({ ...draft, title: draft.title.trim(), subtitle: draft.subtitle.trim() }, owners))) setBusy(false);
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <fieldset>
          <legend className="mb-2 text-sm font-bold text-ink">Status</legend>
          <div role="radiogroup" aria-label="Status" className="flex flex-wrap gap-2">
            {ROADMAP_2026_STATUSES.map((st) => {
              const tone = STATUS_2026_TONE[st];
              const on = draft.status === st;
              return (
                <button
                  key={st}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set("status", st)}
                  className={cn("inline-flex h-9 items-center gap-2 rounded-full border-2 px-3.5 text-[13px] font-bold transition-colors", on ? "" : "border-line bg-surface text-muted hover:border-line-strong")}
                  style={on ? { background: tone.bg, color: tone.fg, borderColor: tone.dot } : undefined}
                >
                  <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: tone.dot }} />
                  {STATUS_2026_LABEL[st]}
                </button>
              );
            })}
          </div>
          {lateReason(draft) === "prazo" && editableEnd(draft) !== null && (
            <p className="mt-2 flex gap-1.5 rounded-lg bg-[#fdecec] px-3 py-2 text-[12.5px] font-semibold text-[#a1262b]">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden />
              O fim projetado ({weekLabel(editableEnd(draft)! - 1)}) já passou: a iniciativa aparece como Atrasada até ser concluída ou ter as semanas estendidas.
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Nome" required value={draft.title} onChange={(e) => set("title", e.target.value)} className="sm:col-span-2" />
          <TextField
            label="Subtítulo"
            hint="Frase curta exibida abaixo do nome."
            value={draft.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            placeholder="Ex.: o que será entregue"
            className="sm:col-span-2"
          />
          <SelectField
            label="Squad"
            value={draft.platformId ?? ""}
            onChange={(e) => {
              const option = squads.find((o) => o.value === e.target.value);
              setDraft((d) => ({ ...d, platformId: e.target.value || null, squad: option?.label ?? d.squad }));
            }}
          >
            {squads.map((o) => (
              <option key={o.value || "transversais"} value={o.value}>
                {o.label}
              </option>
            ))}
          </SelectField>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-bold text-ink">Responsáveis</legend>
          <p className="-mt-1 text-xs text-muted">Quem está tocando a iniciativa em cada frente. As pessoas vêm de Times &amp; Squads.</p>
          {OWNER_TRACKS_2026.map((track) => (
            <OwnerPicker key={track} track={track} people={people} value={owners[track]} onChange={(ids) => setOwners((o) => ({ ...o, [track]: ids }))} />
          ))}
          {sheetText && <p className="text-xs text-subtle">Na planilha: {sheetText}.</p>}
        </fieldset>
        <Checkbox label="Backlog" hint="Ainda não priorizada para execução." checked={draft.backlog} onChange={(v) => set("backlog", v)} />

        <section aria-labelledby="fases-2026" className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 id="fases-2026" className="text-sm font-bold text-ink">
                Semanas de produção
              </h3>
              <p className="text-xs text-muted">
                {draft.segments.length ? `${plural(last - first, "semana", "semanas")} do início ao fim.` : "Nenhuma semana planejada."} Mova ou mude a duração de cada fase.
              </p>
            </div>
            {draft.segments.length > 0 && (
              <span className="flex items-center gap-1.5" role="group" aria-label="Mover todas as fases">
                <span className="text-[12.5px] font-semibold text-muted">Mover tudo</span>
                <Button size="sm" icon={<ArrowLeft size={14} />} onClick={() => shiftAll(-1)} disabled={first <= 0}>
                  1 semana
                </Button>
                <Button size="sm" icon={<ArrowRight size={14} />} onClick={() => shiftAll(1)} disabled={last >= WEEKS}>
                  1 semana
                </Button>
              </span>
            )}
          </div>
          {draft.segments.length > 0 && <TimelinePreview segments={draft.segments} />}
          <ul className="flex flex-col gap-2">
            {draft.segments.map((s, idx) => (
              <SegmentRow
                key={s.id}
                segment={s}
                index={idx}
                onChange={(next) => set("segments", draft.segments.map((x) => (x.id === s.id ? next : x)))}
                onRemove={() => set("segments", draft.segments.filter((x) => x.id !== s.id))}
              />
            ))}
          </ul>
          <Button
            size="sm"
            variant="ghost"
            className="self-start"
            icon={<Plus size={15} />}
            onClick={() => {
              const start = Math.min(last, WEEKS - 1);
              set("segments", [...draft.segments, { id: `${draft.id}-${Date.now()}`, work: "engenharia", start, weeks: Math.min(2, WEEKS - start) }]);
            }}
          >
            Adicionar fase
          </Button>
        </section>

        <section aria-labelledby="historico-2026" className="border-t border-line pt-4">
          <h3 id="historico-2026" className="text-sm font-bold text-ink">
            Histórico
          </h3>
          {item.history.length === 0 ? (
            <p className="mt-1 text-xs text-muted">Nenhuma alteração desde a importação da planilha.</p>
          ) : (
            <>
              <ul className="mt-2 flex flex-col gap-1.5">
                {(showHistory ? item.history : item.history.slice(0, 4)).map((h) => (
                  <li key={h.id} className="flex gap-2 text-[12.5px] text-muted">
                    <span className="shrink-0 font-semibold text-subtle">{formatDateTime(h.at)}</span>
                    <span className="text-ink">{h.description}</span>
                  </li>
                ))}
              </ul>
              {item.history.length > 4 && (
                <button type="button" onClick={() => setShowHistory((v) => !v)} className="mt-1.5 text-[12.5px] font-bold text-brand hover:underline">
                  {showHistory ? "Mostrar menos" : `Ver todo o histórico (${item.history.length})`}
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </Modal>
  );
}
