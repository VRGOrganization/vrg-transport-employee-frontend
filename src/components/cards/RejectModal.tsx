import { XCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";
import {
  REJECTION_REASONS,
  type LicenseRequestRecord,
  type RejectionReason,
} from "@/types/cards.types";

interface RejectModalProps {
  currentLicenseRequest: LicenseRequestRecord;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onReload: () => Promise<void>;
}

export function RejectModal({
  currentLicenseRequest,
  onClose,
  onSuccess,
  onReload,
}: RejectModalProps) {
  const [selectedReason, setSelectedReason] = useState<RejectionReason | "">("");
  const [rejecting, setRejecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleReject = async () => {
    if (!selectedReason) {
      setErrorMessage("Selecione um motivo de recusa.");
      return;
    }
    setRejecting(true);
    setErrorMessage("");
    try {
      await employeeApi.patch(`/license-request/reject/${currentLicenseRequest._id}`, {
        reason: selectedReason,
      });
      onSuccess("Carteirinha recusada. O aluno foi notificado por e-mail.");
      await onReload();
      onClose();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e.message ?? "Falha ao recusar a carteirinha.");
    } finally {
      setRejecting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={() => !rejecting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-error" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-base">Recusar carteirinha</h2>
            <p className="text-xs text-on-surface-variant">Selecione o motivo da recusa</p>
          </div>
        </div>

        <div className="space-y-2">
          {REJECTION_REASONS.map((reason) => (
            <button
              key={reason}
              type="button"
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                selectedReason === reason
                  ? "border-error bg-error/10 text-error font-medium"
                  : "border-outline-variant bg-surface-container-low text-on-surface hover:border-error/40"
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {errorMessage && <p className="text-xs text-error">{errorMessage}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={rejecting}
            className="flex-1 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-all disabled:opacity-40"
          >
            Cancelar
          </button>
          <Button
            variant="primary"
            size="md"
            loading={rejecting}
            disabled={!selectedReason || rejecting}
            onClick={handleReject}
            className="flex-1 bg-error hover:bg-error/90"
          >
            Confirmar recusa
          </Button>
        </div>
      </div>
    </div>
  );
}