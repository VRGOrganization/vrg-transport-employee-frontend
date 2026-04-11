import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";

interface StudentListItemProps {
  student: StudentRecord;
  isSelected: boolean;
  hasCard: boolean;
  latestRequest: LicenseRequestRecord | null;
  isInBatch: boolean;
  onSelect: (student: StudentRecord) => void;
  onToggleBatch: (studentId: string) => void;
}

export function StudentListItem({
  student,
  isSelected,
  hasCard,
  latestRequest,
  isInBatch,
  onSelect,
  onToggleBatch,
}: StudentListItemProps) {
  const isPending = latestRequest?.status === "pending";
  const isRejected = latestRequest?.status === "rejected";
  const isUpdateRequest = latestRequest?.type === "update";

  return (
    <div
      className={`w-full rounded-xl border p-3 transition ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-outline-variant bg-surface hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => onSelect(student)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate font-semibold text-on-surface">{student.name}</p>
          <p className="truncate text-xs text-on-surface-variant">{student.email}</p>
          <p className="truncate text-xs text-on-surface-variant">
            {student.institution ?? "Instituição não informada"}
          </p>
        </button>

        <div className="flex items-center gap-2">
          {hasCard && (
            <label className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface-variant">
              <input
                type="checkbox"
                checked={isInBatch}
                onChange={() => onToggleBatch(student._id)}
                className="h-3.5 w-3.5"
              />
              Lote
            </label>
          )}

          <span
            className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
              hasCard
                ? "bg-success/15 text-success"
                : isPending
                  ? "bg-warning/20 text-warning"
                  : isRejected
                    ? "bg-error/15 text-error"
                    : "bg-outline-variant/30 text-on-surface-variant"
            }`}
          >
            {hasCard
              ? "Com carteirinha"
              : isPending
                ? "Pendente"
                : isRejected
                  ? "Recusada"
                  : "Sem solicitação"}
          </span>

          {isUpdateRequest && (
            <span className="rounded-full bg-secondary/15 px-2 py-1 text-[10px] font-semibold text-secondary">
              Alteração
            </span>
          )}
        </div>
      </div>
    </div>
  );
}