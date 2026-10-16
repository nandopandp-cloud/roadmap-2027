"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client/api";

/**
 * Verifica no servidor se os arquivos referenciados existem, para nunca
 * apresentar como disponível um documento/protótipo ausente.
 * Retorna `undefined` para caminhos ainda não verificados.
 */
export function useArtifactStatus(paths: string[]): Record<string, boolean | undefined> {
  const key = paths.join("|");
  const [status, setStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    api
      .artifactStatus(key.split("|"))
      .then((result) => !cancelled && setStatus(result))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [key]);

  return status;
}
