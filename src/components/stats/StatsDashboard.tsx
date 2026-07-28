"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, Filter, SearchX } from "lucide-react";
import { useStudentStats } from "@/components/hooks/useStudentStats";
import { MetricCard } from "@/components/stats/MetricCard";
import { CardStatusChart } from "@/components/stats/CardStatusChart";
import { ShiftDistribution } from "@/components/stats/ShiftDistribution";
import { RankedBreakdown } from "@/components/stats/RankedBreakdown";
import { DayUsageChart } from "@/components/stats/DayUsageChart";
import { StatsDashboardSkeleton } from "@/components/stats/StatsDashboardSkeleton";
import { SelectField } from "@/components/ui/SelectField";
import { EmptyState } from "@/components/ui/states";
import { busService } from "@/services/busService";
import { universityService } from "@/services/universityService";

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
  const [busFilter, setBusFilter] = useState<string>("");
  const [universityFilter, setUniversityFilter] = useState<string>("");
  const [shiftFilter, setShiftFilter] = useState<string>("");
  
  const [buses, setBuses] = useState<{value: string, label: string}[]>([]);
  const [universities, setUniversities] = useState<{value: string, label: string}[]>([]);
  
  useEffect(() => {
    async function fetchFilters() {
      try {
        const [busRes, uniRes] = await Promise.all([
          busService.listActive(),
          universityService.list(),
        ]);
        setBuses(busRes.map(b => ({ value: b._id, label: b.identifier })));
        setUniversities(uniRes.map(u => ({ value: u._id, label: u.name })));
      } catch (err) {
        console.error("Failed to load filter options", err);
      }
    }
    fetchFilters();
  }, []);

  const { stats, loading, error, refetch } = useStudentStats({
    busId: busFilter || undefined,
    universityId: universityFilter || undefined,
    shift: shiftFilter || undefined,
  });

  const busLabel = (id: string) => buses.find((b) => b.value === id)?.label ?? id;
  const universityLabel = (id: string) => universities.find((u) => u.value === id)?.label ?? id;

  const total = stats?.totalStudents ?? 0;
  const pctCard =
    stats && total > 0 ? Math.round((stats.studentsWithCard / total) * 100) : 0;
  const pctPending =
    stats && total > 0
      ? Math.round((stats.studentsWithPendingRequest / total) * 100)
      : 0;
  const pctWithout =
    stats && total > 0 ? Math.round((stats.studentsWithoutCard / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Header — permanece montado durante loading/erro, só o timestamp some */}
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
          {stats && (
            <span className="text-xs text-on-surface-muted">
              Gerado em {formatDate(stats.generatedAt)}
            </span>
          )}
          <button
            onClick={refetch}
            disabled={loading}
            title="Atualizar estatísticas"
            className="p-1.5 rounded-lg hover:bg-surface-container-high transition-colors text-on-surface-muted hover:text-on-surface-variant disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filtros — permanecem montados e utilizáveis durante loading/erro */}
      <div className="bg-surface-container-low/60 backdrop-blur-sm rounded-2xl p-4 border border-outline-variant/30 shadow-sm flex flex-col sm:flex-row gap-3 items-center z-20 relative">
        <div className="flex items-center gap-2 text-on-surface-muted w-full sm:w-auto pl-2">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
          <SelectField
            options={buses}
            placeholder="Todos os Ônibus"
            value={busFilter}
            onChange={(e) => setBusFilter(e.target.value)}
            className="h-10 text-sm"
          />

          <SelectField
            options={universities}
            placeholder="Todas as Faculdades"
            value={universityFilter}
            onChange={(e) => setUniversityFilter(e.target.value)}
            className="h-10 text-sm"
          />

          <SelectField
            options={[
              { value: "Manhã", label: "Manhã" },
              { value: "Tarde", label: "Tarde" },
              { value: "Noite", label: "Noite" },
              { value: "Integral", label: "Integral" }
            ]}
            placeholder="Todos os Turnos"
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            className="h-10 text-sm"
          />
        </div>
      </div>

      {loading ? (
        <StatsDashboardSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-on-surface-muted">
          <AlertCircle className="size-12 text-error" />
          <p className="text-sm text-center max-w-xs">{error}</p>
          <button
            onClick={refetch}
            className="text-sm text-info hover:text-info/80 underline underline-offset-2 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : !stats ? null : total === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nenhum aluno encontrado"
          description="Nenhum aluno corresponde aos filtros selecionados. Tente ajustar ou limpar os filtros."
        />
      ) : (
        <>
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
            <div className="group relative bg-surface-container-low/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
              <CardStatusChart
                withCard={stats.studentsWithCard}
                pending={stats.studentsWithPendingRequest}
                withoutCard={stats.studentsWithoutCard}
              />
            </div>

            <div className="group relative bg-surface-container-low/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
              <p className="text-xs font-semibold text-on-surface-muted mb-5 tracking-wider uppercase flex items-center gap-2">
                Uso do transporte
              </p>
              <div className="relative z-10">
                <ShiftDistribution
                  morning={stats.transport.byShift.morning}
                  afternoon={stats.transport.byShift.afternoon}
                  night={stats.transport.byShift.night}
                  fullTime={stats.transport.byShift.fullTime}
                />
              </div>
            </div>
          </div>

          {/* Alunos por ônibus / faculdade — só faz sentido quando o
              respectivo filtro não está fixado num único valor. */}
          {(!busFilter || !universityFilter) && (
            <div
              className={
                !busFilter && !universityFilter
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "grid grid-cols-1 gap-4"
              }
            >
              {!busFilter && (
                <div className="group relative bg-surface-container-low/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
                  <RankedBreakdown
                    title="Alunos por ônibus"
                    items={stats.transport.byBus.map((b) => ({
                      id: b.id,
                      label: busLabel(b.id),
                      count: b.count,
                    }))}
                  />
                </div>
              )}
              {!universityFilter && (
                <div className="group relative bg-surface-container-low/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
                  <RankedBreakdown
                    title="Alunos por faculdade"
                    items={stats.transport.byUniversity.map((u) => ({
                      id: u.id,
                      label: universityLabel(u.id),
                      count: u.count,
                    }))}
                  />
                </div>
              )}
            </div>
          )}

          {/* Uso por dia */}
          <div className="group relative bg-surface-container-low/60 backdrop-blur-sm border border-outline-variant/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-0.5 overflow-hidden">
            <DayUsageChart byDay={stats.transport.byDay} />
          </div>
        </>
      )}
    </div>
  );
}
