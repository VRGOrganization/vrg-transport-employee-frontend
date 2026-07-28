import { Bus, ClipboardCheck, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isPdfDataUrl } from "@/lib/cardUtils";
import { cn } from "@/lib/utils";
import type { LicenseRecord, LicenseRequestRecord } from "@/types/cards.types";

interface ApprovalFooterProps {
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  selectedLicensePreview: string | null;
  approving: boolean;
  printingSingle: boolean;
  approveMessage: string;
  approveMessageIsError?: boolean;
  onApprove: () => void;
  onRejectOpen: () => void;
  onRevisionOpen: () => void;
  onPrintSingle: () => void;
}

export function ApprovalFooter({
  currentLicense,
  currentLicenseRequest,
  selectedLicensePreview,
  approving,
  printingSingle,
  approveMessage,
  approveMessageIsError = false,
  onApprove,
  onRejectOpen,
  onRevisionOpen,
  onPrintSingle,
}: ApprovalFooterProps) {
  const isPending = currentLicenseRequest?.status === "pending";
  // Revisão já reenviada pelo aluno: pode ser aprovada/recusada/devolvida.
  const isResubmittedRevision =
    currentLicenseRequest?.status === "revision" &&
    currentLicenseRequest?.revisionStage === "resubmitted";
  const hasWaitlistedAllocation =
    currentLicenseRequest?.allocationSummary?.some((allocation) => allocation.status === "waitlisted") ?? false;
  const isPartiallyWaitlisted = !!currentLicense && hasWaitlistedAllocation;
  const isWaitlisted = currentLicenseRequest?.status === "waitlisted";
  const canActOnRequest = isPending || isResubmittedRevision;
  const canApprove = canActOnRequest;
  const canPrint = !!selectedLicensePreview && !isPdfDataUrl(selectedLicensePreview ?? "");

  // Carteirinha já criada: só faz sentido reimprimir. Sem rota, recusar ou aprovar.
  if (currentLicense) {
    return (
      <div className="border-t border-outline-variant bg-surface-container-lowest pt-3 pb-4 px-4 space-y-3">
        {approveMessage && (
          <div
            className={cn(
              "rounded-xl border p-3 text-xs",
              approveMessageIsError
                ? "border-error/40 bg-error/5 text-error"
                : "border-success/40 bg-success/5 text-success",
            )}
          >
            {approveMessage}
          </div>
        )}
        {isPartiallyWaitlisted && (
          <p className="rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            Parcialmente na fila de espera. Alguns dias/períodos aguardam vagas.
          </p>
        )}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="md"
            icon={<Printer className="size-4" />}
            disabled={!canPrint || printingSingle}
            loading={printingSingle}
            onClick={onPrintSingle}
          >
            Impressão única
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-outline-variant bg-surface-container-lowest pt-3 pb-4 px-4 space-y-3">
      <div>
        <p className="text-xs text-on-surface-variant">
          A universidade e os ônibus da carteirinha serão derivados da solicitação aprovada.
        </p>
        {isWaitlisted && (
          <p className="mt-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
            Na fila de espera. A aprovação fica disponível após promoção para pendente.
          </p>
        )}
      </div>

      {currentLicenseRequest?.cardNote && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-on-surface space-y-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            Observação da aprovação
          </p>
          <p>{currentLicenseRequest.cardNote}</p>
        </div>
      )}

      {approveMessage && (
        <div
          className={cn(
            "rounded-xl border p-3 text-xs",
            approveMessageIsError
              ? "border-error/40 bg-error/5 text-error"
              : "border-success/40 bg-success/5 text-success",
          )}
        >
          {approveMessage}
        </div>
      )}

      <div className="border-t border-outline-variant/60" />

      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          size="md"
          icon={<XCircle className="size-4" />}
          disabled={!canActOnRequest}
          onClick={onRejectOpen}
          className="text-error border-error/40 hover:bg-error/5"
        >
          Recusar
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<ClipboardCheck className="size-4" />}
          disabled={!canActOnRequest}
          onClick={onRevisionOpen}
          className="text-primary border-primary/40 hover:bg-primary/5"
        >
          Solicitar revisão
        </Button>

        {isWaitlisted ? (
          <span className="rounded-full border border-warning/40 bg-warning/10 px-4 py-2 text-xs font-semibold text-warning">
            Na fila de espera
          </span>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={<Bus className="size-4" />}
            loading={approving}
            disabled={!canApprove}
            onClick={onApprove}
          >
            {currentLicense ? "Carteirinha já criada" : "Aprovar e criar"}
          </Button>
        )}
      </div>
    </div>
  );
}
