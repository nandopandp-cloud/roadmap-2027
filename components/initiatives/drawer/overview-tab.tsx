"use client";

import {
  BarChart3,
  ClipboardList,
  FileText,
  Gauge,
  GitFork,
  Layers,
  Lightbulb,
  Play,
  SearchCheck,
  Target,
  TriangleAlert,
  Users,
} from "lucide-react";
import { BulletList, DrawerSection, Prose, RowButton } from "@/components/initiatives/drawer/parts";
import { PlatformTile } from "@/components/platforms/platform-icon";
import { StateTag } from "@/components/ui/badges";
import type { DrawerTab } from "@/lib/client/selection";
import { primaryPrd, primaryPrototype } from "@/lib/domain/artifacts";
import { METRIC_TARGET_STATE_LABEL, METRIC_VALUE_STATE_LABEL } from "@/lib/domain/labels";
import type { Initiative, Platform } from "@/lib/domain/types";

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
  const protoPlatforms = proto?.platformIds.map((id) => platforms.find((p) => p.id === id)?.name).filter(Boolean);
  const openItems = i.risks.length + i.pendingDecisions.length + i.dependsOn.length;

  return (
    <div>
      <DrawerSection icon={Target} color="#E8505B" title="Motivador">
        <Prose empty="Motivador não informado.">{i.motivator}</Prose>
      </DrawerSection>

      <DrawerSection icon={TriangleAlert} color="#F28A1F" title="Problema que queremos resolver">
        <Prose empty="Problema não informado.">{i.problem}</Prose>
        {i.currentContext && (
          <details className="group mt-3">
            <summary className="cursor-pointer text-[13px] font-bold text-blue hover:underline">Contexto atual</summary>
            <p className="mt-2 whitespace-pre-line text-[14px] leading-relaxed text-muted">{i.currentContext}</p>
          </details>
        )}
      </DrawerSection>

      <DrawerSection icon={Users} color="#7B4FE3" title="Público afetado">
        <Prose empty="Público ainda não detalhado.">{i.audience}</Prose>
        {i.userPain && (
          <p className="mt-2 text-[14px] leading-relaxed text-muted">
            <strong className="font-bold text-ink">Dor do usuário: </strong>
            {i.userPain}
          </p>
        )}
      </DrawerSection>

      <DrawerSection icon={Layers} color="#2868E8" title="Plataformas impactadas">
        {impacted.length === 0 ? (
          <Prose empty="Plataformas a definir conforme o mapeamento." />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {impacted.map((p) => (
              <li key={p.id} className="flex items-center gap-3.5 rounded-2xl border border-line p-3.5">
                <PlatformTile platform={p} size={50} />
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-navy">{p.name}</p>
                  <p className="text-[13px] leading-snug text-muted">{i.platformNotes[p.id] || p.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>

      <DrawerSection icon={Lightbulb} color="#E0A800" title="Hipótese da iniciativa">
        <Prose empty="Hipótese ainda não registrada.">{i.hypothesis}</Prose>
      </DrawerSection>

      <DrawerSection icon={SearchCheck} color="#00A99D" title="Evidências disponíveis">
        <BulletList
          items={i.evidence}
          empty="Nenhuma evidência registrada ainda. Trate o problema como hipótese até que haja dados."
        />
      </DrawerSection>

      <DrawerSection icon={FileText} color="#2868E8" title="Entregáveis">
        <div className="flex flex-col gap-2.5">
          <RowButton
            onClick={() => onTab("prd")}
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-soft text-blue">
                <FileText size={22} />
              </span>
            }
            title="PRD"
            subtitle={prd ? prd.title : "Ainda não há um PRD associado"}
          />
          <RowButton
            onClick={() => onTab("prototipo")}
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-soft text-teal">
                <Play size={22} />
              </span>
            }
            title="Protótipo navegável"
            subtitle={proto ? protoPlatforms?.join(" + ") || proto.name : "Ainda não há um protótipo associado"}
          />
          <RowButton
            onClick={() => onTab("dependencias")}
            icon={
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-violet">
                <GitFork size={22} />
              </span>
            }
            title="Decisões e dependências"
            subtitle={openItems ? "Contexto, riscos e próximos passos" : "Nenhum risco ou decisão registrada"}
          />
        </div>
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
              <li key={m.id} className="rounded-2xl border border-line p-4">
                <p className="text-[15px] font-bold text-navy">{m.indicator}</p>
                <dl className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-subtle">Valor de referência</dt>
                    <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-ink">
                      {m.baseline && <span className="font-bold">{m.baseline}</span>}
                      <StateTag tone={m.baselineState === "definido" ? "ok" : m.baselineState === "estimado" ? "warn" : "neutral"}>
                        {METRIC_VALUE_STATE_LABEL[m.baselineState]}
                      </StateTag>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-subtle">Meta</dt>
                    <dd className="mt-0.5 flex flex-wrap items-center gap-1.5 text-ink">
                      {m.target && <span className="font-bold">{m.target}</span>}
                      <StateTag tone={m.targetState === "aprovada" ? "ok" : m.targetState === "proposta" ? "warn" : "neutral"}>
                        {METRIC_TARGET_STATE_LABEL[m.targetState]}
                      </StateTag>
                    </dd>
                  </div>
                  {m.observed && (
                    <div>
                      <dt className="font-semibold text-subtle">Resultado observado</dt>
                      <dd className="mt-0.5 font-bold text-ink">
                        {m.observed}
                        {m.lastEvaluatedAt && <span className="font-normal text-muted"> · {m.lastEvaluatedAt}</span>}
                      </dd>
                    </div>
                  )}
                </dl>
                {m.method && (
                  <p className="mt-2.5 flex gap-2 text-[13px] leading-relaxed text-muted">
                    <ClipboardList size={15} className="mt-0.5 shrink-0" aria-hidden />
                    <span>
                      <span className="font-semibold">Método: </span>
                      {m.method}
                    </span>
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </DrawerSection>
    </div>
  );
}
