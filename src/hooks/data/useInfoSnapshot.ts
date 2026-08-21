"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadInfoSnapshot,
  withStudentStatusCounts,
  type InfoSnapshot,
} from "@/services/infoService";

export interface UseInfoSnapshotResult {
  snapshot: InfoSnapshot | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Carrega o snapshot da sala de controle.
 *
 * `GET /license-request` devolve os pedidos de TODOS os ciclos, então uma única
 * leitura cobre o histórico inteiro: trocar de ciclo é uma redução em memória,
 * não uma ida à rede. Só "Atualizar" refaz a requisição.
 */
export function useInfoSnapshot(): UseInfoSnapshotResult {
  const [snapshot, setSnapshot] = useState<InfoSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const mountState = { cancelled: false };

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await loadInfoSnapshot();
        if (mountState.cancelled) return;
        setSnapshot({
          ...result,
          census: withStudentStatusCounts(result.census, result.students),
        });
      } catch (err) {
        if (mountState.cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar as informações.",
        );
      } finally {
        if (!mountState.cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      mountState.cancelled = true;
    };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  return { snapshot, loading, error, refetch };
}
