import { Eye } from "lucide-react";
import { useMemo, useState } from "react";
import { ImageLightbox } from "@/components/cards/CardPageComponents";
import { employeeApi } from "@/lib/employeeApi";
import type {
  ImageRecord,
  LicenseRecord,
  LicenseRequestRecord,
  PhotoType,
  PreviewItem,
  StudentRecord,
} from "@/types/cards.types";
import type { BusRoute } from "@/types/university.types";
import { ApprovalFooter } from "./ApprovalFooter";
import { DocumentsGrid } from "./DocumentsGrid";
import { StudentInfoCard } from "./StudentInfoCard";
import { UpdateRequestDiff } from "./UpdateRequestDiff";

interface StudentDetailPanelProps {
  selected: StudentRecord | null;
  selectedImages: ImageRecord[];
  loadingSelected: boolean;
  currentLicense: LicenseRecord | null;
  currentLicenseRequest: LicenseRequestRecord | null;
  selectedBusRoute: BusRoute | null;
  pendingImagesByType: Partial<Record<PhotoType, string>>;
  profileImage: string | null;
  enrollmentImage: string | null;
  scheduleImage: string | null;
  selectedLicensePreview: string | null;
  onReload: () => Promise<void>;
  onOpenRejectModal: () => void;
  printingSingle: boolean;
  onPrintSingle: () => void;
}

export function StudentDetailPanel({
  selected,
  selectedImages,
  loadingSelected,
  currentLicense,
  currentLicenseRequest,
  selectedBusRoute,
  pendingImagesByType,
  profileImage,
  enrollmentImage,
  scheduleImage,
  selectedLicensePreview,
  onReload,
  onOpenRejectModal,
  printingSingle,
  onPrintSingle,
}: StudentDetailPanelProps) {
  const [approving, setApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const previewItems = useMemo<PreviewItem[]>(() => {
    const base: PreviewItem[] = [
      { title: "Foto 3x4", dataUrl: profileImage },
      { title: "Comprovante de Matrícula", dataUrl: enrollmentImage },
      { title: "Imagem da Grade Horária", dataUrl: scheduleImage },
    ];
    if (selectedLicensePreview) {
      base.push({ title: "Preview da Carteirinha", dataUrl: selectedLicensePreview });
    }
    return base;
  }, [profileImage, enrollmentImage, scheduleImage, selectedLicensePreview]);

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
    if (!selected.institution?.trim()) {
      setApproveMessage("Não é possível criar a carteirinha sem instituição no cadastro.");
      return;
    }
    const selectedRouteId = selectedBusRoute?._id?.trim();
    if (!selectedRouteId) {
      setApproveMessage("Selecione uma rota antes de criar a carteirinha.");
      return;
    }
    setApproving(true);
    setApproveMessage("");
    try {
      await employeeApi.patch(`/license-request/approve/${currentLicenseRequest._id}`, {
        institution: selected.institution,
        busRouteId: selectedRouteId,
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
      <section className="relative h-full min-h-0 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5 flex flex-col">
        <div className="flex flex-1 min-h-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface text-center text-on-surface-variant">
          <Eye className="h-8 w-8" />
          <p className="font-medium">Selecione um aluno para revisar.</p>
          <p className="max-w-xs text-xs">
            Você verá documentos, informações acadêmicas e poderá aprovar a criação da
            carteirinha.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative h-full min-h-0 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5 flex flex-col">
      <div className="flex flex-1 min-h-0 flex-col">
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pb-4 pr-1">
          <StudentInfoCard student={selected} currentLicense={currentLicense} />

          <div className="border-t border-outline-variant/20" />

          {currentLicenseRequest && (
            <UpdateRequestDiff
              request={currentLicenseRequest}
              savedImages={selectedImages}
              pendingImagesByType={pendingImagesByType}
              loadingImages={loadingSelected}
            />
          )}

          <DocumentsGrid
            items={previewItems}
            loadingImages={loadingSelected}
            onOpenLightbox={setLightboxIndex}
          />
        </div>

        <ApprovalFooter
          currentLicense={currentLicense}
          currentLicenseRequest={currentLicenseRequest}
          selectedLicensePreview={selectedLicensePreview}
          selectedBusRouteLabel={selectedBusRoute?.lineNumber ?? ""}
          hasInstitution={!!selected.institution?.trim()}
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
    </section>
  );
}
