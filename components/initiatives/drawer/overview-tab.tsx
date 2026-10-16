"use client";

import {
  BarChart3,
  Check,
  ClipboardList,
  FileText,
  Flag,
  Gauge,
  GitFork,
  Globe2,
  Lightbulb,
  ListChecks,
  Play,
  SearchCheck,
  Target,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BulletList, DrawerSection, Prose } from "@/components/initiatives/drawer/parts";
import { PlatformTile } from "@/components/platforms/platform-icon";
import { StateTag } from "@/components/ui/badges";
import { ProgressBar } from "@/components/ui/progress";
import { cn, formatDate } from "@/lib/client/cn";
import type { DrawerTab } from "@/lib/client/selection";
import { documentReaderHref, primaryPrd, primaryPrototype, prototypeViewerHref } from "@/lib/domain/artifacts";
import { METRIC_TARGET_STATE_LABEL, METRIC_VALUE_STATE_LABEL, PHASE_STATE_LABEL } from "@/lib/domain/labels";
import { progressOf } from "@/lib/domain/progress";
import type { Initiative, Phase, Platform } from "@/lib/domain/types";

/** Ícone de estado de etapa: concluída, em andamento ou pendente. */
export function PhaseIcon({ state }: { state: Phase["state"] }) {
  if (state === "concluida") {
    return (
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#22A05A] text-white">
        <Check size={12} strokeWidth={3.4} aria-hidden />
      </span>
    );
  }
  if (state === "em_andamento") return <span className="h-[18px] w-[18px] shrink-0 rounded-full border-[5px] border-blue bg-white" aria-hidden />;
  return <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-[#cfd6e6] bg-white" aria-hidden />;
}

/** Bloco de documento/link da seção "Documentos e links". */
function DocTile({
  href,
  onClick,
  icon,
  tone,
  title,
  subtitle,
}: {
  href?: string;
  onClick?: () => void;
  icon: ReactNode;
  tone: string;
  title: string;
  subtitle: string;
}) {
  const body = (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: `${tone}17`, color: tone }} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-extrabold leading-tight text-navy">{title}</span>
        <span className="mt-0.5 block truncate text-[12.5px] text-muted">{subtitle}</span>
      </span>
    </>
  );
  const cls =
    "flex min-w-0 items-center gap-3 rounded-2xl border border-[#e6ebf5] bg-surface p-3.5 text-left transition-colors hover:border-line-strong hover:bg-[#fafbff]";
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export function OverviewTab({
  initiative: i,
  platforms,
  onTab,
}: {
  initiative: Initiative;
  platforms: Platform[];
  onTab: (tab: DrawerTab) => void;
}) {
  const impacted = i.platformIds.map((id) => platforms.find((p) => p.id === id)).filter((p): p is Platform => !!p);
  const prd = primaryPrd(i.documents);
  const proto = primaryPrototype(i.prototypes);
  const decisions = i.documents.find((d) => d.kind === "decisoes");
  const protoPlatforms = proto?.platformIds.map((id) => platforms.find((p) => p.id === id)?.name).filter(Boolean) ?? [];
  const progress = progressOf(i.phases);

  return (
    <div className="flex flex-col gap-4">
      <DrawerSection icon={Target} color="#E8505B" title="Motivador">
        <Prose empty="Motivador não informado.">{i.motivator}</Prose>
      </DrawerSection>

      <DrawerSection icon={Flag} color="#2868E8" title="Objetivos principais">
        {i.objectives.length === 0 ? (
          <Prose empty="Nenhum objetivo registrado." />
        ) : (
          <ul className="flex flex-col gap-2">
            {i.objectives.map((o, idx) => (
              <li key={idx} className="flex gap-2.5 text-[14.5px] leading-snug text-[#3b4470]">
                <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#22A05A] text-white">
                  <Check size={12} strokeWidth={3.4} aria-hidden />
                </span>
                {o}
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <div className="grid grid-cols-1 gap-4 @xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="@container rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
            <h3 className="flex items-center gap-3 text-[16px] font-extrabold text-navy">
              <Globe2 size={22} className="text-violet" aria-hidden /> Plataformas impactadas
            </h3>
            {impacted.length === 0 ? (
              <p className="mt-3 text-[14px] italic text-subtle">Plataformas a definir conforme o mapeamento.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-1 gap-4 @md:grid-cols-2">
                {impacted.map((p) => (
                  <li key={p.id} className="flex min-w-0 items-start gap-3">
                    <PlatformTile platform={p} size={44} />
                    <div className="min-w-0">
                      <p className="text-[14px] font-extrabold text-navy">{p.name}</p>
                      <p className="text-[12.5px] leading-snug text-muted">{i.platformNotes[p.id] || p.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
            <h3 className="flex items-center gap-3 text-[16px] font-extrabold text-navy">
              <ClipboardList size={22} className="text-blue" aria-hidden /> Principais entregas
            </h3>
            {i.deliverables.length === 0 ? (
              <p className="mt-3 text-[14px] italic text-subtle">Nenhuma entrega registrada.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2.5">
                {i.deliverables.map((d, idx) => (
                  <li key={idx} className="flex items-center gap-2.5 text-[14px] text-[#3b4470]">
                    <FileText size={16} className="shrink-0 text-muted" aria-hidden />
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="h-fit rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[16px] font-extrabold text-navy">Status e progresso</h3>
            {progress !== null && <span className="text-[14px] font-extrabold text-navy">{progress}%</span>}
          </div>
          <ProgressBar value={progress} showLabel={false} className="mt-3" />
          {i.phases.length > 0 ? (
            <ol className="mt-4 flex flex-col gap-3">
              {i.phases.map((ph) => (
                <li key={ph.id} className="flex items-center gap-3 text-[14px]">
                  <PhaseIcon state={ph.state} />
                  <span className={cn(ph.state === "pendente" ? "text-muted" : "font-bold text-navy")}>{ph.title}</span>
                  <span className="sr-only">— {PHASE_STATE_LABEL[ph.state]}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-[13px] italic text-subtle">Defina etapas para acompanhar o progresso.</p>
          )}
          <button type="button" onClick={() => onTab("roadmap")} className="mt-4 text-[13px] font-bold text-blue hover:underline">
            Atualizar etapas
          </button>
        </section>
      </div>

      <section>
        <h3 className="mb-3 mt-2 flex items-center gap-3 text-[16.5px] font-extrabold text-navy">
          <ListChecks size={22} className="text-blue" aria-hidden /> Documentos e links
        </h3>
        <div className="grid grid-cols-1 gap-3 @lg:grid-cols-3">
          {prd ? (
            <DocTile
              href={prd.source === "repo" ? documentReaderHref(i.id, prd) : undefined}
              onClick={prd.source === "externo" ? () => window.open(prd.url, "_blank", "noopener,noreferrer") : undefined}
              icon={<FileText size={22} />}
              tone="#2868E8"
              title="PRD"
              subtitle={[prd.version && `v${prd.version}`, prd.updatedAt && formatDate(prd.updatedAt, { dateStyle: "short" })].filter(Boolean).join(" · ") || prd.title}
            />
          ) : (
            <DocTile onClick={() => onTab("prd")} icon={<FileText size={22} />} tone="#2868E8" title="PRD" subtitle="Ainda não associado" />
          )}
          {proto ? (
            <DocTile
              href={proto.source === "repo" ? prototypeViewerHref(i.id, proto) : undefined}
              onClick={proto.source === "externo" ? () => window.open(proto.url, "_blank", "noopener,noreferrer") : undefined}
              icon={<Play size={22} />}
              tone="#00A99D"
              title="Protótipo navegável"
              subtitle={protoPlatforms.join(" + ") || proto.name}
            />
          ) : (
            <DocTile onClick={() => onTab("prototipo")} icon={<Play size={22} />} tone="#00A99D" title="Protótipo navegável" subtitle="Ainda não associado" />
          )}
          <DocTile
            href={decisions?.source === "repo" ? documentReaderHref(i.id, decisions) : undefined}
            onClick={decisions?.source === "repo" ? undefined : () => onTab("dependencias")}
            icon={<GitFork size={22} />}
            tone="#6045D8"
            title="Decisões e dependências"
            subtitle={decisions ? "Registro de decisões" : "Riscos e próximos passos"}
          />
        </div>
      </section>

      <DrawerSection icon={TriangleAlert} color="#F28A1F" title="Problema que queremos resolver">
        <Prose empty="Problema não informado.">{i.problem}</Prose>
        {i.audience && (
          <p className="mt-2.5 text-[14px] leading-relaxed text-muted">
            <strong className="font-bold text-ink">Público afetado: </strong>
            {i.audience}
          </p>
        )}
        {i.userPain && (
          <p className="mt-1.5 text-[14px] leading-relaxed text-muted">
            <strong className="font-bold text-ink">Dor do usuário: </strong>
            {i.userPain}
          </p>
        )}
        {i.currentContext && (
          <details className="mt-2.5">
            <summary className="cursor-pointer text-[13px] font-bold text-blue hover:underline">Contexto atual</summary>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">{i.currentContext}</p>
          </details>
        )}
      </DrawerSection>

      <DrawerSection icon={Lightbulb} color="#E0A800" title="Hipótese da iniciativa">
        <Prose empty="Hipótese ainda não registrada.">{i.hypothesis}</Prose>
      </DrawerSection>

      <DrawerSection icon={SearchCheck} color="#00A99D" title="Evidências disponíveis">
        <BulletList items={i.evidence} empty="Nenhuma evidência registrada ainda. Trate o problema como hipótese até que haja dados." />
      </DrawerSection>

      <DrawerSection icon={BarChart3} color="#2868E8" title="Resultado esperado">
        <Prose empty="Resultado esperado não informado.">{i.expectedOutcome}</Prose>
      </DrawerSection>

      <DrawerSection icon={Gauge} color="#5938A6" title="Métricas de sucesso">
        {i.metrics.length === 0 ? (
          <Prose empty="Nenhuma métrica definida. Métricas, valores de referência e metas não devem ser presumidos." />
        ) : (
          <ul className="flex flex-col gap-3">
            {i.metrics.map((m) => (
              <li key={m.id} className="rounded-xl bg-[#f7f9fd] p-3.5">
                <p className="text-[14.5px] font-bold text-navy">{m.indicator}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-muted">
                  <span className="flex items-center gap-1.5">
                    Referência: {m.baseline && <strong className="text-ink">{m.baseline}</strong>}
                    <StateTag tone={m.baselineState === "definido" ? "ok" : m.baselineState === "estimado" ? "warn" : "neutral"}>
                      {METRIC_VALUE_STATE_LABEL[m.baselineState]}
                    </StateTag>
                  </span>
                  <span className="flex items-center gap-1.5">
                    Meta: {m.target && <strong className="text-ink">{m.target}</strong>}
                    <StateTag tone={m.targetState === "aprovada" ? "ok" : m.targetState === "proposta" ? "warn" : "neutral"}>
                      {METRIC_TARGET_STATE_LABEL[m.targetState]}
                    </StateTag>
                  </span>
                  {m.observed && (
                    <span>
                      Observado: <strong className="text-ink">{m.observed}</strong>
                      {m.lastEvaluatedAt && ` · ${formatDate(m.lastEvaluatedAt)}`}
                    </span>
                  )}
                </div>
                {m.method && <p className="mt-2 text-[12.5px] leading-relaxed text-muted">Método: {m.method}</p>}
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
    </div>
  );
}
