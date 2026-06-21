"use client";

import { CheckCircle, ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DAY_LABELS } from "@/types/cards.types";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import {
  licenseRequestService,
  type ApproveReissueBatchRefusal,
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

interface ReissueCandidateGroup {
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  licenseRequestId: string;
  filaPosition: number | null;
  hasLicense: boolean;
  candidates: ReissueCandidate[];
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

function getDayLabel(day: string): string {
  return DAY_LABELS[day] ?? day;
}

function formatCandidateDay(candidate: Pick<ReissueCandidate, "day" | "period">): string {
  return `${getDayLabel(candidate.day)} · ${candidate.period}`;
}

function formatRefusal(refusal: ApproveReissueBatchRefusal): string {
  return `${getDayLabel(refusal.day)} · ${refusal.period}: ${refusal.reason}`;
}

function groupCandidates(candidates: ReissueCandidate[]): ReissueCandidateGroup[] {
  const groups = new Map<string, ReissueCandidateGroup>();

  for (const candidate of candidates) {
    const existing = groups.get(candidate.studentId);

    if (!existing) {
      groups.set(candidate.studentId, {
        studentId: candidate.studentId,
        studentName: candidate.studentName,
        studentEmail: candidate.studentEmail,
        licenseRequestId: candidate.licenseRequestId,
        filaPosition: candidate.filaPosition,
        hasLicense: candidate.hasLicense,
        candidates: [candidate],
      });
      continue;
    }

    existing.candidates.push(candidate);
    if (
      existing.filaPosition == null ||
      (candidate.filaPosition != null && candidate.filaPosition < existing.filaPosition)
    ) {
      existing.filaPosition = candidate.filaPosition;
    }
    existing.hasLicense = existing.hasLicense || candidate.hasLicense;
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      candidates: group.candidates.sort((a, b) => candidateKey(a).localeCompare(candidateKey(b))),
    }))
    .sort((a, b) => {
      const positionA = a.filaPosition ?? Number.MAX_SAFE_INTEGER;
      const positionB = b.filaPosition ?? Number.MAX_SAFE_INTEGER;
      if (positionA !== positionB) return positionA - positionB;
      return a.studentId.localeCompare(b.studentId);
    });
}

