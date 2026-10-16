import type { Initiative, Platform } from "@/lib/domain/types";

const strip = (c: string) => c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Normaliza sem alterar o comprimento (1 caractere → 1 caractere), para o destaque casar com o texto original. */
export const fold = (text: string) => Array.from(text, (c) => strip(c)[0] ?? c).join("");

export const queryTerms = (query: string) => fold(query).split(/\s+/).filter(Boolean);

/** Divide o texto em trechos, marcando os que casam com algum termo da busca. */
export function highlightParts(text: string, terms: string[]): Array<{ text: string; hit: boolean }> {
  if (!terms.length) return [{ text, hit: false }];
  const folded = fold(text);
  const hit = new Array<boolean>(text.length).fill(false);
  for (const t of terms) for (let i = folded.indexOf(t); i >= 0; i = folded.indexOf(t, i + 1)) hit.fill(true, i, i + t.length);
  const parts: Array<{ text: string; hit: boolean }> = [];
  for (let i = 0; i < text.length; i++) {
    const last = parts[parts.length - 1];
    if (last && last.hit === hit[i]) last.text += text[i];
    else parts.push({ text: text[i], hit: hit[i] });
  }
  return parts;
}

/** Trecho do texto em torno da primeira ocorrência (para mostrar onde a busca casou). */
export function snippet(text: string, terms: string[], radius = 60): string {
  const folded = fold(text);
  const at = terms.map((t) => folded.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - radius);
  const end = Math.min(text.length, at + radius + 20);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export type SearchResult =
  | { kind: "initiative"; id: string; initiative: Initiative; field: string; excerpt: string; score: number }
  | { kind: "document"; id: string; initiative: Initiative; docId: string; title: string; score: number }
  | { kind: "prototype"; id: string; initiative: Initiative; protoId: string; title: string; score: number };

/** Campos pesquisáveis de uma iniciativa, do mais ao menos relevante. */
function fieldsOf(i: Initiative, platforms: Platform[]): Array<[label: string, text: string, weight: number]> {
  const platformNames = i.platformIds.map((id) => platforms.find((p) => p.id === id)?.name ?? "").join(" ");
  return [
    ["Nome", i.title, 10],
    ["Identificador", i.id, 9],
    ["Resumo", i.summary, 6],
    ["Tags", i.tags.join(" "), 6],
    ["Categoria", i.category, 5],
    ["Plataformas", platformNames, 5],
    ["Problema", i.problem, 3],
    ["Motivador", i.motivator, 3],
    ["Objetivos", i.objectives.join(" "), 3],
    ["Entregas", i.deliverables.join(" "), 3],
    ["Hipótese", i.hypothesis, 2],
    ["Resultado esperado", i.expectedOutcome, 2],
    ["Público", i.audience, 2],
  ];
}

export function searchInitiatives(initiatives: Initiative[], platforms: Platform[], query: string): SearchResult[] {
  const terms = queryTerms(query);
  const out: SearchResult[] = [];
  for (const i of initiatives) {
    const fields = fieldsOf(i, platforms).map(([label, text, w]) => ({ label, text, folded: fold(text), w }));
    const all = fields.map((f) => f.folded).join(" ");
    if (terms.length && !terms.every((t) => all.includes(t))) {
      // Ainda pode haver documentos/protótipos casando.
    } else {
      const score = fields.reduce((acc, f) => acc + terms.filter((t) => f.folded.includes(t)).length * f.w, 0);
      const first = fields.find((f) => terms.some((t) => f.folded.includes(t))) ?? fields[2];
      out.push({ kind: "initiative", id: i.id, initiative: i, field: first.label, excerpt: snippet(first.text || i.summary, terms), score });
    }
    for (const d of i.documents) {
      if (terms.length && terms.every((t) => fold(`${d.title} ${d.kind}`).includes(t))) out.push({ kind: "document", id: `${i.id}:${d.id}`, initiative: i, docId: d.id, title: d.title, score: 4 });
    }
    for (const p of i.prototypes) {
      if (terms.length && terms.every((t) => fold(`${p.name} ${p.description}`).includes(t))) out.push({ kind: "prototype", id: `${i.id}:${p.id}`, initiative: i, protoId: p.id, title: p.name, score: 4 });
    }
  }
  return out.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
