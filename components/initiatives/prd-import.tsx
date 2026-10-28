"use client";

import { AlertTriangle, ArrowLeft, Check, Circle, FileText, ListChecks, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { FORM_STEPS, stepForField } from "@/components/initiatives/form/defaults";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { PriorityBadge, QuarterBadge, StatusBadge } from "@/components/ui/badges";
import { Button } from "@/components/ui/button";
import { Modal, useConfirm } from "@/components/ui/dialog";
import { TextAreaField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useInitiativeSelection } from "@/lib/client/selection";
import { useRoadmap } from "@/lib/client/store";
import type { InitiativeInput } from "@/lib/domain/types";
import type { PrdImportResult } from "@/lib/services/prd-import";

/** Campos exibidos no resumo da análise, por etapa do formulário (protótipo fica de fora). */
const REPORT_FIELDS: Array<Array<[keyof InitiativeInput, string]>> = [
  [["title", "Nome"], ["summary", "Descrição curta"], ["category", "Categoria"], ["tags", "Tags"]],
  [
    ["problem", "Problema"], ["currentContext", "Contexto atual"], ["audience", "Público afetado"], ["userPain", "Dor do usuário"],
    ["motivator", "Motivador"], ["evidence", "Evidências"], ["hypothesis", "Hipótese de solução"], ["expectedOutcome", "Resultado esperado"],
    ["objectives", "Objetivos"], ["deliverables", "Principais entregas"],
  ],
  [["platformIds", "Plataformas"], ["journeys", "Jornadas"], ["userProfiles", "Perfis de usuários"], ["areas", "Áreas envolvidas"], ["operationalImpacts", "Impactos operacionais"]],
  [["status", "Status"], ["priority", "Prioridade"], ["quarter", "Quarter"], ["owner", "Responsável"]],
  [],
  [["metrics", "Métricas"], ["technicalDependencies", "Dependências técnicas"], ["risks", "Riscos"], ["pendingDecisions", "Decisões pendentes"], ["relatedInitiativeIds", "Iniciativas relacionadas"]],
];

const REQUIRED: Array<[keyof InitiativeInput, string]> = [
  ["title", "nome"],
  ["problem", "problema"],
  ["motivator", "motivador"],
  ["expectedOutcome", "resultado esperado"],
];

/** Monta o diálogo quando solicitado pelo store. */
export function PrdImportHost() {
  const { prdImportOpen } = useRoadmap();
  return prdImportOpen ? <PrdImportDialog /> : null;
}

function PrdImportDialog() {
  const { data, closePrdImport, openForm, upsertInitiative } = useRoadmap();
  const { open } = useInitiativeSelection();
  const confirm = useConfirm();
  const notify = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string>();
  const [analysis, setAnalysis] = useState<PrdImportResult | null>(null);
  const [busy, setBusy] = useState<"analisar" | "criar" | null>(null);

  async function requestClose() {
    if (busy) return;
    if (text.trim()) {
      const discard = await confirm({
        title: "Descartar o PRD?",
        message: "O texto colado ainda não foi usado para criar uma iniciativa. Se continuar, ele será descartado.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar",
        tone: "danger",
      });
      if (!discard) return;
    }
    closePrdImport();
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 2_000_000) {
      notify("error", "O arquivo é grande demais para um PRD (máximo de 2 MB).");
      return;
    }
    try {
      setText(await file.text());
      setError(undefined);
    } catch {
      notify("error", "Não foi possível ler o arquivo selecionado.");
    }
  }

  async function analyze() {
    if (busy) return;
    setBusy("analisar");
    setError(undefined);
    try {
      setAnalysis(await api.analyzePrd(text));
    } catch (e) {
      if (e instanceof ApiError && e.fields.content) setError(e.fields.content);
      else notify("error", e instanceof ApiError ? e.message : "Não foi possível analisar o PRD.");
    } finally {
      setBusy(null);
    }
  }

  function review(errors?: Record<string, string>) {
    if (!analysis) return;
    const steps = Object.keys(errors ?? {}).map(stepForField);
    closePrdImport();
    openForm(null, steps.length ? Math.min(...steps) : 0, { input: analysis.input, prd: text, errors });
  }

  async function create() {
    if (!analysis || busy) return;
    setBusy("criar");
    try {
      const saved = await api.createInitiativeFromPrd(analysis.input, text);
      upsertInitiative(saved);
      closePrdImport();
      notify("success", `Iniciativa ${saved.id} criada a partir do PRD.`);
      open(saved.id);
    } catch (e) {
      if (e instanceof ApiError && Object.keys(e.fields).length) {
        // Campos recusados pelo servidor (ex.: nome repetido): segue para a revisão nas etapas.
        notify("error", e.message);
        review(e.fields);
        return;
      }
      notify("error", e instanceof ApiError ? e.message : "Não foi possível criar a iniciativa.");
    } finally {
      setBusy(null);
    }
  }

  if (!analysis) {
    return (
      <Modal
        open
        onClose={requestClose}
        size="lg"
        title="Nova iniciativa a partir do PRD"
        description="Cole o texto completo do PRD. O sistema identifica nome, problema, objetivos, público, plataformas, métricas e os demais campos das etapas da iniciativa. O protótipo pode ser associado depois."
        footer={
          <>
            <Button
              variant="ghost"
              className="mr-auto"
              onClick={() => {
                closePrdImport();
                openForm(null);
              }}
              disabled={!!busy}
            >
              Preencher manualmente
            </Button>
            <Button variant="ghost" onClick={requestClose} disabled={!!busy}>
              Cancelar
            </Button>
            <Button variant="primary" icon={<Sparkles size={16} />} loading={busy === "analisar"} onClick={analyze} disabled={!text.trim()}>
              Analisar PRD
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TextAreaField
            label="Texto do PRD"
            required
            rows={16}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(undefined);
            }}
            error={error}
            hint={`${text.length.toLocaleString("pt-BR")} caracteres. Markdown ou texto com seções numeradas (ex.: “1. Visão geral”, “2.2. Problema principal”). O texto é salvo sem alterações como PRD da iniciativa.`}
            placeholder={"# PRD | Nome da funcionalidade\n\n**Plataformas:** …\n**Prioridade:** …\n\n# 1. Visão geral\n…"}
            data-autofocus
          />
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              className="sr-only"
              tabIndex={-1}
              aria-hidden
              onChange={(e) => {
                void loadFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button size="sm" icon={<Upload size={15} />} onClick={() => fileRef.current?.click()} disabled={!!busy}>
              Carregar arquivo .md ou .txt
            </Button>
          </div>
        </div>
      </Modal>
    );
  }

  const { input, report } = analysis;
  const source = new Map(report.found.map((f) => [f.field, f.source]));
  const missingRequired = REQUIRED.filter(([field]) => !String(input[field] ?? "").trim()).map(([, name]) => name);
  const platforms = data.platforms.filter((p) => input.platformIds.includes(p.id));
  const count = (field: keyof InitiativeInput) => {
    const value = input[field];
    return Array.isArray(value) && value.length > 0 ? ` (${value.length})` : "";
  };
  const shown = REPORT_FIELDS.flat();
  const filled = shown.filter(([field]) => source.has(field)).length;

  return (
    <Modal
      open
      onClose={requestClose}
      size="lg"
      title="Iniciativa identificada no PRD"
      description={`${filled} de ${shown.length} campos preenchidos a partir do texto. Crie agora ou revise nas etapas antes de criar.`}
      footer={
        <>
          <Button variant="ghost" className="mr-auto" icon={<ArrowLeft size={16} />} onClick={() => setAnalysis(null)} disabled={!!busy}>
            Voltar ao texto
          </Button>
          <Button icon={<ListChecks size={16} />} onClick={() => review()} disabled={!!busy}>
            Revisar nas etapas
          </Button>
          <Button variant="primary" icon={<Check size={16} />} loading={busy === "criar"} onClick={create} disabled={missingRequired.length > 0}>
            Criar iniciativa
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <section className="rounded-2xl border border-line bg-[#fafbff] p-4">
          <h3 className="text-[17px] font-black text-navy">{input.title || "Nome não identificado"}</h3>
          {input.summary && <p className="mt-1 text-[14px] leading-relaxed text-muted">{input.summary}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge status={input.status} size="sm" />
            <PriorityBadge priority={input.priority} size="sm" />
            <QuarterBadge quarter={input.quarter} size="sm" />
            {platforms.map((p) => (
              <PlatformChip key={p.id} platform={p} />
            ))}
          </div>
        </section>

        {missingRequired.length > 0 && (
          <p role="alert" className="rounded-xl border border-[#f3c6cb] bg-[#fdf1f2] px-4 py-3 text-[13.5px] font-semibold text-[#8a1f2b]">
            Não encontramos no PRD: {missingRequired.join(", ")}. Esses campos são obrigatórios — use “Revisar nas etapas” para preenchê-los.
          </p>
        )}

        {report.warnings.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-xl border border-[#f1d9a6] bg-[#fff8e6] px-4 py-3 text-[13.5px] text-[#7a5200]">
            {report.warnings.map((w) => (
              <li key={w} className="flex gap-2">
                <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FORM_STEPS.map((step, idx) => (
            <section key={step.key} className="rounded-2xl border border-line p-4">
              <h4 className="mb-2 flex items-center gap-2 text-[13.5px] font-extrabold text-navy">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#e9edf7] text-[11.5px] text-muted">{idx + 1}</span>
                {step.label}
              </h4>
              {idx === 4 ? (
                <ul className="flex flex-col gap-1 text-[13px]">
                  <li className="flex items-start gap-2 text-ink">
                    <FileText size={14} className="mt-0.5 shrink-0 text-action" aria-hidden />
                    <span>PRD — texto original salvo como prd.md e associado à iniciativa</span>
                  </li>
                  <li className="flex items-start gap-2 text-muted">
                    <Circle size={14} className="mt-0.5 shrink-0" aria-hidden />
                    <span>Protótipo — associe depois, pela edição da iniciativa</span>
                  </li>
                </ul>
              ) : (
                <ul className="flex flex-col gap-1 text-[13px]">
                  {REPORT_FIELDS[idx].map(([field, name]) => {
                    const from = source.get(field);
                    return (
                      <li key={field} className={cn("flex items-start gap-2", from ? "text-ink" : "text-muted")}>
                        {from ? <Check size={14} className="mt-0.5 shrink-0 text-action" aria-hidden /> : <Circle size={14} className="mt-0.5 shrink-0" aria-hidden />}
                        <span>
                          <span className="font-semibold">
                            {name}
                            {count(field)}
                          </span>
                          <span className="sr-only">{from ? ": preenchido" : ": não encontrado"}</span>
                          {from ? <span className="text-subtle"> · {from}</span> : <span> · não encontrado</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
        <p className="text-[12.5px] text-muted">
          Critérios de aceite, requisitos e regras de negócio continuam no PRD completo, disponível na aba PRD da iniciativa. Etapas de progresso começam todas pendentes.
        </p>
      </div>
    </Modal>
  );
}
