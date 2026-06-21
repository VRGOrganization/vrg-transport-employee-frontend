import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_REFRESH_INTERVAL_MS = 30_000;

interface UseAutoRefreshOptions {
  /** Intervalo de polling em ms (padrão: 30 segundos) */
  intervalMs?: number;
  /** Se false, o polling não inicia */
  enabled: boolean;
  /** Função chamada a cada tick */
  onRefresh: () => Promise<void>;
}

interface UseAutoRefreshReturn {
  /** true enquanto o refresh automático está ativo */
  isAutoRefreshing: boolean;
  /** Força um refresh imediato (fora do intervalo) */
  refreshNow: () => Promise<void>;
  /** Contador de quantos refreshes automáticos ocorreram */
  refreshCount: number;
}

export function useAutoRefresh({
  intervalMs = AUTO_REFRESH_INTERVAL_MS,
  enabled,
  onRefresh,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);

  const doRefresh = useCallback(async () => {
    if (runningRef.current) return; // evita overlap
    runningRef.current = true;
    setIsAutoRefreshing(true);
    try {
      await onRefresh();
      setRefreshCount((c) => c + 1);
    } finally {
      runningRef.current = false;
      setIsAutoRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      void doRefresh();
    }, intervalMs);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, intervalMs, doRefresh]);

  return { isAutoRefreshing, refreshNow: doRefresh, refreshCount };
}
