import { DocumentPreview } from "@/components/cards/CardPageComponents";
import type { PreviewItem } from "@/types/cards.types";

interface DocumentsGridProps {
  licenseItems: PreviewItem[];
  personalItems: PreviewItem[];
  loadingImages: boolean;
  onOpenLightbox: (index: number) => void;
}

export function DocumentsGrid({
  licenseItems,
  personalItems,
  loadingImages,
  onOpenLightbox,
}: DocumentsGridProps) {
  const allItems = [...licenseItems, ...personalItems];

  return (
    <div className="space-y-5">
      {licenseItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-on-surface">
            Documentos da Solicitação
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {licenseItems.map((item) => {
              const index = allItems.indexOf(item);
              return (
                <DocumentPreview
                  key={item.title}
                  title={item.title}
                  dataUrl={item.dataUrl}
                  loading={item.title !== "Preview da Carteirinha" && loadingImages}
                  onOpen={item.dataUrl ? () => onOpenLightbox(index) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}

      {personalItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-on-surface">
            Documentos Pessoais
          </h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {personalItems.map((item) => {
              const index = allItems.indexOf(item);
              return (
                <DocumentPreview
                  key={item.title}
                  title={item.title}
                  dataUrl={item.dataUrl}
                  loading={loadingImages}
                  onOpen={item.dataUrl ? () => onOpenLightbox(index) : undefined}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
