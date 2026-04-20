import { Bus, Printer, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isPdfDataUrl } from "@/lib/cardUtils";
import type { LicenseRecord, LicenseRequestRecord } from "@/types/cards.types";

interface ApprovalFooterProps {
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  selectedLicensePreview: string | null;
  selectedBus: string;
  hasInstitution: boolean;
  approving: boolean;
  printingSingle: boolean;
  approveMessage: string;
  onBusChange: (value: string) => void;
  onApprove: () => void;
  onRejectOpen: () => void;
  onPrintSingle: () => void;
  busLocked?: boolean;
}

export function ApprovalFooter({
  currentLicense,
  currentLicenseRequest,
  selectedLicensePreview,
  selectedBus,
  hasInstitution,
  approving,
  printingSingle,
  approveMessage,
  onBusChange,
  onApprove,
  onRejectOpen,
  onPrintSingle,
  busLocked = false,
}: ApprovalFooterProps) {
  const isPending = currentLicenseRequest?.status === "pending";
  const isWaitlisted = currentLicenseRequest?.status === "waitlisted";
  const canApprove = isPending && hasInstitution && !!selectedBus.trim();
  const canPrint =
    !!selectedLicensePreview && !isPdfDataUrl(selectedLicensePreview ?? "");

  return (
    <div className="border-t border-outline-variant bg-surface-container-lowest pt-3 pb-4 px-4 space-y-3">
      <div>
        <label className="mb-2 block text-sm font-semibold text-on-surface">
          Linha de ônibus para a carteirinha
        </label>
        <input
          value={selectedBus}
          onChange={(e) => onBusChange(e.target.value)}
          placeholder="Ex.: 205"
          maxLength={10}
          disabled={!isPending || busLocked}
          readOnly={busLocked}
          className={`h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary ${busLocked ? 'opacity-80 cursor-not-allowed' : ''}`}
        />
        {/* Mensagem de aviso removida conforme solicitado; campo permanece bloqueado quando `busLocked` for true. */}
        <p className="mt-1 text-[11px] text-on-surface-variant">
          Esse valor será usado no campo de ônibus da carteirinha.
        </p>
        {isWaitlisted && (
          <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Na fila de espera{currentLicenseRequest?.filaPosition ? ` (posição ${currentLicenseRequest.filaPosition})` : ""}. A aprovação fica disponível após promoção para pendente.
          </p>
        )}
      </div>

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
          icon={<Printer className="h-4 w-4" />}
          disabled={!canPrint || printingSingle}
          loading={printingSingle}
          onClick={onPrintSingle}
        >
          Impressão única
        </Button>

        <Button
          variant="outline"
          size="md"
          icon={<XCircle className="h-4 w-4" />}
          disabled={!isPending}
          onClick={onRejectOpen}
          className="text-error border-error/40 hover:bg-error/5"
        >
          Recusar
        </Button>

        {isWaitlisted ? (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-semibold text-amber-700">
            Na fila de espera{currentLicenseRequest?.filaPosition ? ` - posição ${currentLicenseRequest.filaPosition}` : ""}
          </span>
        ) : (
          <Button
            variant="primary"
            size="md"
            icon={<Bus className="h-4 w-4" />}
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