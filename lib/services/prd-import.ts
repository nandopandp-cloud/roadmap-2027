/**
 * Extração de uma iniciativa a partir do texto de um PRD (Markdown ou texto com seções numeradas).
 *
 * A extração é determinística: cada campo recebe trechos copiados do próprio PRD, localizados pelo
 * título das seções ("Visão geral", "Problema principal", "Métricas de sucesso"…) e pelos campos do
 * cabeçalho ("**Prioridade:** Alta", tabela "Campo | Valor"). Nada é resumido por inferência nem
 * inventado: o que não for encontrado fica vazio e é informado no relatório.
 */
import { defaultPhases } from "@/lib/domain/progress";
import type { Initiative, InitiativeInput, InitiativeStatus, Metric, Platform, Priority, Quarter } from "@/lib/domain/types";

export interface PrdImportReport {
  /** Campos preenchidos e a seção do PRD de onde vieram. */
  found: Array<{ field: keyof InitiativeInput; source: string }>;
  /** Avisos para revisão (status não reconhecido, plataforma desconhecida, nome repetido…). */
  warnings: string[];
}

export interface PrdImportResult {
  input: InitiativeInput;
  report: PrdImportReport;
}

/* ---------- Leitura da estrutura ---------- */

interface Section {
  level: number;
  /** Título como escrito (sem marcação Markdown). */
  title: string;
  /** Título normalizado, sem numeração ("2.1.", "RF01.") — usado para localizar seções. */
  key: string;
  /** Código do requisito/regra, quando houver (ex.: "rf01"). */
  code: string;
  /** Linhas próprias da seção (até o próximo título de qualquer nível). */
  lines: string[];
  index: number;
}

type Block = { kind: "p" | "li"; text: string } | { kind: "table"; header: string[]; rows: string[][] };

