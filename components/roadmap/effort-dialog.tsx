"use client";

import { AlertTriangle, CheckCircle2, Code2, Lock, Minus, PenTool, Plus } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { EffortJustification } from "@/components/roadmap/effort-justification";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { Field, SelectField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { useEffortTracks, useEvidenceTracks, useRoadmap } from "@/lib/client/store";
import { EFFORT_TONE } from "@/lib/client/tones";
import { eligibleOwners } from "@/lib/domain/org";
import {
  EFFORT_TRACK_DISCIPLINE,
  EFFORT_TRACK_LABEL,
  EFFORT_TRACKS,
  EMPTY_EFFORT,
  describeEffortStart,
  formatWeeks,
  lastDay,
  planEffort,
  quarterEndDate,
  quarterStartDate,
  type EffortTrack,
} from "@/lib/domain/effort";
import { QUARTER_LABEL } from "@/lib/domain/labels";
import type { EffortEstimate, Initiative, InitiativeEffort } from "@/lib/domain/types";
import { effortEstimateSchema, fieldErrors, initiativeEffortSchema } from "@/lib/validation/schemas";

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
const DAY = 86_400_000;
const fmt = (iso: string) => iso.split("-").reverse().slice(0, 2).join("/");
export const EFFORT_TRACK_ICON: Record<EffortTrack, typeof PenTool> = { design: PenTool, engineering: Code2 };

type TrackDraft = { weeks: string; startMode: EffortEstimate["startMode"]; startDate: string; ownerId: string };
type Draft = Record<EffortTrack, TrackDraft>;

function toDraft(effort: InitiativeEffort): Draft {
  const one = (e: EffortEstimate | null): TrackDraft => ({
    weeks: e ? String(e.weeks).replace(".", ",") : "",
    startMode: e?.startMode ?? "auto",
    startDate: e?.startDate ?? "",
    ownerId: e?.ownerId ?? "",
  });
  return { design: one(effort.design), engineering: one(effort.engineering) };
}

const parseWeeks = (value: string) => Number(value.trim().replace(",", "."));

/** Rascunho → formato salvo. Semanas vazias = frente sem estimativa; texto inválido segue para a validação. */
function fromDraft(d: Draft): Record<EffortTrack, unknown> {
  const one = (t: TrackDraft) =>
    t.weeks.trim() === ""
      ? null
      : { weeks: parseWeeks(t.weeks), startMode: t.startMode, startDate: t.startMode === "date" ? t.startDate : "", ownerId: t.ownerId || null };
  return { design: one(d.design), engineering: one(d.engineering) };
}

/** Versão válida do rascunho para a prévia (frentes com erro ficam de fora). */
function previewEffort(d: Draft): InitiativeEffort {
  const raw = fromDraft(d);
  const out: InitiativeEffort = { ...EMPTY_EFFORT };
  for (const track of EFFORT_TRACKS) {
    if (raw[track] === null) continue;
    const parsed = effortEstimateSchema.safeParse(raw[track]);
    out[track] = parsed.success ? parsed.data : null;
  }
  return out;
}

function WeeksInput({ value, onChange, label, error }: { value: string; onChange: (v: string) => void; label: string; error?: string }) {
  const n = parseWeeks(value) || 0;
  const step = (delta: number) => {
    const next = Math.min(52, Math.max(0, delta > 0 ? Math.floor(n) + 1 : Math.ceil(n) - 1));
    onChange(next ? String(next) : "");
  };
  return (
    <Field label="Semanas de esforço" hint="Semanas inteiras ou meias (ex.: 2,5). Vazio = ainda não estimado." error={error}>
      {({ id, describedBy, invalid }) => (
        <div
          className={`flex h-11 items-stretch overflow-hidden rounded-xl border bg-surface focus-within:border-violet focus-within:ring-4 focus-within:ring-[#6045d8]/12 ${invalid ? "border-[#c42b3a]" : "border-line"}`}
        >
          <button
            type="button"
            onClick={() => step(-1)}
            disabled={n <= 0}
            aria-label={`Diminuir semanas de ${label}`}
            className="flex w-11 shrink-0 items-center justify-center text-muted hover:bg-[#f2f5fb] hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Minus size={16} />
          </button>
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid}
            inputMode="decimal"
            value={value}
            placeholder="—"
            onChange={(e) => onChange(e.target.value.replace(/[^\d,.]/g, "").slice(0, 5))}
            className="w-full min-w-0 border-x border-line text-center text-[17px] font-extrabold text-navy outline-none placeholder:text-subtle"
          />
          <button
            type="button"
            onClick={() => step(1)}
            disabled={n >= 52}
            aria-label={`Aumentar semanas de ${label}`}
            className="flex w-11 shrink-0 items-center justify-center text-muted hover:bg-[#f2f5fb] hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <Plus size={16} />
          </button>
        </div>
      )}
    </Field>
  );
}

