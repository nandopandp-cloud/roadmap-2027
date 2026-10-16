"use client";

import { ArrowLeft, Eye, FileWarning, ListTree, Pencil, Save, SquarePen } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { extractToc, MarkdownView } from "@/components/documents/markdown";
import { PageContainer, TopBar } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badges";
import { Button, buttonClass } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { EmptyState, ErrorBanner, Skeleton } from "@/components/ui/feedback";
import { TextField } from "@/components/ui/fields";
import { useToast } from "@/components/ui/toast";
import { api, ApiError } from "@/lib/client/api";
import { cn, formatDate } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { DOCUMENT_KIND_LABEL, DOCUMENT_STATUS_LABEL } from "@/lib/domain/labels";

type FileState =
  | { status: "loading" }
  | { status: "ready"; content: string }
  | { status: "missing" }
  | { status: "error"; message: string };

/** Sugere a próxima versão menor (1.0 → 1.1). */
function bumpVersion(v: string): string {
  const m = /^(\d+)\.(\d+)$/.exec(v.trim());
  if (m) return `${m[1]}.${Number(m[2]) + 1}`;
  return v ? v : "0.1";
}

export function DocumentView({ initiativeId, documentId }: { initiativeId: string; documentId: string }) {
  const { load, initiativeById, upsertInitiative } = useRoadmap();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const confirm = useConfirm();
  const notify = useToast();

  const initiative = initiativeById(initiativeId);
  const doc = initiative?.documents.find((d) => d.id === documentId);
  const editing = params.get("editar") === "1";
  const backHref = `/iniciativas?iniciativa=${initiativeId}&aba=${doc?.kind === "decisoes" ? "dependencias" : "prd"}`;

  const [file, setFile] = useState<FileState>({ status: "loading" });
  const [draft, setDraft] = useState("");
  const [version, setVersion] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [mobilePane, setMobilePane] = useState<"write" | "preview">("write");

  const original = file.status === "ready" ? file.content : "";
  const dirty = editing && draft !== original;

  const loadFile = useCallback(async (path: string) => {
    setFile({ status: "loading" });
    try {
      const result = await api.readDocument(path);
      setFile({ status: "ready", content: result.content });
      setDraft(result.content);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) setFile({ status: "missing" });
      else setFile({ status: "error", message: error instanceof ApiError ? error.message : "Não foi possível carregar o documento." });
    }
  }, []);

  useEffect(() => {
    if (doc?.source === "repo") void loadFile(doc.path);
  }, [doc?.source, doc?.path, loadFile]);

  useEffect(() => {
    if (editing && doc) {
      setVersion(bumpVersion(doc.version));
      setNote("");
    }
  }, [editing, doc?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const toc = useMemo(() => extractToc(editing ? draft : original), [editing, draft, original]);

  const setEditing = (value: boolean) => router.replace(value ? `${pathname}?editar=1` : pathname, { scroll: false });

  async function cancelEdit() {
    if (dirty) {
      const ok = await confirm({
        title: "Descartar alterações no documento?",
        message: "As alterações feitas no texto ainda não foram salvas.",
        confirmLabel: "Descartar",
        cancelLabel: "Continuar editando",
        tone: "danger",
      });
      if (!ok) return;
    }
    setDraft(original);
    if (file.status === "missing") router.push(backHref);
    else setEditing(false);
  }

  async function save() {
    if (!doc || saving) return;
    if (!draft.trim()) {
      notify("error", "O documento não pode ficar vazio.");
      return;
    }
    setSaving(true);
    try {
      const result = await api.saveDocument({
        path: doc.path,
        content: draft,
        initiativeId,
        documentId: doc.id,
        version: version.trim(),
        note: note.trim(),
      });
      if (result.initiative) upsertInitiative(result.initiative);
      setFile({ status: "ready", content: draft.endsWith("\n") ? draft : `${draft}\n` });
      setDraft((d) => (d.endsWith("\n") ? d : `${d}\n`));
      notify("success", "Documento salvo no repositório.");
      setEditing(false);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível salvar o documento.");
    } finally {
      setSaving(false);
    }
  }

  // Ctrl/Cmd + S salva durante a edição.
  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const crumbs = [
    { label: "Iniciativas", href: "/iniciativas" },
    { label: initiativeId, href: backHref },
    { label: doc ? DOCUMENT_KIND_LABEL[doc.kind] : "Documento" },
  ];

  if (load.status === "loading") {
    return (
      <PageContainer>
        <TopBar crumbs={crumbs} />
        <Skeleton className="mt-8 h-10 w-2/3" />
        <Skeleton className="mt-6 h-96 w-full" />
      </PageContainer>
    );
  }

  if (!initiative || !doc) {
    return (
      <PageContainer>
        <TopBar crumbs={crumbs} />
        <EmptyState
          className="mt-10"
          icon={<FileWarning size={22} />}
          title="Documento não encontrado"
          description="Este documento não está associado à iniciativa. Ele pode ter sido removido ou o link está incorreto."
          action={<Link href={backHref} className={buttonClass("primary")}>Voltar para a iniciativa</Link>}
        />
      </PageContainer>
    );
  }

  if (doc.source === "externo") {
    return (
      <PageContainer>
        <TopBar crumbs={crumbs} />
        <EmptyState
          className="mt-10"
          title={doc.title}
          description="Este documento está hospedado fora do repositório."
          action={
            <a href={doc.url} target="_blank" rel="noopener noreferrer" className={buttonClass("primary")}>
              Abrir link externo
            </a>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <TopBar crumbs={crumbs} />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link href={backHref} className="inline-flex items-center gap-1.5 text-[14px] font-bold text-blue hover:underline">
            <ArrowLeft size={16} aria-hidden /> Voltar para {initiative.title}
          </Link>
          <p className="mt-3 text-[13px] font-bold uppercase tracking-wide text-subtle">
            {DOCUMENT_KIND_LABEL[doc.kind]} · {initiative.id}
          </p>
          <h1 className="text-[30px] font-black leading-tight text-navy">{doc.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
            <Badge tone={{ bg: "#EAF1FE", fg: "#1F55C4", dot: "" }} size="sm">
              {DOCUMENT_STATUS_LABEL[doc.status]}
            </Badge>
            {doc.version && <span className="font-semibold text-ink">Versão {doc.version}</span>}
            {doc.updatedAt && <span>· Atualizado em {formatDate(doc.updatedAt)}</span>}
            <code className="font-mono text-[11.5px] text-subtle">· {doc.path}</code>
          </div>
        </div>
        {!editing && file.status === "ready" && (
          <Button variant="outline" icon={<Pencil size={16} />} onClick={() => setEditing(true)}>
            Editar documento
          </Button>
        )}
      </div>

      {file.status === "loading" && <Skeleton className="mt-8 h-[60vh] w-full" />}
      {file.status === "error" && (
        <div className="mt-8">
          <ErrorBanner message={file.message} action={<Button size="sm" onClick={() => void loadFile(doc.path)}>Tentar novamente</Button>} />
        </div>
      )}
      {file.status === "missing" && !editing && (
        <EmptyState
          className="mt-8"
          icon={<FileWarning size={22} />}
          title="O arquivo deste documento não foi encontrado"
          description={
            <>
              O caminho <code className="font-mono text-[12px]">{doc.path}</code> não existe no repositório. Você pode criar o conteúdo agora ou corrigir o caminho na edição da iniciativa.
            </>
          }
          action={
            <Button variant="primary" icon={<SquarePen size={16} />} onClick={() => setEditing(true)}>
              Criar conteúdo
            </Button>
          }
        />
      )}

      {!editing && file.status === "ready" && (
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="min-w-0 rounded-3xl border border-line bg-surface px-6 py-8 shadow-[var(--shadow-card)] sm:px-10">
            <MarkdownView content={file.content} />
          </article>
          {toc.length > 0 && (
            <nav aria-label="Seções do documento" className="order-first lg:order-none">
              <div className="rounded-2xl border border-line bg-surface p-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto">
                <p className="mb-2 flex items-center gap-2 text-[13px] font-extrabold text-navy">
                  <ListTree size={16} aria-hidden /> Seções
                </p>
                <ol className="flex flex-col gap-0.5 text-[13px]">
                  {toc.map((t) => (
                    <li key={t.id}>
                      <a
                        href={`#${t.id}`}
                        className={cn("block rounded-lg px-2 py-1 text-muted hover:bg-[#f2f5fb] hover:text-ink", t.level === 3 && "pl-5 text-[12.5px]")}
                      >
                        {t.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            </nav>
          )}
        </div>
      )}

      {editing && (file.status === "ready" || file.status === "missing") && (
        <div className="mt-8 flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-line bg-surface p-4 sm:grid-cols-[160px_1fr]">
            <TextField label="Nova versão" value={version} onChange={(e) => setVersion(e.target.value)} hint={`Atual: ${doc.version || "—"}`} />
            <TextField label="Descrição da alteração" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: Inclusão da matriz de permissões" hint="Registrada no histórico de versões do documento." />
          </div>

          <div className="flex gap-2 xl:hidden" role="tablist" aria-label="Modo de edição">
            {(["write", "preview"] as const).map((pane) => (
              <button
                key={pane}
                role="tab"
                type="button"
                aria-selected={mobilePane === pane}
                onClick={() => setMobilePane(pane)}
                className={cn("rounded-xl px-4 py-2 text-[14px] font-bold", mobilePane === pane ? "bg-navy text-white" : "bg-surface text-muted")}
              >
                {pane === "write" ? "Escrever" : "Pré-visualizar"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <label className={cn("flex flex-col", mobilePane !== "write" && "hidden xl:flex")}>
              <span className="mb-1.5 text-[13px] font-bold text-navy">Markdown</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck
                className="h-[68vh] w-full resize-y rounded-2xl border border-line bg-surface p-5 font-mono text-[13.5px] leading-relaxed text-ink focus:border-violet focus:outline-none focus:ring-4 focus:ring-[#6045d8]/12"
                placeholder="# Título do documento"
                data-autofocus
              />
            </label>
            <div className={cn("flex flex-col", mobilePane !== "preview" && "hidden xl:flex")}>
              <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-bold text-navy">
                <Eye size={15} aria-hidden /> Pré-visualização
              </span>
              <div className="h-[68vh] overflow-y-auto rounded-2xl border border-line bg-surface px-6 py-6">
                {draft.trim() ? <MarkdownView content={draft} /> : <p className="text-sm italic text-subtle">Nada para pré-visualizar.</p>}
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
            <p className="mr-auto text-[13px] text-muted" aria-live="polite">
              {dirty ? "Alterações não salvas · Ctrl/⌘ + S para salvar" : "Sem alterações"}
            </p>
            <Button variant="ghost" onClick={cancelEdit} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" icon={<Save size={16} />} loading={saving} onClick={save} disabled={!dirty && file.status === "ready"}>
              Salvar documento
            </Button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