const fold = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Remove marcação inline (negrito, código, links) mantendo o texto. */
const inline = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/(\*\*|__)(.+?)\1/g, "$2")
    .replace(/(^|[^*\w])[*_]([^*_\n]+)[*_](?=[^*\w]|$)/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

const CODE = /^([A-Z]{1,4}-?\d{1,3})\.?\s+/;
const NUMBER = /^(\d+(?:\.\d+)*)\.?\s+/;

function splitTitle(raw: string): { title: string; key: string; code: string } {
  let title = inline(raw).replace(/^[#\s]+|[#\s:]+$/g, "");
  let code = "";
  const num = title.match(NUMBER);
  if (num) title = title.slice(num[0].length);
  const c = title.match(CODE);
  if (c) {
    code = fold(c[1]).replace(/[\s-]/g, "");
    title = title.slice(c[0].length);
  }
  title = title.replace(/^[|:—–-]\s*/, "").trim();
  return { title, key: fold(title).replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim(), code };
}

/** Linha que parece título em texto sem Markdown (ex.: "2.1. Cenário atual", "RF01. Acesso"). */
function plainHeading(line: string): number | null {
  const t = line.trim();
  if (t.length > 90 || /[.;:,]$/.test(t)) return null;
  const num = t.match(/^(\d+(?:\.\d+)*)\.?\s+\p{Lu}/u);
  if (num) return num[1].split(".").length;
  if (/^[A-Z]{2,4}\s?-?\d{1,3}\.?\s+\p{Lu}/u.test(t)) return 3;
  return null;
}

function parseSections(text: string): { sections: Section[]; preamble: string[] } {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const markdown = lines.some((l) => /^#{1,6}\s+\S/.test(l));
  const sections: Section[] = [];
  const preamble: string[] = [];
  let fence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fence = !fence;
    const md = !fence && line.match(/^(#{1,6})\s+(.+)$/);
    const level = md ? md[1].length : !fence && !markdown ? plainHeading(line) : null;
    if (level) {
      const { title, key, code } = splitTitle(md ? md[2] : line);
      sections.push({ level, title, key, code, lines: [], index: sections.length });
    } else if (sections.length) {
      sections[sections.length - 1].lines.push(line);
    } else {
      preamble.push(line);
    }
  }
  return { sections, preamble };
}

function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  let table: string[][] = [];
  const flushPara = () => {
    if (para.length) blocks.push({ kind: "p", text: inline(para.join(" ")) });
    para = [];
  };
  const flushTable = () => {
    const rows = table.filter((r) => !r.every((c) => /^:?-{2,}:?$/.test(c) || c === ""));
    if (rows.length) blocks.push({ kind: "table", header: rows[0], rows: rows.slice(1) });
    table = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^\|.*\|$/.test(line)) {
      flushPara();
      table.push(line.slice(1, -1).split("|").map((c) => inline(c)));
      continue;
    }
    flushTable();
    if (!line || /^(-{3,}|\*{3,}|_{3,})$/.test(line) || line.startsWith(">") && !inline(line.slice(1))) {
      flushPara();
      continue;
    }
    const item = line.match(/^(?:[-*+•]|\d+[.)])\s+(.+)$/);
    if (item) {
      flushPara();
      blocks.push({ kind: "li", text: inline(item[1]) });
    } else if (/^\s{2,}\S/.test(raw) && blocks.at(-1)?.kind === "li" && !para.length) {
      const last = blocks[blocks.length - 1] as { kind: "li"; text: string };
      last.text = `${last.text} ${inline(line)}`;
    } else {
      para.push(line.replace(/^>\s?/, ""));
    }
  }
  flushPara();
  flushTable();
  return blocks.filter((b) => b.kind === "table" || b.text);
}

/* ---------- Utilidades de texto ---------- */

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,;:–—-]+$/, "")}…`;
}

/** Junta blocos em texto corrido, parando antes de ultrapassar o limite (sem cortar parágrafos ao meio, se possível). */
function joinBlocks(blocks: Block[], max: number): string {
  const parts: string[] = [];
  let size = 0;
  for (const b of blocks) {
    const piece = b.kind === "table" ? tableText(b) : b.kind === "li" ? `• ${b.text}` : b.text;
    const sep = parts.length ? (b.kind === "li" && parts.at(-1)?.startsWith("•") ? 1 : 2) : 0;
    if (size + sep + piece.length > max) {
      if (!parts.length) parts.push(clip(piece, max));
      break;
    }
    parts.push(piece);
    size += sep + piece.length;
  }
  return parts.reduce((acc, p, i) => (i === 0 ? p : `${acc}${p.startsWith("•") && parts[i - 1].startsWith("•") ? "\n" : "\n\n"}${p}`), "");
}

const tableText = (t: Extract<Block, { kind: "table" }>) => t.rows.map((r) => `• ${r.filter(Boolean).join(" — ")}`).join("\n");

/** Primeiras frases de um texto, até o limite. */
function firstSentences(text: string, max: number): string {
  const sentences = text.split(/(?<=[.!?])\s+(?=[\p{Lu}"“(])/u);
  let out = "";
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (next.length > max) break;
    out = next;
    if (out.length > max * 0.45) break;
  }
  return out || clip(sentences[0] ?? text, max);
}

const itemText = (b: Block) => (b.kind === "table" ? "" : b.text);

/** Itens de uma seção: tópicos de lista; sem lista, os parágrafos; tabelas viram uma linha por registro. */
function itemsOf(blocks: Block[], max = 1000): string[] {
  const lis = blocks.filter((b) => b.kind === "li");
  const tables = blocks.filter((b): b is Extract<Block, { kind: "table" }> => b.kind === "table");
  let items: string[];
  if (lis.length) items = lis.map(itemText);
  else if (tables.length) items = tables.flatMap((t) => t.rows.map((r) => r.filter(Boolean).join(" — ")));
  else items = blocks.map(itemText);
  return dedupe(items.filter(Boolean).map((s) => clip(s, max)));
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((s) => {
    const k = fold(s);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/* ---------- Extração ---------- */

const STATUS_RULES: Array<[RegExp, InitiativeStatus]> = [
  [/cancelad/, "cancelada"],
  [/pausad|suspens/, "pausada"],
  [/conclu|lancad|entregue|finalizad/, "concluida"],
  [/homolog|piloto|em validacao/, "validacao"],
  [/em andamento|em desenvolvimento|em implementacao|em execucao/, "andamento"],
  [/planejad|priorizad/, "planejada"],
  [/discovery|descoberta|investigacao/, "discovery"],
  [/definicao|refinamento|especificacao|elaboracao|rascunho|proposta/, "definicao"],
  [/ideia/, "ideia"],
];

export function extractFromPrd(content: string, ctx: { platforms: Platform[]; initiatives: Initiative[] }): PrdImportResult {
  const { sections, preamble } = parseSections(content);
  const found: PrdImportReport["found"] = [];
  const warnings: string[] = [];
  const input: InitiativeInput = {
    title: "", summary: "", category: "", tags: [], illustration: null, customImage: null,
    problem: "", currentContext: "", audience: "", userPain: "", motivator: "", evidence: [], hypothesis: "", expectedOutcome: "", objectives: [], deliverables: [],
    quarter: null, priority: null, status: "definicao", planningValidated: false, owner: "", milestones: [], phases: defaultPhases(),
    dependsOn: [], relatedInitiativeIds: [], risks: [], pendingDecisions: [],
    platformIds: [], platformNotes: {}, journeys: [], userProfiles: [], areas: [], technicalDependencies: [], operationalImpacts: [],
    documents: [], prototypes: [], metrics: [],
  };

  /** Registra um campo preenchido, se o valor não estiver vazio. */
  function put<K extends keyof InitiativeInput>(field: K, value: InitiativeInput[K], source: string) {
    const empty = value === null || value === "" || (Array.isArray(value) && value.length === 0);
    if (empty) return;
    input[field] = value;
    found.push({ field, source });
  }

  /* Seções: corpo próprio e corpo com subseções. */
  const own = (s: Section) => parseBlocks(s.lines);
  const children = (s: Section) => {
    const out: Section[] = [];
    for (let i = s.index + 1; i < sections.length && sections[i].level > s.level; i++) out.push(sections[i]);
    return out;
  };
  const directChildren = (s: Section) => {
    const all = children(s);
    const min = Math.min(...all.map((c) => c.level));
    return all.filter((c) => c.level === min);
  };
  const deep = (s: Section, skip?: RegExp) => {
    const blocks = [...own(s)];
    let skipping = 0;
    for (const c of children(s)) {
      if (skipping && c.level > skipping) continue;
      skipping = skip?.test(c.key) ? c.level : 0;
      if (!skipping) blocks.push(...own(c));
    }
    return blocks;
  };
  /** Primeira seção cujo título casa com um dos padrões (na ordem de preferência dos padrões). */
  const find = (...patterns: RegExp[]) => {
    for (const p of patterns) {
      const s = sections.find((x) => p.test(x.key));
      if (s) return s;
    }
    return undefined;
  };
  const label = (s: Section) => `seção “${s.title}”`;

  /* Cabeçalho: "**Campo:** valor", "Campo: valor" ou tabela "Campo | Valor" antes da primeira seção. */
  const meta = new Map<string, string>();
  const metaLines = [...preamble, ...(sections[0]?.level === 1 ? sections[0].lines : [])];
  for (const b of parseBlocks(metaLines)) {
    if (b.kind === "table") {
      for (const row of [b.header, ...b.rows]) if (row.length >= 2 && row[0] && row[1]) meta.set(fold(row[0]), row[1]);
    }
  }
  for (const raw of metaLines) {
    const m = raw.trim().replace(/^[-*]\s+/, "").match(/^\*{0,2}([^*:|]{2,60}?)\*{0,2}\s*:\s*\*{0,2}\s*(.+)$/);
    if (m) meta.set(fold(inline(m[1])), inline(m[2]).replace(/\s{2,}/g, " "));
  }
  const metaGet = (pattern: RegExp): [string, string] | undefined => {
    for (const [k, v] of meta) if (pattern.test(k) && v) return [k, v];
    return undefined;
  };
  const metaSource = "cabeçalho do PRD";

  /* 1. Identificação */
  const h1 = sections.find((s) => s.level === 1);
  const metaTitle = metaGet(/^(nome da iniciativa|iniciativa|funcionalidade|titulo|nome)$/);
  if (metaTitle) put("title", clip(metaTitle[1], 160), metaSource);
  else if (h1) {
    const t = h1.title.replace(/^(prd|documento de requisitos( de produto)?)\s*([|:—–-]\s*)?/i, "").replace(/\s*[|—–-]\s*prd$/i, "").trim();
    if (t && !/^prd$/i.test(t)) put("title", clip(t, 160), "título do documento");
  } else {
    // Texto sem Markdown: a primeira linha curta costuma ser o título.
    const first = preamble.map((l) => inline(l)).find(Boolean);
    const t = first?.replace(/^(prd|documento de requisitos( de produto)?)\s*([|:—–-]\s*)?/i, "").trim();
    if (t && t.length <= 120 && !/:\s/.test(t)) put("title", clip(t, 160), "primeira linha do PRD");
  }

  const overview = find(/^(visao geral|resumo executivo|sumario executivo|resumo|overview|introducao|descricao)/, /\bvisao (geral|do produto)\b/);
  const metaSummary = metaGet(/^(resumo|descricao( curta)?)$/);
  if (metaSummary) put("summary", firstSentences(metaSummary[1], 400), metaSource);
  else if (overview) {
    const p = own(overview).find((b) => b.kind === "p") ?? deep(overview).find((b) => b.kind === "p");
    if (p && p.kind === "p") put("summary", firstSentences(p.text, 400), label(overview));
  }
  if (!input.summary) {
    // Sem seção de visão geral: primeiro parágrafo do documento.
    const s = sections.find((x) => x !== h1 && own(x).some((b) => b.kind === "p"));
    const p = s && own(s).find((b) => b.kind === "p");
    if (s && p && p.kind === "p") put("summary", firstSentences(p.text, 400), label(s));
  }
  const category = metaGet(/^(categoria|tema|eixo)$/);
  if (category) put("category", clip(category[1], 80), metaSource);
  const tags = metaGet(/^(tags|palavras chave|palavras-chave)$/);
  if (tags) put("tags", dedupe(tags[1].split(/[,;]/).map((t) => clip(t.trim(), 40)).filter(Boolean)).slice(0, 20), metaSource);

  /* 2. Problema e motivação */
  const problemSec = find(/^(problema principal|problema central|problema a ser resolvido|definicao do problema|problema)$/, /^problemas?\b/, /\bproblema\b/);
  const painSec = find(/^(dores?|dor do usuario|dores do usuario|dores dos usuarios|principais dores)\b/);
  if (problemSec) {
    const blocks = problemSec.key.startsWith("contexto") && children(problemSec).length ? own(problemSec) : deep(problemSec, /^(cenario|contexto|oportunidade)/);
    // Parágrafos "Para os professores, …" descrevem a dor de cada público.
    const isPain = (b: Block) => b.kind === "p" && /^para (o|a|os|as) /i.test(b.text);
    const problemBlocks = painSec ? blocks : blocks.filter((b) => !isPain(b));
    put("problem", joinBlocks(problemBlocks.length ? problemBlocks : blocks, 4000), label(problemSec));
    if (!painSec) put("userPain", joinBlocks(blocks.filter(isPain), 4000), label(problemSec));
  }
  if (painSec) put("userPain", joinBlocks(deep(painSec), 4000), label(painSec));

  const contextSec = find(/^(cenario atual|contexto atual|situacao atual|como funciona hoje|contexto)$/);
  if (contextSec && contextSec !== problemSec) put("currentContext", joinBlocks(deep(contextSec), 4000), label(contextSec));

  const audienceMeta = metaGet(/^(publicos? principais|publicos? alvo|publico prioritario|publicos?|usuarios principais)$/);
  const audienceSec = find(/^(publico alvo|publicos? e perfis|perfis de usuario|personas|publicos?|usuarios)\b/);
  if (audienceMeta) put("audience", clip(audienceMeta[1], 1000), metaSource);
  else if (audienceSec) {
    const subs = directChildren(audienceSec).map((c) => c.title);
    put("audience", clip(subs.length ? subs.join(", ") : joinBlocks(deep(audienceSec), 1000), 1000), label(audienceSec));
  }
  if (audienceSec) {
    const subs = directChildren(audienceSec).map((c) => clip(c.title, 1000));
    put("userProfiles", subs.length ? subs : itemsOf(own(audienceSec).filter((b) => b.kind === "li")).map((s) => clip(s.split(/:\s/)[0], 1000)), label(audienceSec));
  }

  const motivatorSec = find(/^(oportunidade|motivacao|motivador|justificativa|por que agora|por que fazer|racional)\b/, /^(objetivos? de negocio|valor para o negocio)\b/);
  // Todas as seções de objetivos ("Objetivos de negócio", "Objetivos do usuário"…), exceto "Não objetivos".
  const objectiveSecs = sections.filter((s) => /^objetivos?\b/.test(s.key));
  const objectivesSec = objectiveSecs[0] ?? find(/\bobjetivos?\b/);
  const objectiveBlocks = (objectiveSecs.length ? objectiveSecs : objectivesSec ? [objectivesSec] : [])
    .filter((s, i, all) => !all.slice(0, i).some((prev) => children(prev).includes(s)))
    .flatMap((s) => deep(s, /^(nao objetivos|fora do escopo)/));
  if (motivatorSec) put("motivator", joinBlocks(deep(motivatorSec), 4000), label(motivatorSec));

  const outcomeSec = find(/^resultados? esperados?$/);
  const outcomeLine = (b: Block) => b.kind === "p" && /^resultados? esperados?\s*:/i.test(b.text);
  const outcomeInObjectives = objectiveBlocks.find((b) => b.kind === "p" && /resultados? esperados?/i.test(b.text));
  let outcomeUsed: Block | undefined;
  if (outcomeSec) put("expectedOutcome", joinBlocks(deep(outcomeSec), 2000), label(outcomeSec));
  else {
    const all = sections.flatMap((s) => own(s).map((b) => ({ b, s })));
    const explicit = all.find(({ b }) => outcomeLine(b));
    if (explicit && explicit.b.kind === "p") put("expectedOutcome", clip(explicit.b.text.replace(/^resultados? esperados?\s*:\s*/i, ""), 2000), label(explicit.s));
    else if (outcomeInObjectives && outcomeInObjectives.kind === "p" && objectivesSec) {
      put("expectedOutcome", clip(outcomeInObjectives.text, 2000), label(objectivesSec));
      outcomeUsed = outcomeInObjectives;
    }
  }

  if (objectivesSec) {
    const blocks = objectiveBlocks.filter((b) => b !== outcomeUsed);
    const lis = blocks.filter((b) => b.kind === "li");
    const paragraphs = blocks.filter((b) => b.kind === "p");
    // Objetivo principal (parágrafo) + objetivos específicos (lista), quando houver os dois.
    const items = lis.length ? [...(paragraphs[0] ? [paragraphs[0]] : []), ...lis] : paragraphs;
    put("objectives", dedupe(items.map((b) => clip(itemText(b), 1000))).slice(0, 20), label(objectivesSec));
    if (!motivatorSec && paragraphs[0] && paragraphs[0].kind === "p") put("motivator", clip(paragraphs[0].text, 4000), label(objectivesSec));
  }

  const hypothesisSec = find(/^hipoteses?\b/);
  if (hypothesisSec) put("hypothesis", joinBlocks(deep(hypothesisSec), 4000), label(hypothesisSec));
  else {
    for (const s of sections) {
      const p = own(s).find((b) => b.kind !== "table" && /\bhipotese\b/.test(fold(b.text)));
      if (p && p.kind !== "table") {
        const sentence = p.text.split(/(?<=[.!?])\s+/).find((x) => /\bhipotese\b/.test(fold(x))) ?? p.text;
        put("hypothesis", clip(sentence, 4000), label(s));
        break;
      }
    }
  }

  const evidenceSec = find(/^(evidencias?|evidencias disponiveis|dados de suporte|dados que sustentam)\b/);
  if (evidenceSec) put("evidence", itemsOf(deep(evidenceSec)).slice(0, 30), label(evidenceSec));

  const deliverablesSec = find(/^(principais entregas|entregas|entregaveis)\b/);
  const requirements = sections.filter((s) => /^rf\d+$/.test(s.code) && s.title);
  const requirementsSec = find(/^requisitos funcionais\b/);
  if (deliverablesSec) put("deliverables", itemsOf(deep(deliverablesSec)).slice(0, 30), label(deliverablesSec));
  else if (requirements.length) put("deliverables", dedupe(requirements.map((s) => clip(s.title, 1000))).slice(0, 30), "requisitos funcionais");
  else if (requirementsSec) {
    const table = deep(requirementsSec).find((b): b is Extract<Block, { kind: "table" }> => b.kind === "table");
    const col = table ? Math.max(0, table.header.findIndex((h) => /requisito|funcionalidade|nome/.test(fold(h)) && !/^id$/.test(fold(h)))) : -1;
    const items = table ? table.rows.map((r) => r[col] || r.find(Boolean) || "") : itemsOf(deep(requirementsSec));
    put("deliverables", dedupe(items.filter(Boolean).map((s) => clip(s, 1000))).slice(0, 30), label(requirementsSec));
  }

  /* 3. Impacto e plataformas */
  const platformMeta = metaGet(/^(plataformas?( impactadas| envolvidas| afetadas)?|produtos? impactados?)$/);
  const mentions = (text: string) => {
    const t = ` ${fold(text).replace(/[^a-z0-9]+/g, " ")} `;
    return ctx.platforms.filter((p) => t.includes(` ${fold(p.name).replace(/[^a-z0-9]+/g, " ").trim()} `)).map((p) => p.id);
  };
  if (platformMeta) {
    const ids = mentions(platformMeta[1]);
    put("platformIds", ids, metaSource);
    // O que sobra do campo após retirar os nomes reconhecidos (ex.: "área de gestão de redes e escolas").
    const names = new Set(ctx.platforms.map((p) => fold(p.name)));
    const unknown = platformMeta[1]
      .split(/[,;+/]/)
      .map((part) =>
        part
          .split(/\s+/)
          .filter((w) => !names.has(fold(w).replace(/[^a-z0-9]+/g, "")))
          .join(" ")
          .replace(/^(e|ou)\s+|\s+(e|ou)$/gi, "")
          .trim(),
      )
      .filter((s) => s && !/^(e|ou)$/i.test(s));
    if (unknown.length) warnings.push(`Plataformas citadas no PRD sem correspondência no catálogo: ${unknown.join("; ")}. Selecione-as manualmente, se for o caso.`);
  }
  if (!input.platformIds.length) {
    // Sem plataforma reconhecida no campo próprio: produto informado no cabeçalho e título do documento.
    const product = metaGet(/^produto$/)?.[1] ?? "";
    put("platformIds", mentions(`${product} ${h1?.title ?? ""}`), metaSource);
  }

  const journeySec = find(/^(fluxos? de usuario|fluxos? principais|jornadas?|fluxos?)\b/);
  if (journeySec) {
    const subs = directChildren(journeySec).map((c) => clip(c.title, 1000));
    put("journeys", (subs.length ? subs : itemsOf(own(journeySec).filter((b) => b.kind === "li"))).slice(0, 20), label(journeySec));
  }
  const areasMeta = metaGet(/^(areas?( envolvidas)?|times? envolvidos?)$/);
  const areasSec = find(/^(areas envolvidas|times envolvidos)\b/);
  if (areasMeta) put("areas", dedupe(areasMeta[1].split(/,|;|\s+e\s+/).map((s) => clip(s.trim(), 1000)).filter(Boolean)), metaSource);
  else if (areasSec) put("areas", itemsOf(deep(areasSec)).slice(0, 20), label(areasSec));
  const opsSec = find(/\bimpactos? operaciona/);
  if (opsSec) put("operationalImpacts", itemsOf(deep(opsSec)).slice(0, 20), label(opsSec));

  /* 4. Planejamento */
  const statusMeta = metaGet(/^(status|situacao|fase|estagio)$/);
  if (statusMeta) {
    const rule = STATUS_RULES.find(([re]) => re.test(fold(statusMeta[1])));
    if (rule) put("status", rule[1], metaSource);
    else warnings.push(`O status do PRD (“${statusMeta[1]}”) não corresponde a um status do roadmap. A iniciativa foi marcada como “Em definição” — ajuste se necessário.`);
  } else {
    warnings.push("O PRD não informa status. A iniciativa foi marcada como “Em definição” — ajuste se necessário.");
  }
  const priorityMeta = metaGet(/^prioridade$/);
  if (priorityMeta) {
    const p = fold(priorityMeta[1]);
    const priority: Priority | null = /\balta\b/.test(p) ? "alta" : /\bmedia\b/.test(p) ? "media" : /\bbaixa\b/.test(p) ? "baixa" : null;
    if (priority) put("priority", priority, metaSource);
    else warnings.push(`A prioridade do PRD (“${priorityMeta[1]}”) não foi reconhecida (use Alta, Média ou Baixa).`);
  }
  const quarterMeta = metaGet(/^(quarter|trimestre|previsao|prazo|lancamento previsto|periodo)$/);
  if (quarterMeta) {
    const q = fold(quarterMeta[1]).match(/\bq([1-4])\b|([1-4])\s*(o|º)?\s*tri/);
    if (q) put("quarter", `Q${q[1] ?? q[2]}` as Quarter, metaSource);
  }
  const ownerMeta = metaGet(/^(responsavel|responsavel pela iniciativa|owner|pm|product manager|product owner|po|autor|autora|lider)$/);
  if (ownerMeta) put("owner", clip(ownerMeta[1], 120), metaSource);

  /* 6. Métricas, dependências e riscos */
  const metricsSec = find(/^(metricas de sucesso|metricas|indicadores de sucesso|indicadores|kpis)\b/);
  if (metricsSec) {
    const blocks = deep(metricsSec, /^(instrumentacao|eventos)/);
    const tables = blocks.filter((b): b is Extract<Block, { kind: "table" }> => b.kind === "table");
    const metrics: Metric[] = [];
    const newMetric = (indicator: string): Metric => ({
      id: `met-${metrics.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
      indicator: clip(indicator, 300),
      baseline: "",
      baselineState: "pendente",
      target: "",
      targetState: "pendente",
      method: "",
      observed: "",
      lastEvaluatedAt: "",
    });
    for (const t of tables) {
      const head = t.header.map(fold);
      const baselineCol = head.findIndex((h) => /baseline|valor atual|valor de referencia|linha de base/.test(h));
      const targetCol = head.findIndex((h) => /^meta|alvo|target/.test(h));
      for (const row of t.rows) {
        if (!row[0]) continue;
        const m = newMetric(row[0]);
        // Valores escritos no PRD são propostas: nunca entram como "aprovados" ou "definidos".
        if (baselineCol > 0 && row[baselineCol]) [m.baseline, m.baselineState] = [clip(row[baselineCol], 200), "estimado"];
        if (targetCol > 0 && row[targetCol]) [m.target, m.targetState] = [clip(row[targetCol], 200), "proposta"];
        m.method = clip(
          row
            .map((v, i) => (i === 0 || i === baselineCol || i === targetCol || !v ? "" : `${t.header[i] || "Detalhe"}: ${v}`))
            .filter(Boolean)
            .join(" · "),
          1000,
        );
        metrics.push(m);
      }
    }
    if (!tables.length) {
      for (const b of blocks) {
        if (b.kind !== "li") continue;
        const [indicator, ...rest] = b.text.split(/:\s|\s[—–]\s/);
        const m = newMetric(indicator);
        m.method = clip(rest.join(": "), 1000);
        metrics.push(m);
      }
    }
    put("metrics", metrics.slice(0, 30), label(metricsSec));
  }

  const depSec = find(/^(dependencias tecnicas|dependencias)\b/);
  if (depSec) put("technicalDependencies", itemsOf(deep(depSec)).slice(0, 30), label(depSec));
  const riskSec = find(/^(riscos|principais riscos)\b/);
  if (riskSec) put("risks", itemsOf(deep(riskSec)).slice(0, 30), label(riskSec));
  const pendingSec = find(/^(decisoes pendentes|questoes em aberto|pontos em aberto|perguntas em aberto|duvidas em aberto|pendencias|open questions)\b/);
  if (pendingSec) put("pendingDecisions", itemsOf(deep(pendingSec)).slice(0, 30), label(pendingSec));

  const ids = new Set(ctx.initiatives.map((i) => i.id));
  const related = [...new Set(content.match(/JG-2027-\d{3}/g) ?? [])].filter((id) => ids.has(id));
  put("relatedInitiativeIds", related, "identificadores citados no PRD");

  /* Avisos de revisão */
  const clash = input.title && ctx.initiatives.find((i) => fold(i.title).replace(/[^a-z0-9]+/g, " ").trim() === fold(input.title).replace(/[^a-z0-9]+/g, " ").trim());
  if (clash) warnings.push(`Já existe uma iniciativa com o nome “${clash.title}” (${clash.id}). Altere o nome antes de criar.`);
  if (!metricsSec) warnings.push("Nenhuma seção de métricas foi encontrada no PRD.");
  else if (input.metrics.some((m) => m.baselineState === "pendente" || m.targetState === "pendente"))
    warnings.push("Valores de referência e metas que o PRD não informa ficaram como pendentes nas métricas.");

  return { input, report: { found, warnings } };
}

/** Versão declarada no cabeçalho do PRD ("**Versão:** 2.0"), quando houver. */
export function prdVersion(content: string): string {
  const head = content.split("\n").slice(0, 40).join("\n");
  const m = head.match(/^\s*[-*]?\s*\**vers[aã]o\**\s*:?\s*\**\s*:?\s*v?(\d+(?:\.\d+){0,2})\b/im) ?? head.match(/^\|\s*vers[aã]o\s*\|\s*v?(\d+(?:\.\d+){0,2})\s*\|/im);
  return m ? m[1] : "";
}