function TrackCard({ track, children, weeks, subtitle }: { track: EffortTrack; children: ReactNode; weeks: number | null; subtitle?: string }) {
  const tone = EFFORT_TONE[track];
  const Icon = EFFORT_TRACK_ICON[track];
  return (
    <fieldset className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      <legend className="sr-only">Esforço de {EFFORT_TRACK_LABEL[track]}</legend>
      <div className="flex items-center gap-3 border-b border-line px-4 py-3" style={{ background: tone.soft }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: tone.solid }} aria-hidden>
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-black" style={{ color: tone.fg }}>
            {EFFORT_TRACK_LABEL[track]}
          </span>
          <span className="block text-[12px] font-semibold opacity-80" style={{ color: tone.fg }}>
            {subtitle ?? `Preenchido pelo responsável de ${EFFORT_TRACK_LABEL[track].toLowerCase()}`}
          </span>
        </span>
        <span className="shrink-0 text-[13px] font-extrabold" style={{ color: tone.fg }}>
          {weeks ? formatWeeks(weeks) : "Não estimado"}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
    </fieldset>
  );
}

/** Mini linha do tempo do quarter com as frentes: mostra na hora se a estimativa cabe. */
function EffortPreview({ effort, initiative }: { effort: InitiativeEffort; initiative: Initiative }) {
  const quarter = initiative.quarter;
  const plan = planEffort(effort, quarter);
  if (!quarter) {
    return (
      <p className="rounded-xl bg-[#f7f9fd] px-4 py-3 text-[13px] leading-relaxed text-muted">
        A iniciativa ainda não tem quarter: as frentes só aparecem no Gantt com data de início informada. Defina o quarter na aba Roadmap para o
        posicionamento automático.
      </p>
    );
  }
  const qStart = quarterStartDate(quarter);
  const from = Math.min(Date.parse(qStart), ...plan.tracks.map((t) => Date.parse(t.start)));
  const to = Math.max(Date.parse(quarterEndDate(quarter)), plan.end ? Date.parse(plan.end) : 0);
  const pct = (iso: string) => ((Date.parse(iso) - from) / (to - from)) * 100;
  const months: { left: number; label: string }[] = [];
  const cursor = new Date(from);
  cursor.setUTCDate(1);
  for (; cursor.getTime() < to; cursor.setUTCMonth(cursor.getUTCMonth() + 1)) {
    if (cursor.getTime() >= from) months.push({ left: ((cursor.getTime() - from) / (to - from)) * 100, label: MONTHS[cursor.getUTCMonth()] });
  }
  const weeks = Math.ceil((to - from) / (7 * DAY));
  const quarterEndPct = pct(quarterEndDate(quarter));

  return (
    <section aria-label="Prévia no Gantt" className="rounded-2xl border border-line bg-[#fbfcff] p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-[13px] font-extrabold text-navy">Prévia no Gantt · {QUARTER_LABEL[quarter]}</span>
        {plan.start && plan.end && (
          <span className="text-[12.5px] font-semibold text-muted">
            {fmt(plan.start)} → {fmt(lastDay(plan.end))} · {formatWeeks(plan.spanWeeks)} do início ao fim
          </span>
        )}
      </div>
      <div aria-hidden>
        <div className="relative h-5 text-[11px] font-bold text-subtle">
          {months.map((m) => (
            <span key={m.left} className="absolute top-0 pl-1.5" style={{ left: `${m.left}%` }}>
              {m.label}
            </span>
          ))}
        </div>
        <div
          className="relative h-[76px] overflow-hidden rounded-lg border border-line bg-surface"
          style={{ backgroundImage: "linear-gradient(to right, #edf1f8 1px, transparent 1px)", backgroundSize: `${100 / weeks}% 100%` }}
        >
          <span className="absolute inset-y-0 bg-[#f1ecfb]/60" style={{ left: `${pct(qStart)}%`, width: `${quarterEndPct - pct(qStart)}%` }} />
          {plan.overflowWeeks > 0 && (
            <span
              className="absolute inset-y-0 border-l-2 border-dashed border-[#e08a1e]"
              style={{ left: `${quarterEndPct}%`, right: 0, background: "repeating-linear-gradient(135deg, rgba(242,138,31,0.10) 0 6px, transparent 6px 12px)" }}
            />
          )}
          {EFFORT_TRACKS.map((track, row) => {
            const placed = plan.tracks.find((t) => t.track === track);
            const tone = EFFORT_TONE[track];
            if (!placed)
              return (
                <span
                  key={track}
                  className="absolute left-2 flex h-6 items-center whitespace-nowrap rounded-md border border-dashed bg-surface/80 px-2 text-[11.5px] font-bold"
                  style={{ top: 10 + row * 32, borderColor: tone.line, color: tone.fg }}
                >
                  {EFFORT_TRACK_LABEL[track]} não estimado
                </span>
              );
            return (
              <span
                key={track}
                className="absolute flex h-6 items-center overflow-hidden whitespace-nowrap rounded-md px-2 text-[11.5px] font-extrabold text-white shadow-[0_2px_6px_rgba(23,27,77,0.15)]"
                style={{ top: 10 + row * 32, left: `${pct(placed.start)}%`, width: `${pct(placed.end) - pct(placed.start)}%`, background: tone.solid }}
              >
                {EFFORT_TRACK_LABEL[track]} · {formatWeeks(placed.estimate.weeks)}
              </span>
            );
          })}
        </div>
      </div>
      {plan.end &&
        (plan.overflowWeeks > 0 ? (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff4e5] px-3 py-2 text-[12.5px] font-semibold text-[#8a4b00]">
            <AlertTriangle size={15} className="mt-px shrink-0" aria-hidden />
            Ultrapassa o {QUARTER_LABEL[quarter]} em {formatWeeks(plan.overflowWeeks)}: termina em {fmt(lastDay(plan.end))}. Considere rever o escopo ou o
            quarter.
          </p>
        ) : (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-[#e6f6ec] px-3 py-2 text-[12.5px] font-semibold text-[#1b6b3a]">
            <CheckCircle2 size={15} className="shrink-0" aria-hidden />
            Cabe no {QUARTER_LABEL[quarter]}: termina em {fmt(lastDay(plan.end))}.
          </p>
        ))}
    </section>
  );
}

/** Quem preenche cada frente, além dos editores. */
const TRACK_FILLED_BY: Record<EffortTrack, string> = {
  design: "Preenchido pela coordenação de design ou por editores.",
  engineering: "Preenchido por tech leads ou por editores.",
};

/** Frente que a pessoa não pode estimar: valores atuais, sem edição. */
function ReadOnlyTrack({ track, estimate, ownerName }: { track: EffortTrack; estimate: EffortEstimate | null; ownerName?: string }) {
  if (!estimate) return <p className="text-[13.5px] italic text-subtle">Ainda não estimado. {TRACK_FILLED_BY[track]}</p>;
  return (
    <div className="flex flex-col gap-2 text-[13.5px] text-muted">
      <p>
        <span className="font-bold text-ink">Responsável: </span>
        {ownerName ?? "a definir"}
      </p>
      <p>
        <span className="font-bold text-ink">Início: </span>
        {describeEffortStart(track, estimate)}
      </p>
      <p className="flex items-center gap-1.5 text-[12.5px] text-subtle">
        <Lock size={13} aria-hidden /> {TRACK_FILLED_BY[track]}
      </p>
    </div>
  );
}

/**
 * Estimativa de esforço (semanas de Design e de Engenharia) de uma iniciativa. Aberta pelo
 * Gantt e pela aba Roadmap do drawer. Editores preenchem as duas frentes; tech leads, a de
 * Engenharia; a coordenação de design, a de Design (lib/domain/effort-access.ts).
 */
export function EffortDialog({ initiative, onClose }: { initiative: Initiative; onClose: () => void }) {
  const { data, saveEffort } = useRoadmap();
  const allowed = useEffortTracks();
  /** Frentes cuja justificativa (anexos) a pessoa altera: a do seu time. */
  const evidence = useEvidenceTracks();
  const confirm = useConfirm();
  const notify = useToast();
  const [initial] = useState(() => toDraft(initiative.effort));
  const [draft, setDraft] = useState<Draft>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const canAll = EFFORT_TRACKS.every((t) => allowed.includes(t));
  const ownLabel = allowed.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ");

  const preview = previewEffort(draft);
  const quarterStart = initiative.quarter ? quarterStartDate(initiative.quarter) : null;
  const designEnd = planEffort(preview, initiative.quarter).tracks.find((t) => t.track === "design")?.end;
  const personName = (id: string | null) => (id ? data.people.find((p) => p.id === id)?.name : undefined);

  const set = (track: EffortTrack, patch: Partial<TrackDraft>) => {
    setDraft((d) => ({ ...d, [track]: { ...d[track], ...patch } }));
    setErrors((e) => Object.fromEntries(Object.entries(e).filter(([k]) => !k.startsWith(`${track}.`))));
  };

  async function requestClose() {
    if (saving) return;
    if (dirty) {
      const discard = await confirm({
        title: "Descartar estimativa?",
        message: "As semanas e os responsáveis alterados não serão salvos.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });
      if (!discard) return;
    }
    onClose();
  }

  async function persist(next: Record<EffortTrack, unknown>, message: string) {
    // Frentes fora da permissão seguem exatamente como estão salvas.
    const payload = Object.fromEntries(EFFORT_TRACKS.map((t) => [t, allowed.includes(t) ? next[t] : initiative.effort[t]]));
    const parsed = initiativeEffortSchema.safeParse(payload);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      notify("error", "Revise os campos destacados.");
      return;
    }
    setSaving(true);
    try {
      await saveEffort(initiative.id, parsed.data);
      notify("success", message);
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fields);
        notify("error", error.message);
      } else {
        notify("error", "Não foi possível salvar a estimativa.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function clear() {
    const ok = await confirm({
      title: canAll ? "Limpar estimativa?" : `Limpar estimativa de ${ownLabel}?`,
      message: `As semanas de ${canAll ? "Design e de Engenharia" : ownLabel} desta iniciativa saem do roadmap. A mudança fica registrada no histórico.`,
      confirmLabel: "Limpar estimativa",
      tone: "danger",
    });
    if (ok) await persist({ design: null, engineering: null }, "Estimativa de esforço removida.");
  }

  const track = (t: EffortTrack) => {
    if (!allowed.includes(t)) {
      return (
        <TrackCard
          track={t}
          weeks={initiative.effort[t]?.weeks ?? null}
          subtitle={evidence.includes(t) ? "Você anexa a justificativa desta frente" : "Somente leitura para o seu perfil"}
        >
          <ReadOnlyTrack track={t} estimate={initiative.effort[t]} ownerName={personName(initiative.effort[t]?.ownerId ?? null)} />
          <EffortJustification initiative={initiative} track={t} readOnly={!evidence.includes(t)} />
        </TrackCard>
      );
    }
    const discipline = EFFORT_TRACK_DISCIPLINE[t];
    const ownerId = draft[t].ownerId;
    const missingOwner = !!ownerId && !data.people.some((p) => p.id === ownerId);
    // Só pessoas dos squads das plataformas da iniciativa (e o responsável atual, se já houver).
    const inSquads = new Set(eligibleOwners(data.people, data.squads, initiative.platformIds).map((p) => p.id));
    const candidates = data.people
      .filter((p) => (p.discipline === discipline && inSquads.has(p.id)) || p.id === ownerId)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    const autoLabel =
      t === "design"
        ? `No início do quarter${quarterStart ? ` (${fmt(quarterStart)})` : ""}`
        : `Logo após o design${designEnd ? ` (${fmt(designEnd)})` : ""}`;
    const error = (field: string) => errors[`${t}.${field}`];
    return (
      <TrackCard track={t} weeks={preview[t]?.weeks ?? null}>
        <WeeksInput label={EFFORT_TRACK_LABEL[t]} value={draft[t].weeks} onChange={(weeks) => set(t, { weeks })} error={error("weeks")} />
        <SelectField
          label="Responsável"
          value={missingOwner ? "" : ownerId}
          onChange={(e) => set(t, { ownerId: e.target.value })}
          error={error("ownerId")}
          hint={
            missingOwner
              ? "O responsável anterior não está mais no organograma."
              : candidates.length
                ? undefined
                : `Nenhum colaborador com a função ${EFFORT_TRACK_LABEL[t]} nos squads das plataformas desta iniciativa.`
          }
        >
          <option value="">A definir</option>
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
        <SelectField label="Início" value={draft[t].startMode} onChange={(e) => set(t, { startMode: e.target.value as TrackDraft["startMode"] })}>
          <option value="auto">{autoLabel}</option>
          {t === "engineering" && <option value="parallel">Junto com o design (em paralelo)</option>}
          <option value="date">Em uma data específica</option>
        </SelectField>
        {draft[t].startMode === "date" && (
          <Field label="Data de início" required error={error("startDate")}>
            {({ id, describedBy, invalid }) => (
              <input
                id={id}
                type="date"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                aria-required
                value={draft[t].startDate}
                onChange={(e) => set(t, { startDate: e.target.value })}
                className="h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[14.5px] text-ink hover:border-line-strong focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12 aria-[invalid=true]:border-[#c42b3a]"
              />
            )}
          </Field>
        )}
        <EffortJustification initiative={initiative} track={t} />
      </TrackCard>
    );
  };

  const planned = initiative.quarter ? ` — planejada para o ${QUARTER_LABEL[initiative.quarter]}` : "";
  const ownHasValue = allowed.some((t) => initiative.effort[t]);

  return (
    <Modal
      open
      onClose={requestClose}
      size="lg"
      title="Esforço estimado"
      description={
        canAll
          ? `${initiative.id} · ${initiative.title}${planned}. Cada responsável informa quantas semanas sua frente deve levar.`
          : allowed.length
            ? `${initiative.id} · ${initiative.title}${planned}. Você estima a frente de ${ownLabel}.`
            : `${initiative.id} · ${initiative.title}${planned}. Você anexa os documentos de justificativa de ${evidence.map((t) => EFFORT_TRACK_LABEL[t]).join(" e ")}.`
      }
      footer={
        !allowed.length ? (
          <Button variant="primary" onClick={onClose}>
            Fechar
          </Button>
        ) : (
        <>
          {ownHasValue && (
            <Button variant="ghost" className="sm:mr-auto" onClick={clear} disabled={saving}>
              {canAll ? "Limpar estimativa" : `Limpar ${ownLabel}`}
            </Button>
          )}
          <Button variant="ghost" onClick={requestClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            icon={<CheckCircle2 size={16} />}
            loading={saving}
            disabled={!dirty}
            onClick={() => persist(fromDraft(draft), "Estimativa de esforço salva.")}
          >
            Salvar estimativa
          </Button>
        </>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {track("design")}
          {track("engineering")}
        </div>
        <EffortPreview effort={preview} initiative={initiative} />
      </div>
    </Modal>
  );
}
