"use client";

import { useState, useEffect } from "react";
import { StudentDashboardStats } from "@/types/student-stats";

type UseStudentStatsResult = {
  stats: StudentDashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useStudentStats(): UseStudentStatsResult {
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        // URL corrigida: removido "/api/proxy" - agora chama diretamente o endpoint do backend
        const res = await fetch("/student/stats/dashboard", {
          cache: "no-store",
          credentials: "include", // Importante: envia cookies para autenticação
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          // Mensagem de erro mais específica baseada no status
          if (res.status === 401) {
            throw new Error("Não autorizado. Faça login novamente.");
          } else if (res.status === 403) {
            throw new Error("Acesso negado. Você não tem permissão para acessar estas estatísticas.");
          } else {
            throw new Error(`Erro ao carregar estatísticas (${res.status})`);
          }
        }

        const data: StudentDashboardStats = await res.json();

        if (!cancelled) {
          setStats(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erro desconhecido");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  return {
    stats,
    loading,
    error,
    refetch: () => setTick((t) => t + 1),
  };
}