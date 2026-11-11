import "server-only";
import { createHash } from "node:crypto";
import { seedRoadmap2026 } from "@/data/seed/roadmap-2026";
import {
  importedItem,
  matchSheetPerson,
  OWNER_TRACK_DISCIPLINE,
  OWNER_TRACK_LABEL,
  OWNER_TRACKS_2026,
  ownerCandidatesForPlatform,
  segmentsFromSheet,
  trackStatusFromSheet,
} from "@/lib/domain/roadmap-2026";
import { checkHeader, sheetKey, sheetRows, type SheetRow } from "@/lib/domain/roadmap-2026-sheet";
import type { Database, Roadmap2026Item } from "@/lib/domain/types";
import { getRepository } from "@/lib/repositories";
import { historyEntry } from "@/lib/services/history";
import { readSheet } from "@/lib/services/xlsx-reader";

/**
 * Sincronização do Roadmap 2026 com a planilha do time ("Roadmap - 2026/02", aba "Cenário atual").
 *
 * Sentido único (planilha → app). A cada sincronização, cada linha é comparada com os últimos valores
 * vistos nela (`item.sheet`): só o que mudou na planilha é aplicado — o resto do que foi editado no
 * app continua como está. O que a planilha atualiza:
 *  - Design, Engenheiro e QA: texto de referência, andamento da frente ("Concluído", "Andamento…") e
 *    o responsável, quando o texto traz o nome de alguém do squad com a função da frente;
 *  - semanas (cores da linha do tempo), backlog, "ENG. PRECIFICAR" e "Qtd Semana";
 *  - linhas novas viram iniciativas novas (as removidas no app não voltam).
 * A linha é ligada à iniciativa pelo nome + squad da planilha (`sheetKey`): renomear a linha na
 * planilha cria outra iniciativa. Linhas apagadas na planilha não apagam nada no app.
 */

const SHEET_NAME = "Cenário atual";
/** Intervalo mínimo entre leituras da planilha (a tela aberta pede a sincronização a cada 20 s). */
const MIN_INTERVAL_MS = 15_000;
const FETCH_TIMEOUT_MS = 8_000;

const sheetId = /\/d\/([A-Za-z0-9_-]+)/.exec(seedRoadmap2026.source.url)?.[1];
/** Exportação .xlsx da planilha (com cores). `ROADMAP_2026_SHEET_URL` substitui o endereço (testes). */
const EXPORT_URL = process.env.ROADMAP_2026_SHEET_URL || (sheetId ? `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx` : null);

export interface SyncResult {
  ok: boolean;
  /** Iniciativas atualizadas ou incluídas nesta sincronização. */
  updated: number;
  created: number;
  error?: string;
}

const TRACK_FIELD = { design: "design", engineering: "engineering", qa: "qa" } as const;

/** Aplica a uma iniciativa o que mudou na linha da planilha; devolve as mudanças (para o histórico). */
function applyRow(item: Roadmap2026Item, row: SheetRow, db: Database): string[] {
  const prev = item.sheet;
  if (!prev) {
    item.sheet = row;
    return [];
  }
  const out: string[] = [];
  const candidates = ownerCandidatesForPlatform(db.people, db.squads, item.platformId);
  for (const track of OWNER_TRACKS_2026) {
    const field = TRACK_FIELD[track];
    if (prev[field] === row[field]) continue;
    item[field] = row[field];
    out.push(`${OWNER_TRACK_LABEL[track]} “${prev[field] || "vazio"}” → “${row[field] || "vazio"}”`);
    if (item.skippedTracks.includes(track as never)) continue;
    item.trackStatus = { ...item.trackStatus, [track]: trackStatusFromSheet(row[field]) };
    const person = matchSheetPerson(
      row[field],
      candidates.filter((p) => p.discipline === OWNER_TRACK_DISCIPLINE[track]),
    );
    if (person) item.owners = { ...item.owners, [track]: [person] };
  }
  if (JSON.stringify(prev.segments) !== JSON.stringify(row.segments)) {
    item.segments = segmentsFromSheet(item.id, row.segments, `p${Date.now().toString(36)}-`);
    out.push("semanas atualizadas");
  }
  if (prev.backlog !== row.backlog) {
    item.backlog = row.backlog;
    out.push(row.backlog ? "marcada como backlog" : "saiu do backlog");
  }
  if (prev.pricing !== row.pricing) item.pricing = row.pricing;
  if (prev.weeks !== row.weeks) item.weeks = row.weeks;
  item.sheet = row;
  return out;
}

