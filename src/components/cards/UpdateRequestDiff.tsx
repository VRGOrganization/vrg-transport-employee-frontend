import { DocumentPreview } from "@/components/cards/CardPageComponents";
import { normalizeMediaSource } from "@/lib/cardUtils";
import {
  PHOTO_TYPE_LABELS,
  type ImageRecord,
  type LicenseRequestRecord,
  type PhotoType,
} from "@/types/cards.types";

interface UpdateRequestDiffProps {
  request: LicenseRequestRecord;
  savedImages: ImageRecord[];
  pendingImagesByType: Partial<Record<PhotoType, string>>;
  loadingImages: boolean;
}

export function UpdateRequestDiff({
  request,
  savedImages,
  pendingImagesByType,
  loadingImages,
}: UpdateRequestDiffProps) {
  if (request.type !== "update" || request.status !== "pending") return null;

  return (
    <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-3">
      <h3 className="text-sm font-semibold text-on-surface">
        Documentos alterados nesta solicitação
      </h3>

      {request.changedDocuments.length === 0 ? (
        <p className="text-xs text-on-surface-variant">
          Nenhum documento informado nesta solicitação.
        </p>
      ) : (
        <div className="space-y-3">
          {request.changedDocuments.map((docType) => {
            const typed = docType as PhotoType;
            const saved = savedImages.find((img) => img.photoType === typed);

            const previousDataUrl =
              typed === "ProfilePhoto"
                ? normalizeMediaSource(saved?.photo3x4 ?? null)
                : normalizeMediaSource(saved?.documentImage ?? null);

            const newDataUrl = normalizeMediaSource(pendingImagesByType[typed] ?? null);

            return (
              <div
                key={docType}
                className="rounded-xl border border-outline-variant bg-surface p-3 space-y-2"
              >
                <p className="inline-flex items-center rounded-full bg-secondary/15 px-2 py-1 text-[11px] font-semibold text-secondary">
                  {PHOTO_TYPE_LABELS[typed] ?? docType}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <DocumentPreview
                    title="Anterior"
                    dataUrl={previousDataUrl}
                    loading={loadingImages}
                  />
                  <DocumentPreview
                    title="Novo"
                    dataUrl={newDataUrl}
                    loading={loadingImages}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}