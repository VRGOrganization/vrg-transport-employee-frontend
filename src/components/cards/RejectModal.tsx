import { XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBanner } from "@/components/ui/StatusBanner";
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
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [reasonsError, setReasonsError] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReasons = () => {
    setLoadingReasons(true);
    setReasonsError("");
    http
      .get<RejectionReasonConfig[]>("/license-request/rejection-reasons")
      .then(setReasons)
      .catch(() => setReasonsError("Não foi possível carregar os motivos de recusa."))
      .finally(() => setLoadingReasons(false));
  };

  useEffect(loadReasons, []);

  const toggleReason = (label: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const hasPersonalDocReason = reasons.some(
    (r) => (r.isPersonalDocumentReason ?? false) && selectedLabels.has(r.label),
  );

  const cardReasons = reasons.filter((r) => !(r.isPersonalDocumentReason ?? false));
  const personalDocReasons = reasons.filter((r) => r.isPersonalDocumentReason ?? false);

  const handleReject = async () => {
    if (selectedLabels.size === 0) {
      setErrorMessage("Selecione ao menos um motivo de recusa.");
      return;
    }
    setRejecting(true);
    setErrorMessage("");
    try {
      await http.patch(`/license-request/${currentLicenseRequest._id}/reject`, {
        reasons: Array.from(selectedLabels),
        ...(customMessage.trim() ? { customMessage: customMessage.trim() } : {}),
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

  const reasonItemClass = (label: string, isPersonalDoc: boolean) => {
    const selected = selectedLabels.has(label);
    const base = "flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm border transition-all cursor-pointer";
    if (isPersonalDoc) {
      return `${base} ${
        selected
          ? "border-warning bg-warning/10 text-warning font-medium"
          : "border-warning/40 bg-surface-container-low text-on-surface hover:border-warning/60"
      }`;
    }
    return `${base} ${
      selected
        ? "border-error bg-error/10 text-error font-medium"
        : "border-outline-variant bg-surface-container-low text-on-surface hover:border-error/40"
    }`;
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      hideClose
      noPadding
      closeOnBackdrop={!rejecting}
    >
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
            <XCircle className="size-5 text-error" />
          </div>
          <div>
            <h2 className="font-bold text-on-surface text-base">Recusar carteirinha</h2>
            <p className="text-xs text-on-surface-variant">Selecione os motivos da recusa</p>
          </div>
        </div>

        <div className="space-y-2">
          {loadingReasons && (
            <p className="text-xs text-on-surface-variant">Carregando motivos…</p>
          )}

          {reasonsError && !loadingReasons && (
            <StatusBanner variant="error">
              <div className="flex items-center justify-between gap-2">
                <span>{reasonsError}</span>
                <button
                  type="button"
                  onClick={loadReasons}
                  className="font-semibold underline shrink-0 cursor-pointer"
                >
                  Tentar novamente
                </button>
              </div>
            </StatusBanner>
          )}

          {cardReasons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Documentos da carteirinha
              </p>
              {cardReasons.map((reason) => (
                <label
                  key={reason.label}
                  className={reasonItemClass(reason.label, false)}
                >
                  <input
                    type="checkbox"
                    className="accent-error"
                    checked={selectedLabels.has(reason.label)}
                    onChange={() => toggleReason(reason.label)}
                  />
                  {reason.label}
                </label>
              ))}
            </div>
          )}

          {personalDocReasons.length > 0 && (
            <div className="space-y-2 mt-3">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
                Documentos pessoais
              </p>
              {personalDocReasons.map((reason) => (
                <label
                  key={reason.label}
                  className={reasonItemClass(reason.label, true)}
                >
                  <input
                    type="checkbox"
                    className="accent-warning"
                    checked={selectedLabels.has(reason.label)}
                    onChange={() => toggleReason(reason.label)}
                  />
                  {reason.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-on-surface-variant mb-1">
            Observação adicional (opcional)
          </label>
          <textarea
            className="w-full rounded-xl border border-on-surface-variant bg-surface-container-low px-3 py-2 text-sm text-on-surface resize-none focus:outline-none focus:border-primary"
            rows={3}
            maxLength={300}
            placeholder="Observação adicional para o aluno…"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
          />
        </div>

        {errorMessage && <StatusBanner variant="error">{errorMessage}</StatusBanner>}

        {hasPersonalDocReason && (
          <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5">
            <span
              className="material-symbols-outlined text-warning shrink-0"
              style={{ fontSize: "16px" }}
            >
              warning
            </span>
            <p className="text-xs text-warning leading-relaxed">
              <strong>Atenção:</strong> Os motivos selecionados incluem documentos pessoais.
              Os documentos de identidade e comprovante de residência do aluno serão{" "}
              <strong>invalidados automaticamente</strong> e ele precisará reenviá-los antes
              de fazer uma nova solicitação.
            </p>
          </div>
        )}

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
            disabled={selectedLabels.size === 0 || rejecting}
            onClick={handleReject}
            className="flex-1 bg-error hover:bg-error/90"
          >
            Confirmar recusa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
