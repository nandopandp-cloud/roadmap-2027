"use client";

import { ExternalLink, Eye, FilePlus2, FileText, History, Link2, MonitorPlay, Pencil, Plus, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SubHeading } from "@/components/initiatives/drawer/parts";
import { PlatformChip } from "@/components/platforms/platform-icon";
import { Badge } from "@/components/ui/badges";
import { Button, buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { formatDate } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { useArtifactStatus } from "@/lib/client/use-artifact-status";
import { documentReaderHref, prototypeHref, prototypeViewerHref } from "@/lib/domain/artifacts";
import { DOCUMENT_KIND_LABEL, DOCUMENT_STATUS_LABEL, PROTOTYPE_STATUS_LABEL } from "@/lib/domain/labels";
import type { DocumentRef, DocumentStatus, Initiative, Platform, PrototypeStatus } from "@/lib/domain/types";

/** Etapa "Documentação e protótipo" do formulário. */
export const DOCS_FORM_STEP = 4;

const DOC_STATUS_TONE: Record<DocumentStatus, { bg: string; fg: string; dot: string }> = {
  rascunho: { bg: "#F1F3F8", fg: "#4B5577", dot: "#8792B0" },
  em_revisao: { bg: "#EAF1FE", fg: "#1F55C4", dot: "#2868E8" },
  aprovado: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "#22A05A" },
  obsoleto: { bg: "#FDECEC", fg: "#A1262B", dot: "#E25858" },
};

const PROTO_STATUS_TONE: Record<PrototypeStatus, { bg: string; fg: string; dot: string }> = {
  conceito: { bg: "#F1ECFB", fg: "#4A2D91", dot: "#6045D8" },
  em_construcao: { bg: "#FFF2E5", fg: "#934400", dot: "#F28A1F" },
  em_validacao: { bg: "#EAF1FE", fg: "#1F55C4", dot: "#2868E8" },
  validado: { bg: "#E6F6EC", fg: "#1B6B3A", dot: "#22A05A" },
  obsoleto: { bg: "#FDECEC", fg: "#A1262B", dot: "#E25858" },
};

function MissingFile({ path }: { path: string }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff6e5] px-3 py-2 text-[13px] font-semibold text-[#7a4b00]">
      <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />
      Arquivo não encontrado no repositório: <code className="break-all font-mono text-[12px]">{path}</code>
    </p>
  );
}

function DocumentCard({ initiativeId, doc, exists }: { initiativeId: string; doc: DocumentRef; exists: boolean | undefined }) {
  const [showVersions, setShowVersions] = useState(false);
  const missing = doc.source === "repo" && exists === false;
  return (
    <li className="rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
      <div className="flex items-start gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-soft text-blue" aria-hidden>
          <FileText size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-bold uppercase tracking-wide text-subtle">{DOCUMENT_KIND_LABEL[doc.kind]}</p>
          <p className="text-[16px] font-extrabold text-navy">{doc.title}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={DOC_STATUS_TONE[doc.status]} dot size="sm">
              {DOCUMENT_STATUS_LABEL[doc.status]}
            </Badge>
            {doc.version && (
              <Badge tone={{ bg: "#F4F6FA", fg: "#2b3163", dot: "" }} size="sm">
                Versão {doc.version}
              </Badge>
            )}
            {doc.updatedAt && <span className="text-[12.5px] text-muted">Atualizado em {formatDate(doc.updatedAt)}</span>}
          </div>
          <p className="mt-2 break-all font-mono text-[11.5px] text-subtle">
            {doc.source === "repo" ? doc.path : doc.url}
          </p>
        </div>
      </div>
      {missing && <MissingFile path={doc.path} />}
      <div className="mt-3.5 flex flex-wrap gap-2">
        {doc.source === "repo" ? (
          <>
            <Link
              href={documentReaderHref(initiativeId, doc)}
              className={buttonClass(missing ? "secondary" : "outline", "sm")}
              aria-disabled={missing}
            >
              <Eye size={15} aria-hidden /> Ler documento
            </Link>
            <Link href={`${documentReaderHref(initiativeId, doc)}?editar=1`} className={buttonClass("secondary", "sm")}>
              <Pencil size={15} aria-hidden /> {missing ? "Criar conteúdo" : "Editar"}
            </Link>
          </>
        ) : (
          <a href={doc.url} target="_blank" rel="noopener noreferrer" className={buttonClass("outline", "sm")}>
            <ExternalLink size={15} aria-hidden /> Abrir link externo
          </a>
        )}
        {doc.versions.length > 0 && (
          <Button size="sm" variant="ghost" icon={<History size={15} />} onClick={() => setShowVersions((v) => !v)} aria-expanded={showVersions}>
            Histórico de versões ({doc.versions.length})
          </Button>
        )}
      </div>
      {showVersions && (
        <ol className="mt-3 flex flex-col gap-2 border-l-2 border-line pl-4">
          {doc.versions.map((v, idx) => (
            <li key={idx} className="text-[13px] text-muted">
              <span className="font-bold text-ink">v{v.version || "—"}</span>
              {v.date && <span> · {formatDate(v.date)}</span>}
              {v.note && <span> — {v.note}</span>}
            </li>
          ))}
        </ol>
      )}
    </li>
  );
}

