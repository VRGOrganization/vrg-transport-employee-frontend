import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";

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
  const isRejected = latestRequest?.status === "rejected";
  const isUpdateRequest = latestRequest?.type === "update";

  const baseClass = large
    ? `w-full rounded-xl border p-6 transition ${
        isSelected ? "border-primary bg-primary/8" : "border-outline-variant bg-surface-container-lowest"
      }`
    : `w-full rounded-xl border p-3 transition ${
        isSelected ? "border-primary bg-primary/10" : "border-outline-variant bg-surface hover:border-primary/40"
      }`;

  const isSelectable = selectable;

  return (
    <div className={baseClass}>
      <div className={large ? "flex items-center justify-between gap-6" : "flex items-center justify-between gap-3"}>
        <button
          onClick={() => {
            if (!isSelectable) return;
            onSelect(student);
          }}
          aria-disabled={!isSelectable}
          className={`min-w-0 flex-1 text-left ${!isSelectable ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <p className={large ? "truncate font-extrabold text-2xl text-on-surface" : "truncate font-semibold text-on-surface"}>{student.name}</p>
          {!large && (
            <>
              <p className="truncate text-xs text-on-surface-variant">{student.email}</p>
              <p className="truncate text-xs text-on-surface-variant">
                {student.institution ?? "Instituição não informada"}
              </p>
            </>
          )}
          {large && (
            <p className="mt-2 text-sm text-on-surface-variant">{student.institution ?? "Instituição não informada"} — {student.degree ?? ""}</p>
          )}
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
                : isWaitlisted
                  ? "bg-warning-container text-on-warning"
                : isPending
                  ? "bg-warning/20 text-warning"
                  : isRejected
                    ? "bg-error/15 text-error"
                    : "bg-outline-variant/30 text-on-surface-variant"
            }`}
          >
            {hasCard
              ? "Com carteirinha"
              : isWaitlisted
                ? `Na fila${latestRequest?.filaPosition ? ` (#${latestRequest.filaPosition})` : ""}`
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
          {!isSelectable && (
            <span title="Apenas o primeiro da fila pode ser selecionado" className="ml-2 text-on-surface-variant text-xs">
              🔒
            </span>
          )}
        </div>
      </div>
    </div>
  );
}