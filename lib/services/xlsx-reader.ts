import "server-only";
import { inflateRawSync } from "node:zlib";

/**
 * Leitor mínimo de .xlsx (sem dependências): descompacta o arquivo (zip) e lê, de uma aba,
 * o texto e a cor de fundo de cada célula. Suficiente para a exportação do Google Planilhas
 * (sem zip64 nem criptografia).
 */

export interface SheetCell {
  text: string;
  /** Cor de fundo sólida (ARGB, ex.: "FFA64D79"); null sem preenchimento. */
  fill: string | null;
}
/** Linha (1, 2, …) → coluna ("A", "B", …) → célula. */
export type SheetCells = Map<number, Map<string, SheetCell>>;

function unzip(buffer: Buffer): Map<string, Buffer> {
  const files = new Map<string, Buffer>();
  // Fim do diretório central: assinatura 0x06054b50, procurada a partir do fim.
  let eocd = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65_557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("Arquivo da planilha inválido (zip).");
  const entries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("Arquivo da planilha inválido (diretório).");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const data = buffer.subarray(start, start + compressedSize);
    if (method === 0) files.set(name, Buffer.from(data));
    else if (method === 8) files.set(name, inflateRawSync(data));
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
const decode = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e: string) =>
    e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENTITIES[e.toLowerCase()],
  );
/** Texto de um trecho XML: junta todos os <t>…</t>. */
const textOf = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join("");
const attr = (tag: string, name: string) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

/** Lê uma aba (pelo nome) do .xlsx. */
export function readSheet(buffer: Buffer, sheetName: string): SheetCells {
  const files = unzip(buffer);
  const read = (path: string) => files.get(path)?.toString("utf8") ?? "";

  // Aba → arquivo.
  const workbook = read("xl/workbook.xml");
  const sheetTag = [...workbook.matchAll(/<sheet\s[^>]*\/>/g)].map((m) => m[0]).find((t) => decode(attr(t, "name") ?? "") === sheetName);
  if (!sheetTag) throw new Error(`A aba “${sheetName}” não existe na planilha.`);
  const relId = attr(sheetTag, "r:id");
  const rels = read("xl/_rels/workbook.xml.rels");
  const relTag = [...rels.matchAll(/<Relationship\s[^>]*\/>/g)].map((m) => m[0]).find((t) => attr(t, "Id") === relId);
  const target = relTag ? attr(relTag, "Target") : undefined;
  if (!target) throw new Error("Não foi possível localizar a aba na planilha.");
  const sheetXml = read(`xl/${target.replace(/^\/?xl\//, "")}`);

  // Textos compartilhados.
  const strings = [...read("xl/sharedStrings.xml").matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));

  // Estilos: estilo da célula → preenchimento → cor.
  const styles = read("xl/styles.xml");
  const fillsXml = /<fills[^>]*>([\s\S]*?)<\/fills>/.exec(styles)?.[1] ?? "";
  const fills = [...fillsXml.matchAll(/<fill>([\s\S]*?)<\/fill>/g)].map((m) => {
    if (!/patternType="solid"/.test(m[1])) return null;
    return /<fgColor\s[^>]*rgb="([0-9A-Fa-f]{8})"/.exec(m[1])?.[1].toUpperCase() ?? null;
  });
  const xfsXml = /<cellXfs[^>]*>([\s\S]*?)<\/cellXfs>/.exec(styles)?.[1] ?? "";
  const xfFill = [...xfsXml.matchAll(/<xf\s[^>]*?(?:\/>|>)/g)].map((m) => Number(attr(m[0], "fillId") ?? 0));

  const cells: SheetCells = new Map();
  for (const row of sheetXml.matchAll(/<row\s[^>]*?r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const line = new Map<string, SheetCell>();
    for (const c of row[2].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const tag = ` ${c[1]}`;
      const ref = attr(tag, "r") ?? "";
      const col = ref.replace(/\d+/g, "");
      const type = attr(tag, "t");
      const style = Number(attr(tag, "s") ?? 0);
      const body = c[2] ?? "";
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let text = "";
      if (type === "s" && raw !== undefined) text = strings[Number(raw)] ?? "";
      else if (type === "inlineStr") text = textOf(body);
      else if (raw !== undefined) text = decode(raw);
      line.set(col, { text: text.replace(/\s+/g, " ").trim(), fill: fills[xfFill[style] ?? 0] ?? null });
    }
    cells.set(Number(row[1]), line);
  }
  return cells;
}
