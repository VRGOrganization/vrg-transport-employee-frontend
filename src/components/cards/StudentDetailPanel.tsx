import { ChevronDown, Eye, History } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ImageLightbox, DocumentPreview } from "@/components/cards/CardPageComponents";
import { http } from "@/services/http";
import { PanelCard } from "@/components/ui/PanelCard";
import {
  PHOTO_TYPE_LABELS,
  REVISION_FIELD_LABELS,
  type ImageRecord,
  type LicenseRecord,
  type LicenseRequestRecord,
  type PhotoType,
  type PreviewItem,
  type RevisionFieldKey,
  type StudentRecord,
} from "@/types/cards.types";
import { resolveDisplayName } from "@/lib/utils/string";
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
  secondaryEnrollmentImage: string | null;
  secondaryScheduleImage: string | null;
  secondaryAcademicPeriodImage: string | null;
  governmentImage: string | null;
  proofOfResidenceImage: string | null;
  transportCardProofImage: string | null;
  alreadyUsesTransport: boolean;
  disabilityProofImage: string | null;
  hasDisability: boolean;
  selectedLicensePreview: string | null;
  fullLicense?: LicenseRecord | null;
  onReload: () => Promise<void>;
  onOpenRejectModal: () => void;
  onOpenRevisionModal: () => void;
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
  secondaryEnrollmentImage,
  secondaryScheduleImage,
  secondaryAcademicPeriodImage,
  governmentImage,
  proofOfResidenceImage,
  transportCardProofImage,
  alreadyUsesTransport,
  disabilityProofImage,
  hasDisability,
  selectedLicensePreview,
  fullLicense,
  onReload,
  onOpenRejectModal,
  onOpenRevisionModal,
  printingSingle,
  onPrintSingle,
  showUpdateDiff = false,
}: StudentDetailPanelProps) {
  const [approving, setApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [previaOpen, setPreviaOpen] = useState(true);

  useEffect(() => {
    setHistoryOpen(false);
  }, [selected?._id]);

  const cardPreviewItem = useMemo<PreviewItem | null>(
    () =>
      selectedLicensePreview
        ? { title: "Prévia da Carteirinha", dataUrl: selectedLicensePreview }
        : null,
    [selectedLicensePreview],
  );

  const showTransportCardProof =
    alreadyUsesTransport || transportCardProofImage != null;
  const showDisabilityProof = hasDisability || disabilityProofImage != null;

  // 2ª faculdade: só lista os comprovantes da 2ª quando o aluno tem 2ª matrícula.
  const hasSecondary = Boolean(
    selected?.secondaryInstitution || selected?.secondaryUniversityId,
  );

  const licensePreviewItems = useMemo<PreviewItem[]>(
    () => [
      { title: "Foto 3x4", dataUrl: profileImage },
      { title: "Comprovante de Matrícula", dataUrl: enrollmentImage },
      { title: "Imagem da Grade Horária", dataUrl: scheduleImage },
      { title: "Calendário Acadêmico", dataUrl: academicPeriodImage },
      ...(hasSecondary
        ? [
            {
              title: "Comprovante de Matrícula (2ª faculdade)",
              dataUrl: secondaryEnrollmentImage,
            },
            {
              title: "Imagem da Grade Horária (2ª faculdade)",
              dataUrl: secondaryScheduleImage,
            },
            {
              title: "Calendário Acadêmico (2ª faculdade)",
              dataUrl: secondaryAcademicPeriodImage,
            },
          ]
        : []),
    ],
    [
      profileImage,
      enrollmentImage,
      scheduleImage,
      academicPeriodImage,
      hasSecondary,
      secondaryEnrollmentImage,
      secondaryScheduleImage,
      secondaryAcademicPeriodImage,
    ],
  );

  const personalPreviewItems = useMemo<PreviewItem[]>(
    () => [
      { title: "Documento de identidade", dataUrl: governmentImage },
      { title: "Comprovante de residência", dataUrl: proofOfResidenceImage },
      ...(showTransportCardProof
        ? [
            {
              title: "Carteirinha de Transporte Atual",
              dataUrl: transportCardProofImage,
            },
          ]
        : []),
      ...(showDisabilityProof
        ? [
            {
              title: "Laudo Médico (PCD)",
              dataUrl: disabilityProofImage,
            },
          ]
        : []),
    ],
    [
      governmentImage,
      proofOfResidenceImage,
      showTransportCardProof,
      transportCardProofImage,
      showDisabilityProof,
      disabilityProofImage,
    ],
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
    const isApprovable =
      currentLicenseRequest.status === "pending" ||
      (currentLicenseRequest.status === "revision" &&
        currentLicenseRequest.revisionStage === "resubmitted");
    if (!isApprovable) {
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

          {/* ── Já usa o transporte (declaração do aluno) ────────── */}
          {alreadyUsesTransport && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">
                Já usa o transporte:
              </span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Sim
              </span>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────── */}

          {/* ── PCD (declaração do aluno) ──────────────────────────── */}
          {hasDisability && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant">PCD:</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Sim
              </span>
            </div>
          )}
          {/* ─────────────────────────────────────────────────────── */}

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

          {currentLicenseRequest?.status === "revision" && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs text-on-surface space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Em revisão
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    currentLicenseRequest.revisionStage === "resubmitted"
                      ? "bg-success/15 text-success"
                      : "bg-warning/20 text-warning"
                  }`}
                >
                  {currentLicenseRequest.revisionStage === "resubmitted"
                    ? "Reenviado pelo aluno"
                    : "Aguardando aluno"}
                </span>
              </div>
              {(currentLicenseRequest.changedDocuments?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium">Documentos:</span>{" "}
                  {currentLicenseRequest
                    .changedDocuments!.map((d) => PHOTO_TYPE_LABELS[d as PhotoType] ?? d)
                    .join(", ")}
                </p>
              )}
              {(currentLicenseRequest.revisionFields?.length ?? 0) > 0 && (
                <p>
                  <span className="font-medium">Informações:</span>{" "}
                  {currentLicenseRequest
                    .revisionFields!.map(
                      (f) => REVISION_FIELD_LABELS[f as RevisionFieldKey] ?? f,
                    )
                    .join(", ")}
                </p>
              )}
              {currentLicenseRequest.revisionMessage && (
                <p>
                  <span className="font-medium">Observação:</span>{" "}
                  {currentLicenseRequest.revisionMessage}
                </p>
              )}
            </div>
          )}

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
            <div className="rounded-xl border border-outline-variant/40 overflow-hidden">
              <div className="px-4 py-3 space-y-3">
                <button
                  type="button"
                  onClick={() => setPreviaOpen((v) => !v)}
                  className="flex items-center justify-between w-full cursor-pointer"
                >
                  <h3 className="text-sm font-semibold text-on-surface">
                    Prévia da Carteirinha
                  </h3>
                  <ChevronDown
                    className={`size-4 text-on-surface-variant transition-transform duration-200 ${previaOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {previaOpen && (
                  <DocumentPreview
                    title="Prévia da Carteirinha"
                    dataUrl={cardPreviewItem.dataUrl}
                    loading={false}
                    onOpen={
                      cardPreviewItem.dataUrl
                        ? () => setLightboxIndex(previewItems.indexOf(cardPreviewItem))
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          )}

          <DocumentsGrid
            licenseItems={licensePreviewItems}
            personalItems={personalPreviewItems}
            loadingImages={loadingSelected}
            onOpenLightbox={setLightboxIndex}
            civilName={selected.socialName?.trim() ? selected.name : undefined}
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
          onRevisionOpen={onOpenRevisionModal}
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
          studentName={resolveDisplayName(selected)}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </PanelCard>
  );
}
