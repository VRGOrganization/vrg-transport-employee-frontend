import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DocumentPreview } from "@/components/cards/CardPageComponents";
import type { PreviewItem } from "@/types/cards.types";

interface DocumentsGridProps {
  /** Lista completa e ordenada usada pelo lightbox (StudentDetailPanel.previewItems) —
   *  os índices abertos precisam bater com essa ordem, não com a montada localmente aqui. */
  previewItems: PreviewItem[];
  licenseItems: PreviewItem[];
  personalItems: PreviewItem[];
  loadingImages: boolean;
  onOpenLightbox: (index: number) => void;
  /** Nome civil, mostrado junto aos documentos pessoais pra conferência
   *  contra o documento de identidade — mesmo quando há nome social. */
  civilName?: string;
}

function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="px-4 py-3 space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full group cursor-pointer"
      >
        <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
        <ChevronDown
          className={`size-4 text-on-surface-variant transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && children}
    </div>
  );
}

export function DocumentsGrid({
  previewItems,
  licenseItems,
  personalItems,
  loadingImages,
  onOpenLightbox,
  civilName,
}: DocumentsGridProps) {
  return (
    <div className="rounded-xl border border-outline-variant/40 divide-y divide-outline-variant/40 overflow-hidden">
      {personalItems.length > 0 && (
        <CollapsibleSection title="Documentos Pessoais">
          {civilName && (
            <p className="text-xs font-medium text-on-surface-variant -mt-1">
              Nome de registro: {civilName}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {personalItems.map((item) => {
              const index = previewItems.indexOf(item);
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
        </CollapsibleSection>
      )}

      {licenseItems.length > 0 && (
        <CollapsibleSection title="Documentos da Solicitação">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {licenseItems.map((item) => {
              const index = previewItems.indexOf(item);
              return (
                <DocumentPreview
                  key={item.title}
                  title={item.title}
                  dataUrl={item.dataUrl}
                  loading={item.title !== "Prévia da Carteirinha" && loadingImages}
                  onOpen={item.dataUrl ? () => onOpenLightbox(index) : undefined}
                />
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
