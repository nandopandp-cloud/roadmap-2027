/**
 * Leitura da planilha do Roadmap 2026 ("Roadmap - 2026/02", aba "Cenário atual") — a mesma regra
 * usada na importação inicial (data/seed/roadmap-2026.ts), agora aplicada a cada sincronização.
 *
 * Colunas: A Iniciativa · B Priorização · C Squad · D Qtd Semana · E Design · F Engenheiro ·
 * G QA · H Etapa Engenharia · I Status · J…AW semanas (S1–S4 de julho/2026 a abril/2027),
 * com a fase indicada pela cor da célula.
 */
import { ROADMAP_2026_WEEK_COUNT } from "@/lib/domain/constants";
import type { Roadmap2026ImportItem, Roadmap2026Phase } from "@/lib/domain/types";

export type SheetRow = Omit<Roadmap2026ImportItem, "id">;
export interface SheetGrid {
  get(row: number): Map<string, { text: string; fill: string | null }> | undefined;
}

/** Cor da célula → fase (legenda da planilha). Cores fora da legenda são ignoradas. */
export const PHASE_BY_FILL: Record<string, Roadmap2026Phase> = {
  FFA64D79: "engenharia",
  FF674EA7: "design",
  FF3D85C6: "andamento",
  FF3C78D8: "andamento",
  FF6AA84F: "concluido",
  FF38761D: "concluido",
  FFCC0000: "revisao",
  FFFF0000: "revisao",
  FFCCCCCC: "indefinido",
  FFD9D9D9: "indefinido",
};

const SQUAD_PLATFORM: Record<string, string | null> = {
  Exploradores: "exploradores",
  Educadores: "educadores",
  Geniex: "geniex",
  Famílias: "familias",
  LMS: "lms",
  Transversais: null,
};
const WAVE: Record<string, SheetRow["wave"]> = { "Primeira Onda": "primeira", "Segunda Onda": "segunda", "Terceira Onda": "terceira" };

const normalize = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Chave estável de uma linha da planilha: nome + squad (a planilha não tem IDs). */
export const sheetKey = (title: string, squad: string) => `${normalize(title)}|${normalize(squad)}`;

/** Coluna da semana `index` (0 = J). */
function weekColumn(index: number): string {
  let n = 9 + index; // J = 10ª coluna (índice 9)
  let col = "";
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) col = String.fromCharCode(65 + ((n - 1) % 26)) + col;
  return col;
}

/** Confere se a aba ainda tem o cabeçalho esperado (evita sincronizar uma estrutura diferente). */
export function checkHeader(grid: SheetGrid): string | null {
  const header = grid.get(3);
  const expected: [string, string][] = [
    ["A", "Iniciativa"],
    ["C", "Squad"],
    ["E", "Design"],
    ["F", "Engenheiro"],
    ["G", "QA"],
    ["I", "Status"],
  ];
  const wrong = expected.filter(([col, name]) => normalize(header?.get(col)?.text ?? "") !== normalize(name));
  return wrong.length ? `A planilha mudou de formato (cabeçalho ${wrong.map(([c]) => c).join(", ")}).` : null;
}

/** Linhas de iniciativas da planilha (linhas 4 a 125), na ordem, sem repetidas (nome + squad). */
export function sheetRows(grid: SheetGrid): SheetRow[] {
  const rows: SheetRow[] = [];
  const seen = new Set<string>();
  for (let r = 4; r <= 125; r++) {
    const line = grid.get(r);
    const text = (col: string) => line?.get(col)?.text ?? "";
    const title = text("A");
    if (!title) continue;
    const squad = text("C");
    const key = sheetKey(title, squad);
    if (!squad || seen.has(key)) continue;
    seen.add(key);
    const weeksRaw = Number(text("D").replace(",", "."));
    const segments: SheetRow["segments"] = [];
    for (let i = 0; i < ROADMAP_2026_WEEK_COUNT; i++) {
      const fill = line?.get(weekColumn(i))?.fill;
      const phase = fill ? PHASE_BY_FILL[fill] : undefined;
      if (!phase) continue;
      const last = segments[segments.length - 1];
      if (last && last.phase === phase && last.start + last.weeks === i) last.weeks += 1;
      else segments.push({ phase, start: i, weeks: 1 });
    }
    rows.push({
      title,
      squad,
      platformId: squad in SQUAD_PLATFORM ? SQUAD_PLATFORM[squad] : null,
      wave: WAVE[text("B")] ?? null,
      weeks: Number.isFinite(weeksRaw) && weeksRaw > 0 && weeksRaw <= 52 ? weeksRaw : null,
      design: text("E"),
      engineering: text("F"),
      qa: text("G"),
      backlog: text("I") === "Backlog",
      pricing: text("H") === "ENG. PRECIFICAR",
      segments,
    });
  }
  return rows;
}
