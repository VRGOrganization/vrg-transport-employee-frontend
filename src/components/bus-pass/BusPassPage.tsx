"use client";

import { Ban, CheckCircle2, ClipboardList, RotateCcw, Settings2, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import type { PageSize } from "@/lib/constants";
import { ReinforcedConfirmModal } from "@/components/ui/ReinforcedConfirmModal";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { toast } from "@/lib/toast";
import { busPassService } from "@/services/busPassService";
import type {
  BusPass,
  BusPassCapacityConflict,
  BusPassStatus,
} from "@/types/busPass";
import {
  BUS_PASS_STATUS_LABELS,
  formatCivilDate,
  todayInBR,
  weekdayLabel,
} from "@/types/busPass";

import { BusPassCapacityConflictModal } from "./BusPassCapacityConflictModal";
import { BusPassDetailModal } from "./BusPassDetailModal";
import { BusPassReasonModal } from "./BusPassReasonModal";

type TabKey = "pending" | "revision" | "approved" | "history";

const TAB_STATUSES: Record<TabKey, BusPassStatus[]> = {
  pending: ["pending"],
  revision: ["revision"],
  approved: ["approved"],
  history: ["rejected", "cancelled", "expired"],
};

type PendingAction = "reject" | "revision" | null;

const STATUS_PILL: Record<BusPassStatus, string> = {
  pending: "bg-warning/10 text-warning",
  revision: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-error/10 text-error",
  cancelled: "bg-surface-container text-on-surface-variant",
  expired: "bg-surface-container text-on-surface-variant",
};

function legText(pass: BusPass): string {
  const parts: string[] = [];
  if (pass.outbound) {
    parts.push(
      `Ida: ${pass.outbound.busIdentifier ?? "?"} → ${pass.outbound.universityAcronym ?? "?"}`,
    );
  }
  if (pass.inbound) {
    parts.push(
      `Volta: ${pass.inbound.busIdentifier ?? "?"} → ${pass.inbound.universityAcronym ?? "?"}`,
    );
  }
  return parts.join(" · ") || "-";
}

/**
 * Extrai o `conflict` do 409 de aprovação. O `http` guarda o corpo bruto em
 * `details`, então o contexto estruturado do backend sobrevive à conversão
 * para `ApiError`.
 */
function extractConflict(error: unknown): BusPassCapacityConflict | null {
  if (typeof error !== "object" || error === null) return null;
  if ((error as { status?: number }).status !== 409) return null;

  const details = (error as { details?: { conflict?: BusPassCapacityConflict } })
    .details;
  return details?.conflict ?? null;
}

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null) {
    const message = (error as { message?: string }).message;
    if (message) return message;
  }
  return fallback;
}

