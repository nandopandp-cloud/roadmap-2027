/**
 * Justificativa do esforço: arquivos e links anexados por frente (Design ou Engenharia),
 * base para entender a quantidade de semanas estimada. Regras compartilhadas entre a
 * interface e o servidor.
 */

/** Tamanho máximo de cada arquivo. */
export const ATTACHMENT_MAX_BYTES = 10 * 1024 * 1024;
/**
 * Arquivos sobem em partes: as funções da Vercel aceitam corpos de até ~4,5 MB por
 * requisição. O servidor junta as partes ao concluir o envio.
 */
export const ATTACHMENT_CHUNK_BYTES = 3 * 1024 * 1024;
export const ATTACHMENT_MAX_PARTS = Math.ceil(ATTACHMENT_MAX_BYTES / ATTACHMENT_CHUNK_BYTES);
/** Limite de anexos por frente de uma iniciativa. */
export const ATTACHMENTS_PER_TRACK = 20;

export type AttachmentKind = "image" | "pdf" | "doc" | "sheet" | "slides" | "figma" | "link" | "other";

/**
 * Extensões aceitas e o tipo servido no download. Sem SVG/HTML: arquivos enviados não
 * podem executar código ao serem abertos.
 */
export const ATTACHMENT_TYPES: Record<string, { contentType: string; kind: AttachmentKind }> = {
  png: { contentType: "image/png", kind: "image" },
  jpg: { contentType: "image/jpeg", kind: "image" },
  jpeg: { contentType: "image/jpeg", kind: "image" },
  gif: { contentType: "image/gif", kind: "image" },
  webp: { contentType: "image/webp", kind: "image" },
  pdf: { contentType: "application/pdf", kind: "pdf" },
  doc: { contentType: "application/msword", kind: "doc" },
  docx: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", kind: "doc" },
  odt: { contentType: "application/vnd.oasis.opendocument.text", kind: "doc" },
  rtf: { contentType: "application/rtf", kind: "doc" },
  txt: { contentType: "text/plain; charset=utf-8", kind: "doc" },
  md: { contentType: "text/markdown; charset=utf-8", kind: "doc" },
  xls: { contentType: "application/vnd.ms-excel", kind: "sheet" },
  xlsx: { contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", kind: "sheet" },
  csv: { contentType: "text/csv; charset=utf-8", kind: "sheet" },
  ods: { contentType: "application/vnd.oasis.opendocument.spreadsheet", kind: "sheet" },
  ppt: { contentType: "application/vnd.ms-powerpoint", kind: "slides" },
  pptx: { contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", kind: "slides" },
  odp: { contentType: "application/vnd.oasis.opendocument.presentation", kind: "slides" },
  key: { contentType: "application/vnd.apple.keynote", kind: "slides" },
  fig: { contentType: "application/octet-stream", kind: "figma" },
};

/** Valor do `accept` do seletor de arquivos. */
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");

export const extensionOf = (name: string) => (name.includes(".") ? (name.split(".").pop() ?? "").toLowerCase() : "");

export const attachmentTypeOf = (name: string) => ATTACHMENT_TYPES[extensionOf(name)] ?? null;

/** Imagens e PDFs abrem no navegador; os demais são baixados. */
export const opensInline = (name: string) => {
  const kind = attachmentTypeOf(name)?.kind;
  return kind === "image" || kind === "pdf";
};

export function linkKind(url: string): AttachmentKind {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "figma.com" || host.endsWith(".figma.com") ? "figma" : "link";
  } catch {
    return "link";
  }
}

export function attachmentKind(a: { kind: "file" | "link"; name: string; url?: string }): AttachmentKind {
  if (a.kind === "link") return linkKind(a.url ?? "");
  return attachmentTypeOf(a.name)?.kind ?? "other";
}

/** Nome exibido de um link: domínio + caminho, sem protocolo. */
export function linkName(url: string): string {
  try {
    const u = new URL(url);
    const path = decodeURIComponent(u.pathname).replace(/\/+$/, "");
    return `${u.hostname.replace(/^www\./, "")}${path}`.slice(0, 160);
  } catch {
    return url.slice(0, 160);
  }
}

export const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

export const formatBytes = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;

/** Endereço de download/visualização de um arquivo anexado. */
export const attachmentHref = (a: { id: string; kind: "file" | "link"; url?: string }) => (a.kind === "link" ? (a.url ?? "#") : `/api/esforco/anexos/${a.id}`);
