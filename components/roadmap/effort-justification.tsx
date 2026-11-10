"use client";

import { ExternalLink, File, FileImage, FileSpreadsheet, FileText, Link2, Loader2, Paperclip, Presentation, Upload, X } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/client/api";
import { cn } from "@/lib/client/cn";
import { useRoadmap } from "@/lib/client/store";
import { EFFORT_TONE } from "@/lib/client/tones";
import { EFFORT_TRACK_LABEL, type EffortTrack } from "@/lib/domain/effort";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENTS_PER_TRACK,
  attachmentHref,
  attachmentKind,
  formatBytes,
  hostOf,
  opensInline,
  type AttachmentKind,
} from "@/lib/domain/effort-attachments";
import type { EffortAttachment, Initiative } from "@/lib/domain/types";
import { isHttpUrl } from "@/lib/validation/paths";

const KIND_STYLE: Record<AttachmentKind, { label: string; bg: string; fg: string }> = {
  image: { label: "Imagem", bg: "#E3F5FB", fg: "#0B6382" },
  pdf: { label: "PDF", bg: "#FDECEC", fg: "#A42828" },
  doc: { label: "Documento", bg: "#EAF1FE", fg: "#1F55C4" },
  sheet: { label: "Planilha", bg: "#E8F6E9", fg: "#24692C" },
  slides: { label: "Apresentação", bg: "#FFF1E6", fg: "#934400" },
  figma: { label: "Figma", bg: "#F1ECFB", fg: "#5938A6" },
  link: { label: "Link", bg: "#EEF0F4", fg: "#3E4757" },
  other: { label: "Arquivo", bg: "#EEF0F4", fg: "#3E4757" },
};

function FigmaGlyph({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" aria-hidden>
      <path d="M8 2h4v6.67H8a3.33 3.33 0 0 1 0-6.67Z" />
      <path d="M12 2h4a3.33 3.33 0 0 1 0 6.67h-4Z" />
      <path d="M8 8.67h4v6.66H8a3.33 3.33 0 0 1 0-6.66Z" />
      <circle cx="15.33" cy="12" r="3.33" />
      <path d="M8 15.33h4V18.7A3.33 3.33 0 1 1 8 15.33Z" />
    </svg>
  );
}

function KindIcon({ kind, size = 16 }: { kind: AttachmentKind; size?: number }) {
  if (kind === "figma") return <FigmaGlyph size={size} />;
  const Icon = { image: FileImage, pdf: FileText, doc: FileText, sheet: FileSpreadsheet, slides: Presentation, link: Link2, other: File }[kind];
  return <Icon size={size} aria-hidden />;
}

/** Miniatura (imagens) ou ícone do tipo do anexo. */
function AttachmentThumb({ item, size }: { item: EffortAttachment; size: "sm" | "md" }) {
  const kind = attachmentKind(item);
  const style = KIND_STYLE[kind];
  const box = size === "md" ? "h-10 w-10 rounded-lg" : "h-5 w-5 rounded";
  if (kind === "image" && item.kind === "file") {
    // eslint-disable-next-line @next/next/no-img-element -- arquivo enviado, servido por /api/esforco/anexos
    return <img src={attachmentHref(item)} alt="" loading="lazy" className={cn(box, "shrink-0 border border-line object-cover")} />;
  }
  return (
    <span className={cn(box, "flex shrink-0 items-center justify-center")} style={{ background: style.bg, color: style.fg }}>
      <KindIcon kind={kind} size={size === "md" ? 18 : 12} />
    </span>
  );
}

/** Abre imagens, PDFs e links numa nova aba; os demais arquivos são baixados. */
function linkProps(item: EffortAttachment) {
  const newTab = item.kind === "link" || opensInline(item.name);
  return { href: attachmentHref(item), ...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}) };
}