export function BusPassPage({ role }: { role: "admin" | "employee" }) {
  const manifestHref = `/${role}/bus-pass/manifest`;

  const [tab, setTab] = useState<TabKey>("pending");
  const [rows, setRows] = useState<BusPass[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSize>(20);
  const [dateFilter, setDateFilter] = useState("");
  const [pendingCount, setPendingCount] = useState(0);

  const [detailPass, setDetailPass] = useState<BusPass | null>(null);
  const [selected, setSelected] = useState<BusPass | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [revokeTarget, setRevokeTarget] = useState<BusPass | null>(null);
  const [conflict, setConflict] = useState<BusPassCapacityConflict | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, total: dataTotal } = await busPassService.listPaginated({
        status: TAB_STATUSES[tab],
        travelDate: dateFilter || undefined,
        page,
        limit: pageSize,
      });
      setRows(data);
      setTotal(dataTotal);

      // A contagem do badge é sempre da fila de pendentes, independente da
      // aba — `limit: 1` porque só o `total` do envelope importa aqui.
      if (tab === "pending") {
        setPendingCount(dataTotal);
      } else {
        const pending = await busPassService.listPaginated({
          status: ["pending"],
          limit: 1,
        });
        setPendingCount(pending.total);
      }
    } catch (err: unknown) {
      setRows([]);
      setTotal(0);

      setError(
        errorMessage(err, "Não foi possível carregar os passes de ônibus."),
      );
    } finally {
      setLoading(false);
    }
  }, [tab, dateFilter, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [tab, dateFilter]);

  const handleApprove = async (pass: BusPass) => {
    setActionLoading(true);
    try {
      await busPassService.approve(pass.id);
      toast.success("Passe aprovado.");
      await load();
    } catch (err: unknown) {
      const capacityConflict = extractConflict(err);
      if (capacityConflict) {
        // 409: o operador decide entre negar e devolver.
        setSelected(pass);
        setConflict(capacityConflict);
        return;
      }
      toast.error(errorMessage(err, "Não foi possível aprovar o passe."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReason = async (reason: string) => {
    if (!selected || !pendingAction) return;

    setActionLoading(true);
    setActionError(undefined);

    try {
      if (pendingAction === "reject") {
        await busPassService.reject(selected.id, reason);
        toast.success("Passe negado.");
      } else {
        await busPassService.requestRevision(selected.id, reason);
        toast.success("Passe devolvido ao aluno.");
      }
      setPendingAction(null);
      setSelected(null);
      await load();
    } catch (err: unknown) {
      setActionError(errorMessage(err, "Não foi possível concluir a ação."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;

    setActionLoading(true);
    try {
      await busPassService.revoke(
        revokeTarget.id,
        "Revogado pela operação do transporte.",
      );
      toast.success("Passe revogado e vaga devolvida.");
      setRevokeTarget(null);
      await load();
    } catch (err: unknown) {
      toast.error(errorMessage(err, "Não foi possível revogar o passe."));
    } finally {
      setActionLoading(false);
    }
  };

  const columns = useMemo<Column<BusPass>[]>(
    () => [
      {
        key: "student",
        label: "Aluno",
        render: (row) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-on-surface">
              {row.studentName || "-"}
            </p>
            {row.studentRegistration ? (
              <p className="truncate text-xs text-on-surface-variant">
                {row.studentRegistration}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        key: "date",
        label: "Viagem",
        render: (row) => (
          <div>
            <p className="text-on-surface">{formatCivilDate(row.travelDate)}</p>
            <p className="text-xs text-on-surface-variant">
              {weekdayLabel(row.travelDayOfWeek)}
              {row.mode === "integral" ? " · integral" : ""}
            </p>
          </div>
        ),
      },
      {
        key: "legs",
        label: "Ônibus e destino",
        render: (row) => (
          <span className="text-sm text-on-surface-variant">{legText(row)}</span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row) => (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_PILL[row.status]}`}
          >
            {BUS_PASS_STATUS_LABELS[row.status]}
          </span>
        ),
      },
      {
        key: "actions",
        label: "Ações",
        align: "right",
        render: (row) => {
          const canDecide = row.status === "pending" || row.status === "revision";

          return (
            <div
              className="flex justify-end gap-1"
              onClick={(event) => event.stopPropagation()}
            >
              {canDecide ? (
                <>
                  <Button
                    size="sm"
                    onClick={() => void handleApprove(row)}
                    disabled={actionLoading}
                    title="Aprovar"
                  >
                    <CheckCircle2 size={16} />
                  </Button>
                  {row.status === "pending" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelected(row);
                        setPendingAction("revision");
                      }}
                      title="Devolver ao aluno"
                    >
                      <RotateCcw size={16} />
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelected(row);
                      setPendingAction("reject");
                    }}
                    title="Negar"
                  >
                    <Ban size={16} />
                  </Button>
                </>
              ) : null}

              {row.status === "approved" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setRevokeTarget(row)}
                  title="Revogar"
                >
                  <ShieldOff size={16} />
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    // `handleApprove` recria a cada render; as deps relevantes são estas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [actionLoading],
  );

  const tabs: TabItem<TabKey>[] = [
    {
      key: "pending",
      label: pendingCount > 0 ? `Pendentes (${pendingCount})` : "Pendentes",
    },
    { key: "revision", label: "Devolvidos" },
    { key: "approved", label: "Aprovados" },
    { key: "history", label: "Histórico" },
  ];

  // O passado só faz sentido nas abas que já são história — nas abas "vivas"
  // (pendentes/devolvidos) filtrar por uma data que já passou não tem uso.
  const dateFilterMin =
    tab === "history" || tab === "approved" ? undefined : todayInBR();

  return (
    <main className="flex flex-1 flex-col bg-surface px-6 py-8 md:px-10">
      <div className="w-full space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Passes de ônibus
            </p>
            <h1 className="font-headline text-2xl font-semibold text-on-surface">
              Passes de ônibus
            </h1>
            <p className="max-w-2xl text-sm text-on-surface-variant">
              Pedidos pontuais para um dia fora da alocação fixa do aluno.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {role === "admin" ? (
              <Link href="/admin/bus-pass/settings">
                <Button type="button" variant="outline" size="sm" icon={<Settings2 size={16} />}>
                  Configurações
                </Button>
              </Link>
            ) : null}
            <Link href={manifestHref}>
              <Button type="button" variant="outline" size="sm" icon={<ClipboardList size={16} />}>
                Manifesto de passes
              </Button>
            </Link>
          </div>
        </header>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs items={tabs} value={tab} onChange={setTab} />

          <label className="flex items-center gap-2 text-sm text-on-surface-variant">
            Data da viagem
            <input
              type="date"
              value={dateFilter}
              min={dateFilterMin}
              onChange={(event) => setDateFilter(event.target.value)}
              className="rounded-lg border border-outline bg-surface px-3 py-1.5 text-sm text-on-surface"
            />
            {dateFilter ? (
              <Button size="sm" variant="outline" onClick={() => setDateFilter("")}>
                Limpar
              </Button>
            ) : null}
          </label>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          rowKey={(row) => row.id}
          onRowClick={(row) => setDetailPass(row)}
          loading={loading}
          error={error ?? undefined}
          empty="Nenhum passe nesta aba."
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <BusPassDetailModal
        open={detailPass !== null}
        pass={detailPass}
        onClose={() => setDetailPass(null)}
      />

      <BusPassReasonModal
        open={pendingAction !== null}
        title={pendingAction === "reject" ? "Negar passe" : "Devolver ao aluno"}
        description={
          pendingAction === "reject"
            ? "O aluno verá este motivo. O passe é encerrado."
            : "O aluno poderá corrigir e reenviar, por exemplo escolhendo outro ônibus."
        }
        confirmLabel={pendingAction === "reject" ? "Negar" : "Devolver"}
        loading={actionLoading}
        error={actionError}
        onClose={() => {
          setPendingAction(null);
          setActionError(undefined);
        }}
        onConfirm={handleReason}
      />

      <BusPassCapacityConflictModal
        open={conflict !== null}
        conflict={conflict}
        onClose={() => setConflict(null)}
        onReject={() => {
          setConflict(null);
          setPendingAction("reject");
        }}
        onRequestRevision={() => {
          setConflict(null);
          setPendingAction("revision");
        }}
      />

      <ReinforcedConfirmModal
        open={revokeTarget !== null}
        title="Revogar passe aprovado"
        description="O aluno perde o passe e a vaga volta para o estoque do ônibus."
        confirmLabel="Revogar"
        confirmWord="REVOGAR"
        loading={actionLoading}
        onClose={() => setRevokeTarget(null)}
        onConfirm={handleRevoke}
      />
    </main>
  );
}
