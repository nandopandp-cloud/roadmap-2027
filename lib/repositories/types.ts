import type { Database } from "@/lib/domain/types";

/**
 * Contrato de persistência. A aplicação depende apenas desta interface;
 * trocar o armazenamento (ex.: Supabase) significa criar uma nova implementação.
 */
export interface RoadmapRepository {
  /** Lê o estado atual completo. */
  read(): Promise<Database>;
  /**
   * Executa uma alteração de forma serializada e atômica: o `mutate` recebe uma
   * cópia do estado, pode alterá-la ou lançar erro (nada é gravado nesse caso).
   */
  transaction<T>(mutate: (db: Database) => T | Promise<T>): Promise<T>;
  /** Indica se o armazenamento aceita gravações neste ambiente. */
  isWritable(): Promise<boolean>;
}
