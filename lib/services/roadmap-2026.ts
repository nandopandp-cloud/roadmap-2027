import { seedRoadmap2026 } from "@/data/seed/roadmap-2026";
import type { Roadmap2026 } from "@/lib/domain/types";
import { roadmap2026Schema } from "@/lib/validation/schemas";

/**
 * Roadmap 2026: projeção importada da planilha do time, versionada em data/seed/roadmap-2026.ts.
 * É uma referência somente leitura (não fica no banco nem é editada pela interface).
 */
let cached: Roadmap2026 | null = null;

export function getRoadmap2026(): Roadmap2026 {
  cached ??= roadmap2026Schema.parse(seedRoadmap2026);
  return cached;
}
