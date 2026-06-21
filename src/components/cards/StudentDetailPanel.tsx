import { Eye, History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageLightbox, DocumentPreview } from "@/components/cards/CardPageComponents";
import { http } from "@/services/http";
import { PanelCard } from "@/components/ui/PanelCard";
import type {
  ImageRecord,
  LicenseRecord,
  LicenseRequestRecord,
  PhotoType,
  PreviewItem,
  StudentRecord,
} from "@/types/cards.types";
import { AllocationSummaryCard } from "./AllocationSummaryCard";
import { ApprovalFooter } from "./ApprovalFooter";
import { DocumentsGrid } from "./DocumentsGrid";
import { ImageHistoryDrawer } from "./ImageHistoryDrawer";
import { LicenseDetailsCard } from "./LicenseDetailsCard";
import { PriorityBadge } from "./PriorityBadge";
import { StudentInfoCard } from "./StudentInfoCard";
import { UpdateRequestDiff } from "./UpdateRequestDiff";

interface StudentDetailPanelProps {
  selected: StudentRecord | null;
  selectedImages: ImageRecord[];
  loadingSelected: boolean;
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  pendingImagesByType: Partial<Record<PhotoType, string>>;
  profileImage: string | null;
  enrollmentImage: string | null;
  scheduleImage: string | null;
  academicPeriodImage: string | null;
  governmentImage: string | null;
  proofOfResidenceImage: string | null;
  selectedLicensePreview: string | null;
  fullLicense?: LicenseRecord | null;
  onReload: () => Promise<void>;
  onOpenRejectModal: () => void;
  printingSingle: boolean;
  onPrintSingle: () => void;
  /** Mostra o diff "antes/depois" dos documentos. Só na aba Revisão. */
  showUpdateDiff?: boolean;
}