export function DocumentsTab({ initiative: i }: { initiative: Initiative }) {
  const { openForm, upsertInitiative } = useRoadmap();
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  const repoPaths = i.documents.filter((d) => d.source === "repo").map((d) => d.path);
  const status = useArtifactStatus(repoPaths);
  const prds = i.documents.filter((d) => d.kind === "prd");
  const others = i.documents.filter((d) => d.kind !== "prd");

  async function createPrd() {
    setCreating(true);
    try {
      const updated = await api.createDocument(i.id, "prd");
      upsertInitiative(updated);
      notify("success", "PRD criado a partir do modelo. Abra-o para editar o conteúdo.");
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível criar o PRD.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SubHeading>PRD</SubHeading>
        {prds.length === 0 ? (
          <EmptyState
            compact
            icon={<FileText size={22} />}
            title="Ainda não há um PRD associado"
            description="Crie um PRD em Markdown na pasta da iniciativa ou vincule um documento existente."
            action={
              <>
                <Button variant="primary" size="sm" icon={<FilePlus2 size={15} />} loading={creating} onClick={createPrd}>
                  Criar PRD
                </Button>
                <Button size="sm" icon={<Link2 size={15} />} onClick={() => openForm(i.id, DOCS_FORM_STEP)}>
                  Vincular documento existente
                </Button>
              </>
            }
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {prds.map((d) => (
              <DocumentCard key={d.id} initiativeId={i.id} doc={d} exists={status[d.path]} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <SubHeading>Outros documentos</SubHeading>
        {others.length === 0 ? (
          <p className="text-[14px] italic text-subtle">Nenhum outro documento associado.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {others.map((d) => (
              <DocumentCard key={d.id} initiativeId={i.id} doc={d} exists={status[d.path]} />
            ))}
          </ul>
        )}
      </div>

      <div>
        <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => openForm(i.id, DOCS_FORM_STEP)}>
          Adicionar ou editar documentos
        </Button>
      </div>
    </div>
  );
}

export function PrototypesTab({ initiative: i, platforms }: { initiative: Initiative; platforms: Platform[] }) {
  const { openForm } = useRoadmap();
  const status = useArtifactStatus(i.prototypes.filter((p) => p.source === "repo").map((p) => p.path));

  if (i.prototypes.length === 0) {
    return (
      <div>
        <EmptyState
          icon={<MonitorPlay size={22} />}
          title="Ainda não há um protótipo associado a esta iniciativa."
          description="Cadastre um caminho local (initiatives/…/prototype/index.html) ou uma URL externa."
          action={
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => openForm(i.id, DOCS_FORM_STEP)}>
              Adicionar protótipo
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {i.prototypes.map((p) => {
          const missing = p.source === "repo" && status[p.path] === false;
          const shown = p.platformIds.map((id) => platforms.find((x) => x.id === id)).filter((x): x is Platform => !!x);
          return (
            <li key={p.id} className="rounded-[18px] border border-[#e6ebf5] bg-surface p-5">
              <div className="flex items-start gap-3.5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-soft text-teal" aria-hidden>
                  <MonitorPlay size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[16px] font-extrabold text-navy">{p.name}</p>
                    <Badge tone={PROTO_STATUS_TONE[p.status]} dot size="sm">
                      {PROTOTYPE_STATUS_LABEL[p.status]}
                    </Badge>
                  </div>
                  {p.description && <p className="mt-1 text-[14px] leading-relaxed text-muted">{p.description}</p>}
                  {shown.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {shown.map((x) => (
                        <PlatformChip key={x.id} platform={x} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {p.flows.length > 0 && (
                <div className="mt-4">
                  <p className="text-[13px] font-bold text-navy">Fluxos disponíveis</p>
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {p.flows.map((f, idx) => (
                      <li key={idx} className="flex gap-2 text-[13.5px] leading-relaxed text-muted">
                        <span aria-hidden className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <p className="mt-3 break-all font-mono text-[11.5px] text-subtle">{p.source === "repo" ? p.path : p.url}</p>
              {missing && <MissingFile path={p.path} />}
              {!missing && (
                <div className="mt-3.5 flex flex-wrap gap-2">
                  {p.source === "repo" && (
                    <Link href={prototypeViewerHref(i.id, p)} className={buttonClass("primary", "sm")}>
                      <Eye size={15} aria-hidden /> Visualizar aqui
                    </Link>
                  )}
                  <a href={prototypeHref(p)} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                    <ExternalLink size={15} aria-hidden /> Abrir em nova aba
                  </a>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <div>
        <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => openForm(i.id, DOCS_FORM_STEP)}>
          Adicionar ou editar protótipos
        </Button>
      </div>
    </div>
  );
}
