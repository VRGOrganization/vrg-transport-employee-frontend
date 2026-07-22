"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { toast } from "@/lib/toast";
import { formatDateTime } from "@/lib/license-formatters";
import { noticeService } from "@/services/noticeService";
import type { NoticeStatus, PollResults } from "@/services/noticeService";

interface Props {
  noticeId: string;
  status: NoticeStatus;
}

export function PollResultsPanel({ noticeId, status }: Props) {
  const [results, setResults] = useState<PollResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await noticeService.getPollResults(noticeId);
      setResults(data);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? "Erro ao buscar resultados");
    } finally {
      setLoading(false);
    }
  }, [noticeId]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleExport = async () => {
    try {
      const csv = await noticeService.exportPollResults(noticeId);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enquete-${noticeId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const e = err as { message?: string };
      toast.error(e.message ?? "Erro ao exportar resultados");
    }
  };

  const totalVotes = results?.aggregate.reduce((sum, o) => sum + o.voteCount, 0) ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-headline font-semibold text-on-surface">Resultados</h3>
        <Button variant="outline" size="sm" icon={<RefreshCw className="size-4" />} onClick={fetchResults} disabled={loading}>
          Atualizar
        </Button>
      </div>

      {error && <StatusBanner variant="error">{error}</StatusBanner>}

      {results && (
        <div className="space-y-2">
          {results.aggregate.map((option) => {
            const percent = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0;
            return (
              <div key={option.optionId} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-on-surface">{option.label}</span>
                  <span className="text-on-surface-variant">
                    {option.voteCount} ({percent}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {status !== "expired" && (
        <StatusBanner variant="info">
          Resultado nominal disponível após o encerramento.
        </StatusBanner>
      )}

      {status === "expired" && results?.nominal && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-on-surface">Votos nominais</h4>
            <Button variant="outline" size="sm" icon={<Download className="size-4" />} onClick={handleExport}>
              Exportar CSV
            </Button>
          </div>
          <div className="space-y-2">
            {results.nominal.map((entry, index) => (
              <div key={index} className="text-sm border-b border-outline-variant/30 pb-2">
                <p className="text-on-surface font-medium">{entry.studentName}</p>
                <p className="text-on-surface-variant">{entry.studentEmail}</p>
                <p className="text-on-surface-variant">
                  {entry.optionIds
                    .map((id) => results.aggregate.find((o) => o.optionId === id)?.label ?? id)
                    .join(", ")}{" "}
                  — {formatDateTime(entry.votedAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
