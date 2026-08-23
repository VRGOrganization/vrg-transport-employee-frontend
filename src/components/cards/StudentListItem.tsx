import { Check, Square } from "lucide-react";
import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";

interface StudentListItemProps {
  student: StudentRecord;
  isSelected: boolean;
  hasCard: boolean;
  latestRequest: LicenseRequestRecord | null;
  isInBatch: boolean;
  onSelect: (student: StudentRecord) => void;
  onToggleBatch: (studentId: string) => void;
  large?: boolean;
  selectable?: boolean;
}

export function StudentListItem({
  student,
  isSelected,
  hasCard,
  latestRequest,
  isInBatch,
  onSelect,
  onToggleBatch,
  large = false,
  selectable = true,
}: StudentListItemProps) {
  const isPending = latestRequest?.status === "pending";
  const isWaitlisted = latestRequest?.status === "waitlisted";
  const isPartiallyWaitlisted =
    hasCard &&
    (latestRequest?.allocationSummary?.some((allocation) => allocation.status === "waitlisted") ?? false);
  const isRejected = latestRequest?.status === "rejected";
  const isCancelled = latestRequest?.status === "cancelled";
  const isRevision = latestRequest?.status === "revision";

  const isSelectable = selectable;

  const handleSelect = () => {
    if (!isSelectable) return;
    onSelect(student);
  };

  const sizeClass = large
    ? "h-32 items-center gap-6 p-6"
    : "h-24 items-center gap-3 p-3";
  const stateClass = isSelected
    ? large
      ? "border-primary bg-primary/8"
      : "border-primary bg-primary/10"
    : large
      ? "border-outline-variant bg-surface-container-lowest"
      : "border-outline-variant bg-surface";
  const interactionClass = isSelectable
    ? "cursor-pointer hover:border-primary/50 hover:bg-primary/5"
    : "cursor-not-allowed opacity-60";
  const batchClass = isInBatch ? "ring-2 ring-primary ring-offset-2 ring-offset-surface" : "";

  return (
    <div
      role="button"
      tabIndex={isSelectable ? 0 : -1}
      aria-disabled={!isSelectable}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (!isSelectable) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleSelect();
        }
      }}
      className={`flex w-full justify-between overflow-hidden rounded-xl border outline-none transition focus-visible:ring-2 focus-visible:ring-primary/40 ${sizeClass} ${stateClass} ${interactionClass} ${batchClass}`}
    >
      <div className="min-w-0 flex-1 text-left">
        <p className={large ? "truncate font-extrabold text-2xl text-on-surface" : "truncate font-semibold text-on-surface"}>{toTitleCase(resolveDisplayName(student))}</p>
        {!large && (
          <>
            <p className="truncate text-xs text-on-surface-variant">{student.email}</p>
            <p className="truncate text-xs text-on-surface-variant">
              {student.institution ? toTitleCase(student.institution) : "Instituição não informada"}
            </p>
          </>
        )}
        {large && (
          <p className="mt-2 truncate text-sm text-on-surface-variant">{student.institution ? toTitleCase(student.institution) : "Instituição não informada"} — {student.degree ?? ""}</p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
          {hasCard && (
            <button
              type="button"
              aria-pressed={isInBatch}
              title={isInBatch ? "Remover da impressão em lote" : "Selecionar para impressão em lote"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleBatch(student._id);
              }}
              className={`inline-flex cursor-pointer items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                isInBatch
                  ? "border-primary bg-primary/10 text-primary hover:bg-primary/20"
                  : "border-outline-variant bg-surface-container-low text-on-surface-variant hover:border-primary/40 hover:bg-surface-container"
              }`}
            >
              {isInBatch ? (
                <Check className="size-3.5" />
              ) : (
                <Square className="size-3.5" />
              )}
              Lote
            </button>
          )}

          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
              isPartiallyWaitlisted
                  ? "bg-warning/15 text-warning"
                : hasCard
                  ? "bg-success/15 text-success"
                : isWaitlisted
                  ? "bg-warning/20 text-warning"
                : isPending
                  ? "bg-primary/15 text-primary"
                  : isRevision
                    ? "bg-primary/15 text-primary"
                  : isRejected
                    ? "bg-error/15 text-error"
                    : isCancelled
                      ? "bg-outline-variant/20 text-on-surface-variant line-through"
                      : "bg-outline-variant/30 text-on-surface-variant"
            }`}
          >
            {isPartiallyWaitlisted
                ? "Parcial"
              : hasCard
                ? "Com carteirinha"
              : isWaitlisted
                ? "Na fila"
              : isPending
                ? "Pendente"
                : isRevision
                  ? "Em revisão"
                : isRejected
                  ? "Recusada"
                  : isCancelled
                    ? "Cancelada"
                    : "Sem solicitação"}
          </span>

          {isRevision && (
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                latestRequest?.revisionStage === "resubmitted"
                  ? "bg-success/15 text-success"
                  : "bg-warning/20 text-warning"
              }`}
            >
              {latestRequest?.revisionStage === "resubmitted"
                ? "Reenviado"
                : "Aguardando aluno"}
            </span>
          )}

          {latestRequest?.type === "update" && (
            <span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-semibold text-secondary">
              Atualização
            </span>
          )}
          {latestRequest?.type === "initial" && latestRequest.status === "pending" && (
            <span className="rounded-full bg-primary/15 px-2 py-1 text-[10px] font-semibold text-primary">
              Inicial
            </span>
          )}
          {!isSelectable && (
            <span title="Apenas o primeiro da fila pode ser selecionado" className="ml-2 text-on-surface-variant text-xs">
              🔒
            </span>
          )}
      </div>
    </div>
  );
}
