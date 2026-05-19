import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { http } from "@/services/http";
import type {
  LicenseRequestRecord,
  RejectionReasonConfig,
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
  const [reasons, setReasons] = useState<RejectionReasonConfig[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    http
      .get<RejectionReasonConfig[]>("/license-request/rejection-reasons")
      .then(setReasons)
      .catch(() => setReasons([]));
  }, []);

  const toggleReason = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleReject = async () => {
    if (selectedIds.size === 0) {
      setErrorMessage("Selecione ao menos um motivo de recusa.");
      return;
    }
    setRejecting(true);
    setErrorMessage("");
    try {
      await http.patch(`/license-request/reject/${currentLicenseRequest._id}`, {
        reasons: Array.from(selectedIds),
        ...(customMessage.trim() ? { customRejectionMessage: customMessage.trim() } : {}),
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
            <p className="text-xs text-on-surface-variant">Selecione os motivos da recusa</p>
          </div>
        </div>

        <div className="space-y-2">
          {reasons.map((reason) => (
            <label
              key={reason.id}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm border transition-all cursor-pointer ${
                selectedIds.has(reason.id)
                  ? "border-error bg-error/10 text-error font-medium"
                  : "border-outline-variant bg-surface-container-low text-on-surface hover:border-error/40"
              }`}
            >
              <input
                type="checkbox"
                className="accent-error"
                checked={selectedIds.has(reason.id)}
                onChange={() => toggleReason(reason.id)}
              />
              {reason.label}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs text-on-surface-variant mb-1">
            Observação adicional (opcional)
          </label>
          <textarea
            className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface resize-none focus:outline-none focus:border-primary"
            rows={3}
            maxLength={300}
            placeholder="Observação adicional para o aluno…"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
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
            disabled={selectedIds.size === 0 || rejecting}
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
