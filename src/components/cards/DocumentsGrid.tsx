import { DocumentPreview } from "@/components/cards/CardPageComponents";
import type { PreviewItem } from "@/types/cards.types";

interface DocumentsGridProps {
  items: PreviewItem[];
  loadingImages: boolean;
  onOpenLightbox: (index: number) => void;
}

export function DocumentsGrid({ items, loadingImages, onOpenLightbox }: DocumentsGridProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-on-surface">Documentos enviados</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <DocumentPreview
            key={item.title}
            title={item.title}
            dataUrl={item.dataUrl}
            loading={item.title !== "Preview da Carteirinha" && loadingImages}
            onOpen={item.dataUrl ? () => onOpenLightbox(index) : undefined}
          />
        ))}
      </div>
    </div>
  );
}