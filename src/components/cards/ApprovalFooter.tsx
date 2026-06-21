import { Bus, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isPdfDataUrl } from "@/lib/cardUtils";
import type { LicenseRecord, LicenseRequestRecord } from "@/types/cards.types";

interface ApprovalFooterProps {
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  selectedLicensePreview: string | null;
  approving: boolean;
  printingSingle: boolean;
  approveMessage: string;
  onApprove: () => void;
  onRejectOpen: () => void;
  onPrintSingle: () => void;
}

export function ApprovalFooter({
  currentLicense,
  currentLicenseRequest,
  selectedLicensePreview,
  approving,
  printingSingle,
  approveMessage,
  onApprove,
  onRejectOpen,
  onPrintSingle,
}: ApprovalFooterProps) {
  const isPending = currentLicenseRequest?.status === "pending";
  const hasWaitlistedAllocation =
    currentLicenseRequest?.allocationSummary?.some((allocation) => allocation.status === "waitlisted") ?? false;
  const isPartiallyWaitlisted = !!currentLicense && hasWaitlistedAllocation;
  const isWaitlisted = currentLicenseRequest?.status === "waitlisted";
  const canApprove = isPending;
  const canPrint = !!selectedLicensePreview && !isPdfDataUrl(selectedLicensePreview ?? "");

  // Carteirinha já criada: só faz sentido reimprimir. Sem rota, recusar ou aprovar.
  if (currentLicense) {
    return (
      <div className="border-t border-outline-variant bg-surface-container-lowest pt-3 pb-4 px-4 space-y-3">
        {approveMessage && (
          <div className="rounded-xl border border-outline-variant bg-surface p-3 text-xs text-on-surface">
            {approveMessage}
          </div>
        )}
        {isPartiallyWaitlisted && (
          <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
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
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            {`Na fila de espera${currentLicenseRequest?.filaPosition ? ` (posição ${currentLicenseRequest.filaPosition})` : ""}. A aprovação fica disponível após promoção para pendente.`}
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
        <div className="rounded-xl border border-outline-variant bg-surface p-3 text-xs text-on-surface">
          {approveMessage}
        </div>
      )}

      <div className="border-t border-outline-variant/60" />

      <div className="flex flex-wrap justify-end gap-2">
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

        <Button
          variant="outline"
          size="md"
          icon={<XCircle className="size-4" />}
          disabled={!isPending}
          onClick={onRejectOpen}
          className="text-error border-error/40 hover:bg-error/5"
        >
          Recusar
        </Button>

        {isWaitlisted ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            {`Na fila de espera${currentLicenseRequest?.filaPosition ? ` - posição ${currentLicenseRequest.filaPosition}` : ""}`}
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