export function ReissueCandidatesSection({ universityId }: ReissueCandidatesSectionProps) {
  const [candidates, setCandidates] = useState<ReissueCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingStudentId, setApprovingStudentId] = useState<string | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [selectedKeysByStudentId, setSelectedKeysByStudentId] = useState<Record<string, string[]>>({});
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

  const visibleGroups = useMemo(() => {
    return groupCandidates(
      candidates.filter((candidate) => !universityId || candidate.universityId === universityId),
    );
  }, [candidates, universityId]);

  useEffect(() => {
    setSelectedKeysByStudentId((current) => {
      const next: Record<string, string[]> = {};
      for (const group of visibleGroups) {
        const availableKeys = group.candidates.map(candidateKey);
        const previousKeys = current[group.studentId];
        next[group.studentId] = previousKeys?.filter((key) => availableKeys.includes(key)) ?? availableKeys;
      }
      return next;
    });
  }, [visibleGroups]);

  const handleToggleCandidate = (studentId: string, key: string) => {
    setSelectedKeysByStudentId((current) => {
      const selectedKeys = current[studentId] ?? [];
      const nextKeys = selectedKeys.includes(key)
        ? selectedKeys.filter((selectedKey) => selectedKey !== key)
        : [...selectedKeys, key];
      return { ...current, [studentId]: nextKeys };
    });
  };

  const handleApprove = async (group: ReissueCandidateGroup) => {
    const selectedKeys = selectedKeysByStudentId[group.studentId] ?? [];
    const selectedCandidates = group.candidates.filter((candidate) =>
      selectedKeys.includes(candidateKey(candidate)),
    );
    if (selectedCandidates.length === 0) {
      setMessage("Selecione ao menos um dia para aprovar a reemissão.");
      setIsError(true);
      return;
    }

    setApprovingStudentId(group.studentId);
    setMessage("");
    setIsError(false);
    try {
      const result = await licenseRequestService.approveReissueBatch(group.licenseRequestId, {
        targets: selectedCandidates.map((candidate) => ({
          allocationId: candidate.allocationId,
          day: candidate.day,
          period: candidate.period,
        })),
      });
      if (result.refused.length > 0) {
        setMessage(`Alguns dias não foram aprovados: ${result.refused.map(formatRefusal).join("; ")}`);
        setIsError(true);
      } else {
        setMessage("Reemissão aprovada com sucesso.");
        setIsError(false);
      }
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
      setApprovingStudentId(null);
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

      {!loading && visibleGroups.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-6 text-center text-sm text-on-surface-variant">
          Nenhum candidato com vaga liberada.
        </div>
      )}

      {!loading && visibleGroups.length > 0 && (
        <div className="space-y-2">
          {visibleGroups.map((group) => {
            const label = group.hasLicense ? "Parcial" : "Total";
            const selectedKeys = selectedKeysByStudentId[group.studentId] ?? [];
            const isExpanded = expandedStudentId === group.studentId;
            return (
              <article
                key={group.studentId}
                className="rounded-xl border border-outline-variant bg-surface p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-bold text-on-surface">
                        {group.studentName ?? "Aluno não informado"}
                      </h3>
                      <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">
                        {label}
                      </span>
                      {group.filaPosition != null && (
                        <span className="rounded-full bg-warning/20 px-2 py-1 text-[11px] font-semibold text-warning">
                          #{group.filaPosition}
                        </span>
                      )}
                      <span className="rounded-full bg-surface-container px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
                        {group.candidates.length} dia(s)
                      </span>
                    </div>
                    {group.studentEmail && (
                      <p className="mt-1 truncate text-xs text-on-surface-variant">
                        {group.studentEmail}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {group.candidates.map(formatCandidateDay).join(", ")}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    aria-expanded={isExpanded}
                    aria-controls={`reissue-days-${group.studentId}`}
                    icon={
                      <ChevronDown
                        className={`size-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      />
                    }
                    onClick={() => setExpandedStudentId(isExpanded ? null : group.studentId)}
                  >
                    Ver dias
                  </Button>
                </div>

                {isExpanded && (
                  <div
                    id={`reissue-days-${group.studentId}`}
                    className="mt-4 space-y-3 border-t border-outline-variant pt-4"
                  >
                    <div className="space-y-2">
                      {group.candidates.map((candidate) => {
                        const key = candidateKey(candidate);
                        return (
                          <label
                            key={key}
                            className="flex items-start gap-3 rounded-lg border border-outline-variant p-3 text-sm text-on-surface"
                          >
                            <input
                              type="checkbox"
                              className="mt-1 size-4 accent-primary"
                              checked={selectedKeys.includes(key)}
                              onChange={() => handleToggleCandidate(group.studentId, key)}
                            />
                            <span className="min-w-0">
                              <span className="block font-semibold">
                                {formatCandidateDay(candidate)}
                              </span>
                              <span className="block text-xs text-on-surface-variant">
                                {candidate.busIdentifier ?? "Ônibus não informado"} ·{" "}
                                {candidate.availableSlots} vaga(s) disponível(is) de{" "}
                                {candidate.capacity}
                              </span>
                            </span>
                          </label>
                        );
                      })}
                    </div>

                    <Button
                      type="button"
                      size="sm"
                      icon={<CheckCircle className="size-4" />}
                      loading={approvingStudentId === group.studentId}
                      disabled={Boolean(approvingStudentId) || selectedKeys.length === 0}
                      onClick={() => void handleApprove(group)}
                    >
                      Aprovar reemissão
                    </Button>
                  </div>
                )}
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
