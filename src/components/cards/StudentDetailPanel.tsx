import { Eye } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { ImageLightbox } from "@/components/cards/CardPageComponents";
import { employeeApi } from "@/lib/employeeApi";
import { busApi } from "@/lib/universityApi";
import type {
  ImageRecord,
  LicenseRecord,
  LicenseRequestRecord,
  PhotoType,
  PreviewItem,
  StudentRecord,
} from "@/types/cards.types";
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
  const [selectedBus, setSelectedBus] = useState("");
  const [busLocked, setBusLocked] = useState(false);
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
    const normalized = selectedBus.trim();
    if (!normalized) {
      setApproveMessage("Defina a linha de ônibus antes de criar a carteirinha.");
      return;
    }
    setApproving(true);
    setApproveMessage("");
    try {
      await employeeApi.patch(`/license-request/approve/${currentLicenseRequest._id}`, {
        institution: selected.institution,
        bus: normalized,
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

  // When the selected student or their latest license request changes, prefill
  // the bus field if the request contains a busId (snapshot). In that case
  // the field is locked and cannot be edited because the student is already
  // associated with a bus.
  useEffect(() => {
    let cancelled = false;
    setBusLocked(false);
    setSelectedBus("");

    async function resolveBus() {
      const req = currentLicenseRequest;
      if (!req) return;

      const raw = req.busId as unknown;
      if (!raw) return;

      try {
        // raw may be a string (objectId or identifier) or an object with _id
        let id: string | null = null;
        if (typeof raw === "string") {
          id = raw;
        } else if (typeof raw === "object" && raw !== null && "_id" in raw) {
          id = (raw as any)._id as string;
        }

        // If id looks like an ObjectId (24 hex chars) try to find by _id
        // otherwise, treat it as identifier and set directly.
        if (id) {
          const isObjectIdLike = /^[0-9a-fA-F]{24}$/.test(id);
          if (isObjectIdLike) {
            const buses = await busApi.list();
            if (cancelled) return;
            const found = (buses ?? []).find((b) => b._id === id);
            if (found) {
              setSelectedBus(found.identifier ?? "");
              setBusLocked(true);
              return;
            }
          } else {
            // treat id as an identifier string
            setSelectedBus(id);
            setBusLocked(true);
            return;
          }
        }
      } catch {
        // ignore and leave unlocked/default
      }
    }

    void resolveBus();

    return () => {
      cancelled = true;
    };
  }, [currentLicenseRequest, selected]);

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
          selectedBus={selectedBus}
          hasInstitution={!!selected.institution?.trim()}
          approving={approving}
          printingSingle={printingSingle}
          approveMessage={approveMessage}
          onBusChange={setSelectedBus}
          onApprove={handleApprove}
          onRejectOpen={onOpenRejectModal}
          onPrintSingle={onPrintSingle}
            busLocked={busLocked}
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