export function StudentDetailPanel({
  selected,
  selectedImages,
  loadingSelected,
  currentLicense,
  currentLicenseRequest,
  pendingImagesByType,
  profileImage,
  enrollmentImage,
  scheduleImage,
  academicPeriodImage,
  governmentImage,
  proofOfResidenceImage,
  selectedLicensePreview,
  fullLicense,
  onReload,
  onOpenRejectModal,
  printingSingle,
  onPrintSingle,
  showUpdateDiff = false,
}: StudentDetailPanelProps) {
  const [approving, setApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    setHistoryOpen(false);
  }, [selected?._id]);

  const cardPreviewItem = useMemo<PreviewItem | null>(
    () =>
      selectedLicensePreview
        ? { title: "Preview da Carteirinha", dataUrl: selectedLicensePreview }
        : null,
    [selectedLicensePreview],
  );

  const licensePreviewItems = useMemo<PreviewItem[]>(
    () => [
      { title: "Foto 3x4", dataUrl: profileImage },
      { title: "Comprovante de Matrícula", dataUrl: enrollmentImage },
      { title: "Imagem da Grade Horária", dataUrl: scheduleImage },
      { title: "Calendário Acadêmico", dataUrl: academicPeriodImage },
    ],
    [profileImage, enrollmentImage, scheduleImage, academicPeriodImage],
  );

  const personalPreviewItems = useMemo<PreviewItem[]>(
    () => [
      { title: "Documento de identidade", dataUrl: governmentImage },
      { title: "Comprovante de residência", dataUrl: proofOfResidenceImage },
    ],
    [governmentImage, proofOfResidenceImage],
  );

  const previewItems = useMemo(
    () => [
      ...(cardPreviewItem ? [cardPreviewItem] : []),
      ...licensePreviewItems,
      ...personalPreviewItems,
    ],
    [cardPreviewItem, licensePreviewItems, personalPreviewItems],
  );

  const availablePreviewIndexes = useMemo(
    () => previewItems.map((item, i) => (item.dataUrl ? i : -1)).filter((i) => i >= 0),
    [previewItems],
  );

  const handleApprove = async () => {
    if (!selected || approving || !currentLicenseRequest) return;
    if (currentLicenseRequest.status !== "pending") {
      setApproveMessage("A solicitação ainda não está apta para aprovação.");
      return;
    }
    setApproving(true);
    setApproveMessage("");
    try {
      await http.patch(`/license-request/${currentLicenseRequest._id}/approve`, {
        ...(profileImage ? { photo: profileImage } : {}),
      });
      setApproveMessage("Carteirinha criada com sucesso.");
      await onReload();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setApproveMessage(e.message ?? "Falha ao criar a carteirinha.");
    } finally {
      setApproving(false);
    }
  };

  if (!selected) {
    return (
      <PanelCard as="section" className="relative h-full min-h-0 md:p-5 flex flex-col">
        <div className="flex flex-1 min-h-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface text-center text-on-surface-variant">
          <Eye className="size-8" />
          <p className="font-medium">Selecione um aluno para revisar.</p>
          <p className="max-w-xs text-xs">
            Você verá documentos, informações acadêmicas e poderá aprovar a criação da
            carteirinha.
          </p>
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard as="section" className="relative h-full min-h-0 md:p-5 flex flex-col">
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pb-4 pr-1">
          <StudentInfoCard student={selected} currentLicense={currentLicense} />

          <div className="flex justify-end">
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-surface-container-high"
            >
              <History className="size-3.5" />
              Histórico de documentos
            </button>
          </div>

          {(fullLicense ?? currentLicense) && (
            <LicenseDetailsCard license={(fullLicense ?? currentLicense)!} />
          )}

          {/* ── Bloco de prioridade e alocação ─────────────────── */}
          {currentLicenseRequest &&
            (currentLicenseRequest.priorityLevel != null ||
              (currentLicenseRequest.allocationSummary?.length ?? 0) > 0) && (
              <div className="space-y-2">
                {currentLicenseRequest.priorityLevel != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant">Prioridade:</span>
                    <PriorityBadge
                      level={currentLicenseRequest.priorityLevel}
                      ruleName={currentLicenseRequest.priorityRuleName}
                    />
                  </div>
                )}

                {currentLicenseRequest.allocationSummary &&
                  currentLicenseRequest.allocationSummary.length > 0 && (
                    <AllocationSummaryCard
                      allocations={currentLicenseRequest.allocationSummary}
                      transportMode={currentLicenseRequest.transportMode}
                    />
                  )}
              </div>
            )}
          {/* ─────────────────────────────────────────────────────── */}

          <div className="border-t border-outline-variant/20" />

          {showUpdateDiff && currentLicenseRequest && (
            <UpdateRequestDiff
              request={currentLicenseRequest}
              savedImages={selectedImages}
              pendingImagesByType={pendingImagesByType}
              loadingImages={loadingSelected}
            />
          )}

          {cardPreviewItem && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-on-surface">
                Preview da Carteirinha
              </h3>
              <DocumentPreview
                title="Preview da Carteirinha"
                dataUrl={cardPreviewItem.dataUrl}
                loading={false}
                onOpen={
                  cardPreviewItem.dataUrl
                    ? () => setLightboxIndex(previewItems.indexOf(cardPreviewItem))
                    : undefined
                }
              />
            </div>
          )}

          <DocumentsGrid
            licenseItems={licensePreviewItems}
            personalItems={personalPreviewItems}
            loadingImages={loadingSelected}
            onOpenLightbox={setLightboxIndex}
          />
        </div>

        <ApprovalFooter
          currentLicense={currentLicense}
          currentLicenseRequest={currentLicenseRequest}
          selectedLicensePreview={selectedLicensePreview}
          approving={approving}
          printingSingle={printingSingle}
          approveMessage={approveMessage}
          onApprove={handleApprove}
          onRejectOpen={onOpenRejectModal}
          onPrintSingle={onPrintSingle}
        />
      </div>

      {lightboxIndex !== null && previewItems[lightboxIndex]?.dataUrl && (
        <ImageLightbox
          items={previewItems}
          availableIndexes={availablePreviewIndexes}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}

      {historyOpen && (
        <ImageHistoryDrawer
          studentId={selected._id}
          studentName={selected.name}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </PanelCard>
  );
}
