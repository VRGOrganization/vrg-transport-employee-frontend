"use client";

import { CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DAY_LABELS } from "@/types/cards.types";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import {
  licenseRequestService,
  type ReissueCandidate,
} from "@/services/licenseRequestService";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";

interface ReissueCandidatesSectionProps {
  universityId: string | null;
}

function candidateKey(candidate: ReissueCandidate): string {
  return `${candidate.licenseRequestId}:${candidate.allocationId}:${candidate.day}:${candidate.period}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function ReissueCandidatesSection({ universityId }: ReissueCandidatesSectionProps) {
  const [candidates, setCandidates] = useState<ReissueCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingKey, setApprovingKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const loadCandidates = useCallback(async (options: { keepMessage?: boolean } = {}) => {
    setLoading(true);
    if (!options.keepMessage) {
      setMessage("");
      setIsError(false);
    }
    try {
      const activePeriod = await enrollmentPeriodService.getActive().catch(() => null);
      const data = await licenseRequestService.listReissueCandidates(activePeriod?._id);
      setCandidates(data);
    } catch (error: unknown) {
      setCandidates([]);
      setMessage(getErrorMessage(error, "Não foi possível carregar candidatos à reemissão."));
      setIsError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  const visibleCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => !universityId || candidate.universityId === universityId)
      .sort((a, b) => {
        const positionA = a.filaPosition ?? Number.MAX_SAFE_INTEGER;
        const positionB = b.filaPosition ?? Number.MAX_SAFE_INTEGER;
        if (positionA !== positionB) return positionA - positionB;
        return candidateKey(a).localeCompare(candidateKey(b));
      });
  }, [candidates, universityId]);

  const handleApprove = async (candidate: ReissueCandidate) => {
    const key = candidateKey(candidate);
    setApprovingKey(key);
    setMessage("");
    setIsError(false);
    try {
      await licenseRequestService.approveReissue(candidate.licenseRequestId, {
        allocationId: candidate.allocationId,
        day: candidate.day,
        period: candidate.period,
      });
      setMessage("Reemissão aprovada com sucesso.");
      setIsError(false);
      await loadCandidates({ keepMessage: true });
    } catch (error: unknown) {
      setMessage(
        getErrorMessage(
          error,
          "Não foi possível aprovar a reemissão. A vaga pode ter sido ocupada por outra solicitação.",
        ),
      );
      setIsError(true);
      await loadCandidates({ keepMessage: true });
    } finally {
      setApprovingKey(null);
    }
  };

  return (
    <PanelCard as="section" className="md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-on-surface">Reemissão por dia liberado</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Candidatos da fila com vaga disponível no dia/período.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RefreshCw className="size-4" />}
          disabled={loading}
          onClick={() => void loadCandidates()}
        >
          Recarregar
        </Button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
          <Loader2 className="size-4 animate-spin" />
          Carregando candidatos à reemissão...
        </div>
      )}

      {!loading && visibleCandidates.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-6 text-center text-sm text-on-surface-variant">
          Nenhum candidato com vaga liberada.
        </div>
      )}

      {!loading && visibleCandidates.length > 0 && (
        <div className="space-y-2">
          {visibleCandidates.map((candidate) => {
            const key = candidateKey(candidate);
            const label = candidate.hasLicense ? "Parcial" : "Total";
            return (
              <article
                key={key}
                className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-on-surface">
                      {candidate.studentName ?? "Aluno não informado"}
                    </h3>
                    <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">
                      {label}
                    </span>
                    {candidate.filaPosition != null && (
                      <span className="rounded-full bg-warning/20 px-2 py-1 text-[11px] font-semibold text-warning">
                        #{candidate.filaPosition}
                      </span>
                    )}
                  </div>
                  {candidate.studentEmail && (
                    <p className="mt-1 truncate text-xs text-on-surface-variant">
                      {candidate.studentEmail}
                    </p>
                  )}
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {DAY_LABELS[candidate.day] ?? candidate.day} · {candidate.period} ·{" "}
                    {candidate.busIdentifier ?? "Ônibus não informado"}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {candidate.availableSlots} vaga(s) disponível(is) de {candidate.capacity}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  icon={<CheckCircle className="size-4" />}
                  loading={approvingKey === key}
                  disabled={Boolean(approvingKey)}
                  onClick={() => void handleApprove(candidate)}
                >
                  Aprovar reemissão
                </Button>
              </article>
            );
          })}
        </div>
      )}

      {message && (
        <p
          className={`mt-3 text-sm ${isError ? "text-error" : "text-success"}`}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      )}
    </PanelCard>
  );
}