/** Aplica as linhas lidas da planilha ao banco (dentro da transação). */
function applyRows(db: Database, rows: SheetRow[], now: string): { updated: number; created: number } {
  let updated = 0;
  let created = 0;
  let next = Math.max(0, ...db.roadmap2026.map((i) => Number(i.id.slice(4)) || 0)) + 1;
  const removed = new Set(db.roadmap2026Sync.removedKeys);
  for (const row of rows) {
    const key = sheetKey(row.title, row.squad);
    const index = db.roadmap2026.findIndex((i) => i.sheetKey === key);
    if (index < 0) {
      if (removed.has(key) || next > 999) continue;
      const id = `R26-${String(next++).padStart(3, "0")}`;
      const item = importedItem({ id, ...row }, ownerCandidatesForPlatform(db.people, db.squads, row.platformId));
      item.history = [historyEntry("Incluída a partir da planilha.", now)];
      // Entra no fim do grupo do mesmo squad (a ordem do Gantt é a da lista).
      const lastOfSquad = db.roadmap2026.map((i) => i.squad).lastIndexOf(item.squad);
      db.roadmap2026.splice(lastOfSquad < 0 ? db.roadmap2026.length : lastOfSquad + 1, 0, item);
      created++;
      continue;
    }
    const item = structuredClone(db.roadmap2026[index]);
    const changes = applyRow(item, row, db);
    if (JSON.stringify(item) === JSON.stringify(db.roadmap2026[index])) continue;
    if (changes.length) {
      item.history = [historyEntry(`Atualizada pela planilha: ${changes.join("; ")}.`, now), ...item.history].slice(0, 500);
      updated++;
    }
    db.roadmap2026[index] = item;
  }
  return { updated, created };
}

let inflight: Promise<SyncResult> | null = null;

/** Lê a planilha e aplica as mudanças. Chamadas simultâneas compartilham a mesma leitura. */
export function syncRoadmap2026(): Promise<SyncResult> {
  inflight ??= run().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function run(): Promise<SyncResult> {
  const now = new Date().toISOString();
  try {
    if (!EXPORT_URL) throw new Error("Endereço da planilha não configurado.");
    const response = await fetch(EXPORT_URL, { cache: "no-store", redirect: "follow", signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (!response.ok) throw new Error(`A planilha não respondeu (HTTP ${response.status}). Ela precisa estar compartilhada com "qualquer pessoa com o link".`);
    const grid = readSheet(Buffer.from(await response.arrayBuffer()), SHEET_NAME);
    const headerError = checkHeader(grid);
    if (headerError) throw new Error(headerError);
    const rows = sheetRows(grid);
    if (!rows.length) throw new Error("Nenhuma iniciativa encontrada na planilha.");
    const hash = createHash("sha1").update(JSON.stringify(rows)).digest("hex");
    return await getRepository().transaction((db) => {
      if (db.roadmap2026Sync.lastHash === hash) {
        db.roadmap2026Sync = { ...db.roadmap2026Sync, lastSyncAt: now, lastError: "" };
        return { ok: true, updated: 0, created: 0 };
      }
      const result = applyRows(db, rows, now);
      db.roadmap2026Sync = { ...db.roadmap2026Sync, lastSyncAt: now, lastHash: hash, lastError: "" };
      return { ok: true, ...result };
    });
  } catch (error) {
    const message = (error instanceof Error ? error.message : String(error)).slice(0, 500);
    console.error("[roadmap] sincronização com a planilha falhou:", message);
    // Registra a tentativa para não insistir a cada requisição.
    await getRepository()
      .transaction((db) => {
        db.roadmap2026Sync = { ...db.roadmap2026Sync, lastSyncAt: now, lastError: message };
      })
      .catch(() => undefined);
    return { ok: false, updated: 0, created: 0, error: message };
  }
}

/** Sincroniza se a última leitura tem mais de 15 s (chamada ao abrir o Roadmap 2026 e a cada 20 s com ele aberto). */
export async function syncRoadmap2026IfStale(lastSyncAt: string): Promise<SyncResult | null> {
  const last = Date.parse(lastSyncAt);
  if (Number.isFinite(last) && Date.now() - last < MIN_INTERVAL_MS) return null;
  return syncRoadmap2026();
}
