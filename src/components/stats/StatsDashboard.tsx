"use client";

import React from "react";
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
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-400">
        <span className="material-icons text-5xl text-red-300">
          error_outline
        </span>
        <p className="text-sm text-center max-w-xs">{error}</p>
        <button
          onClick={refetch}
          className="text-sm text-blue-500 hover:text-blue-600 underline underline-offset-2 transition-colors"
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
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-0.5">
            Painel de Informações
          </p>
          <h1 className="text-xl font-medium text-gray-800 pt-10">
            Estatísticas de Alunos
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-gray-400">
            Gerado em {formatDate(stats.generatedAt)}
          </span>
          <button
            onClick={refetch}
            title="Atualizar estatísticas"
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <span className="material-icons text-base">refresh</span>
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
          dotColor="#639922"
          valueColor="#3B6D11"
        />
        <MetricCard
          label="Solicitação pendente"
          value={stats.studentsWithPendingRequest}
          subtitle={`${pctPending}% do total`}
          dotColor="#EF9F27"
          valueColor="#BA7517"
        />
        <MetricCard
          label="Sem solicitação"
          value={stats.studentsWithoutCard}
          subtitle={`${pctWithout}% do total`}
          dotColor="#E24B4A"
          valueColor="#A32D2D"
        />
      </div>

      {/* Carteirinha + Transporte */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardStatusChart
          withCard={stats.studentsWithCard}
          pending={stats.studentsWithPendingRequest}
          withoutCard={stats.studentsWithoutCard}
        />

        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <p className="text-xs font-medium text-gray-400 mb-4 tracking-wide uppercase">
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