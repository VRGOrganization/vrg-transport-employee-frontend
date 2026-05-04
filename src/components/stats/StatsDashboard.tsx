"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useStudentStats } from "@/components/hooks/useStudentStats";
import { MetricCard } from "@/components/stats/MetricCard";
import { CardStatusChart } from "@/components/stats/CardStatusChart";
import { ShiftDistribution } from "@/components/stats/ShiftDistribution";
import { TransportRing } from "@/components/stats/TransportRing";
import { DayUsageChart } from "@/components/stats/DayUsageChart";
import { StatsDashboardSkeleton } from "@/components/stats/StatsDashboardSkeleton";

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function StatsDashboard() {
  const { stats, loading, error, refetch } = useStudentStats();

  if (loading) {
    return <StatsDashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-on-surface-muted">
        <AlertCircle className="w-12 h-12 text-error" />
        <p className="text-sm text-center max-w-xs">{error}</p>
        <button
          onClick={refetch}
          className="text-sm text-info hover:text-info/80 underline underline-offset-2 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!stats) return null;

  const total = stats.totalStudents;
  const pctCard =
    total > 0 ? Math.round((stats.studentsWithCard / total) * 100) : 0;
  const pctPending =
    total > 0
      ? Math.round((stats.studentsWithPendingRequest / total) * 100)
      : 0;
  const pctWithout =
    total > 0 ? Math.round((stats.studentsWithoutCard / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <p className="text-xs text-on-surface-muted font-medium uppercase tracking-wide mb-0.5">
            Painel de Informações
          </p>
          <h1 className="text-xl font-medium text-on-surface">
            Estatísticas de Alunos
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-on-surface-muted">
            Gerado em {formatDate(stats.generatedAt)}
          </span>
          <button
            onClick={refetch}
            title="Atualizar estatísticas"
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-muted hover:text-on-surface-variant"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard
          label="Total de alunos"
          value={total}
          subtitle="cadastrados no sistema"
        />
        <MetricCard
          label="Carteirinha emitida"
          value={stats.studentsWithCard}
          subtitle={`${pctCard}% do total`}
          accentColor="success"
        />
        <MetricCard
          label="Solicitação pendente"
          value={stats.studentsWithPendingRequest}
          subtitle={`${pctPending}% do total`}
          accentColor="warning"
        />
        <MetricCard
          label="Sem solicitação"
          value={stats.studentsWithoutCard}
          subtitle={`${pctWithout}% do total`}
          accentColor="error"
        />
      </div>

      {/* Carteirinha + Transporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardStatusChart
          withCard={stats.studentsWithCard}
          pending={stats.studentsWithPendingRequest}
          withoutCard={stats.studentsWithoutCard}
        />

        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5">
          <p className="text-xs font-medium text-on-surface-muted mb-4 tracking-wide uppercase">
            Uso do transporte
          </p>
          <TransportRing
            totalUsing={stats.transport.totalUsing}
            totalStudents={total}
          />
          <ShiftDistribution
            morning={stats.transport.byShift.morning}
            afternoon={stats.transport.byShift.afternoon}
            night={stats.transport.byShift.night}
            fullTime={stats.transport.byShift.fullTime}
          />
        </div>
      </div>

      {/* Uso por dia */}
      <DayUsageChart byDay={stats.transport.byDay} />
    </div>
  );
}