function AttachmentRow({ item, onRemove }: { item: EffortAttachment; onRemove?: () => void }) {
  const kind = attachmentKind(item);
  const meta = [KIND_STYLE[kind].label, item.kind === "link" ? hostOf(item.url) : formatBytes(item.size), item.addedBy].filter(Boolean).join(" · ");
  return (
    <li className="group flex items-center gap-1 rounded-xl border border-line bg-surface p-1.5 hover:border-line-strong">
      <a {...linkProps(item)} title={`Abrir ${item.name}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-0.5 text-left">
        <AttachmentThumb item={item} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold text-ink group-hover:text-violet">{item.name}</span>
          <span className="block truncate text-[12px] text-muted">{meta}</span>
        </span>
        <ExternalLink size={14} aria-hidden className="mr-1 shrink-0 text-subtle opacity-0 transition-opacity group-hover:opacity-100" />
      </a>
      {onRemove && (
        <button
          type="button"
          aria-label={`Remover ${item.name}`}
          onClick={onRemove}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#fdecec] hover:text-[#a42828]"
        >
          <X size={15} />
        </button>
      )}
    </li>
  );
}

const ATTACH_HINT: Record<EffortTrack, string> = {
  design: "Telas, fluxos, protótipos no Figma, benchmarks.",
  engineering: "Diagramas de arquitetura, especificações técnicas, planilhas de estimativa.",
};

type Pending = { key: string; name: string; progress: number };

/**
 * Justificativa de uma frente de esforço: documentos e links que embasam as semanas
 * estimadas. Cada anexo é salvo assim que enviado (independente do botão Salvar).
 */
export function EffortJustification({ initiative: initial, track, readOnly = false }: { initiative: Initiative; track: EffortTrack; readOnly?: boolean }) {
  const { data, uploadEffortFile, addEffortLink, removeEffortAttachment } = useRoadmap();
  const initiative = data.initiatives.find((i) => i.id === initial.id) ?? initial;
  const items = initiative.effortEvidence[track];
  const label = EFFORT_TRACK_LABEL[track];
  const tone = EFFORT_TONE[track];
  const notify = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [dragging, setDragging] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const full = items.length + pending.length >= ATTACHMENTS_PER_TRACK;

  async function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (inputRef.current) inputRef.current.value = "";
    for (const file of files) {
      const key = crypto.randomUUID();
      setPending((p) => [...p, { key, name: file.name, progress: 0 }]);
      try {
        await uploadEffortFile(initiative.id, track, file, (progress) =>
          setPending((p) => p.map((x) => (x.key === key ? { ...x, progress } : x))),
        );
        notify("success", `"${file.name}" anexado à justificativa de ${label}.`);
      } catch (error) {
        notify("error", error instanceof ApiError ? error.message : `Não foi possível enviar "${file.name}".`);
      } finally {
        setPending((p) => p.filter((x) => x.key !== key));
      }
    }
  }

  async function saveLink() {
    const url = link.trim();
    if (!isHttpUrl(url)) {
      notify("error", "Informe um link começando com https://.");
      return;
    }
    setSavingLink(true);
    try {
      await addEffortLink(initiative.id, track, url);
      notify("success", `Link anexado à justificativa de ${label}.`);
      setLink("");
      setLinkOpen(false);
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível anexar o link.");
    } finally {
      setSavingLink(false);
    }
  }

  async function remove(item: EffortAttachment) {
    const ok = await confirm({
      title: "Remover anexo?",
      message: `"${item.name}" sai da justificativa de ${label}. A remoção fica registrada no histórico.`,
      confirmLabel: "Remover",
      tone: "danger",
    });
    if (!ok) return;
    try {
      await removeEffortAttachment(initiative.id, item.id);
      notify("success", "Anexo removido.");
    } catch (error) {
      notify("error", error instanceof ApiError ? error.message : "Não foi possível remover o anexo.");
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!full) void addFiles(e.dataTransfer.files);
  };

  return (
    <section aria-label={`Justificativa de ${label}`} className="-mx-4 -mb-4 mt-1 flex-1 border-t border-line bg-[#fbfcff] px-4 pb-4 pt-3.5">
      <div className="mb-1.5 flex items-center gap-2">
        <Paperclip size={15} style={{ color: tone.solid }} aria-hidden />
        <h3 className="text-[14px] font-black text-navy">Justificativa</h3>
        {items.length > 0 && (
          <span className="rounded-full px-2 py-0.5 text-[11.5px] font-extrabold" style={{ background: tone.soft, color: tone.fg }}>
            {items.length} {items.length === 1 ? "anexo" : "anexos"}
          </span>
        )}
      </div>
      <p className="text-[12.5px] leading-relaxed text-muted">
        {readOnly
          ? "Documentos que embasam a quantidade de semanas."
          : "Anexe os documentos que embasam a quantidade de semanas. Cada anexo é salvo assim que enviado e fica visível para todos que consultam o roadmap."}
      </p>

      {(items.length > 0 || pending.length > 0) && (
        <ul className="mt-3 flex flex-col gap-2">
          {items.map((item) => (
            <AttachmentRow key={item.id} item={item} onRemove={readOnly ? undefined : () => void remove(item)} />
          ))}
          {pending.map((p) => (
            <li key={p.key} className="flex items-center gap-3 rounded-xl border border-line bg-surface p-2" aria-live="polite">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: tone.soft, color: tone.fg }}>
                <Loader2 size={18} className="animate-spin" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-bold text-ink">{p.name}</span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[#edf1f8]" role="progressbar" aria-label={`Enviando ${p.name}`} aria-valuenow={Math.round(p.progress * 100)}>
                  <span className="block h-full rounded-full transition-[width]" style={{ width: `${Math.max(6, p.progress * 100)}%`, background: tone.solid }} />
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {readOnly && items.length === 0 && <p className="mt-2 text-[13px] italic text-subtle">Nenhum anexo.</p>}

      {!readOnly && (
        <>
          <input ref={inputRef} type="file" multiple hidden accept={ATTACHMENT_ACCEPT} onChange={(e) => void addFiles(e.target.files)} />
          <button
            type="button"
            disabled={full}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              if (!full) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "mt-3 flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-3 py-4 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-60",
              dragging ? "bg-surface" : "bg-surface/60 hover:bg-surface",
            )}
            style={{ borderColor: dragging ? tone.solid : tone.line }}
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: tone.soft, color: tone.fg }}>
              <Upload size={17} aria-hidden />
            </span>
            <span className="text-[13.5px] font-bold text-ink">
              {full ? (
                `Limite de ${ATTACHMENTS_PER_TRACK} anexos atingido`
              ) : dragging ? (
                "Solte para anexar"
              ) : (
                <>
                  Arraste arquivos ou <span style={{ color: tone.fg }}>clique para enviar</span>
                </>
              )}
            </span>
            <span className="text-[12px] text-muted">Imagem, PDF, Word, planilha, apresentação ou Figma · até 10 MB cada</span>
            <span className="text-[12px] text-subtle">{ATTACH_HINT[track]}</span>
          </button>

          {linkOpen ? (
            <form
              className="mt-2 flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void saveLink();
              }}
            >
              <label className="relative flex h-10 min-w-0 flex-1 items-center rounded-xl border border-line bg-surface focus-within:border-violet focus-within:ring-4 focus-within:ring-[#6045d8]/12">
                <Link2 size={15} className="absolute left-3 text-muted" aria-hidden />
                <span className="sr-only">Endereço do link</span>
                <input
                  autoFocus
                  type="url"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Escape") return;
                    e.stopPropagation();
                    setLinkOpen(false);
                  }}
                  placeholder="https://www.figma.com/design/…"
                  className="h-full w-full rounded-xl bg-transparent pl-9 pr-3 text-[13.5px] text-ink outline-none placeholder:text-subtle"
                />
              </label>
              <Button type="submit" size="sm" variant="primary" loading={savingLink} disabled={!link.trim()}>
                Adicionar
              </Button>
              <button
                type="button"
                aria-label="Cancelar link"
                onClick={() => setLinkOpen(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-[#f2f5fb] hover:text-ink"
              >
                <X size={16} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              disabled={full}
              onClick={() => setLinkOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-bold hover:underline disabled:opacity-50 disabled:hover:no-underline"
              style={{ color: tone.fg }}
            >
              <Link2 size={14} aria-hidden /> Adicionar link (Figma, Google Docs, Miro…)
            </button>
          )}
        </>
      )}
    </section>
  );
}

/** Resumo para o drawer: anexos de uma frente como links compactos. */
export function JustificationChips({ items }: { items: EffortAttachment[] }) {
  if (!items.length) return <span className="mt-1.5 block text-[12.5px] italic text-subtle">Sem documentos de justificativa.</span>;
  return (
    <span className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <a
          key={item.id}
          {...linkProps(item)}
          title={`Abrir ${item.name}`}
          className="inline-flex max-w-[240px] items-center gap-1.5 rounded-lg border border-line bg-surface py-1 pl-1 pr-2 text-[12px] font-bold text-ink hover:border-violet hover:text-violet"
        >
          <AttachmentThumb item={item} size="sm" />
          <span className="truncate">{item.name}</span>
        </a>
      ))}
    </span>
  );
}
