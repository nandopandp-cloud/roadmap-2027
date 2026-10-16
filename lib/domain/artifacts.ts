import type { DocumentRef, PrototypeRef } from "@/lib/domain/types";

/** URL interna (isolada) para abrir um protótipo armazenado no repositório. */
export function prototypeHref(proto: PrototypeRef): string {
  if (proto.source === "externo") return proto.url;
  return `/prototipos/${proto.path.split("/").slice(1).map(encodeURIComponent).join("/")}`;
}

export function documentReaderHref(initiativeId: string, doc: DocumentRef): string {
  return `/iniciativas/${initiativeId}/documentos/${encodeURIComponent(doc.id)}`;
}

export function prototypeViewerHref(initiativeId: string, proto: PrototypeRef): string {
  return `/iniciativas/${initiativeId}/prototipos/${encodeURIComponent(proto.id)}`;
}

/** PRD principal: o primeiro documento do tipo PRD que não esteja obsoleto. */
export function primaryPrd(docs: DocumentRef[]): DocumentRef | undefined {
  return docs.find((d) => d.kind === "prd" && d.status !== "obsoleto") ?? docs.find((d) => d.kind === "prd");
}

export function primaryPrototype(protos: PrototypeRef[]): PrototypeRef | undefined {
  return protos.find((p) => p.status !== "obsoleto") ?? protos[0];
}
