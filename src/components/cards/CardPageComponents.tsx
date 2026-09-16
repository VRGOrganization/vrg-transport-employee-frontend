import { type ComponentType, type ReactNode, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  Loader2,
  Maximize2,
  X,
} from "lucide-react";
import { downloadMedia, getDownloadName, isPdfDataUrl } from "@/lib/cardUtils";
import { PanelCard } from "@/components/ui/PanelCard";
import { ModalOverlayPortal } from "@/components/ui/ModalOverlayPortal";
import { useModalA11y } from "@/hooks/ui/useModalA11y";
import { overlaySpring } from "@/lib/motion";

export function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-lg px-3 py-1.5 font-medium transition ${
        active
          ? "bg-surface-container-lowest text-on-surface shadow"
          : "text-on-surface-variant hover:text-on-surface"
      }`}
    >
      {children}
    </button>
  );
}

export function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <PanelCard>
      <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
        <Icon className="size-4 text-primary" />
      </div>
      <p className="text-xl font-bold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </PanelCard>
  );
}

export function DocumentPreview({
  title,
  dataUrl,
  loading,
  onOpen,
}: {
  title: string;
  dataUrl: string | null;
  loading: boolean;
  onOpen?: () => void;
}) {
  const isPdf = isPdfDataUrl(dataUrl);

  return (
    <div className="rounded-xl border border-outline-variant bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-on-surface">{title}</p>
        {dataUrl && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => void downloadMedia(dataUrl, getDownloadName(title, dataUrl))}
              className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface hover:bg-surface-container"
            >
              <Download className="size-3.5" />
              Baixar
            </button>
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface hover:bg-surface-container"
              >
                <Maximize2 className="size-3.5" />
                Ampliar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low md:h-56">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-on-surface-variant" />
        ) : dataUrl ? (
          <>
            {isPdf ? (
              <div className="h-full w-full bg-white">
                <iframe src={dataUrl} title={title} className="h-full w-full" />
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={title} className="h-full w-full object-contain" />
            )}

            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-1 text-[11px] text-white hover:bg-black/75"
              >
                <Eye className="size-3.5" />
                {isPdf ? "Ler melhor" : "Ver melhor"}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-on-surface-variant">
            <FileImage className="size-5" />
            <span className="text-[11px]">Sem arquivo</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function ImageLightbox({
  items,
  availableIndexes,
  currentIndex,
  onClose,
  onNavigate,
}: {
  items: Array<{ title: string; dataUrl: string | null }>;
  availableIndexes: number[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const currentPos = availableIndexes.indexOf(currentIndex);
  const canNavigate = availableIndexes.length > 1;
  const item = items[currentIndex];
  const currentIsPdf = isPdfDataUrl(item?.dataUrl ?? null);

  useModalA11y(panelRef, onClose);

  const goPrev = () => {
    if (!canNavigate || currentPos < 0) return;
    const prevPos = (currentPos - 1 + availableIndexes.length) % availableIndexes.length;
    onNavigate(availableIndexes[prevPos]);
  };

  const goNext = () => {
    if (!canNavigate || currentPos < 0) return;
    const nextPos = (currentPos + 1) % availableIndexes.length;
    onNavigate(availableIndexes[nextPos]);
  };

  if (!item?.dataUrl) return null;

  return (
    <ModalOverlayPortal>
      <motion.div
        className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-black/80 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={item.title}
        tabIndex={-1}
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
        transition={shouldReduceMotion ? { duration: 0 } : overlaySpring}
        className="relative flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-white/20 bg-black/60 p-3 md:p-4 outline-none"
      >
        <div className="flex items-center justify-between gap-2 text-white">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-white/70">Clique na miniatura para trocar de documento.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void downloadMedia(item.dataUrl, getDownloadName(item.title, item.dataUrl))}
              className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            >
              <Download className="size-3.5" />
              Baixar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 p-2 hover:bg-white/20"
              aria-label="Fechar visualização"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="relative flex h-[55vh] min-h-80 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-black/30">
          {currentIsPdf ? (
            <div className="h-full w-full bg-white">
              <iframe src={item.dataUrl} title={item.title} className="h-full w-full" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.dataUrl} alt={item.title} className="h-full w-full object-contain" />
          )}

          {canNavigate && (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-2 inline-flex items-center justify-center rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                aria-label="Imagem anterior"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 inline-flex items-center justify-center rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="size-5" />
              </button>
            </>
          )}
        </div>

        {currentIsPdf && (
          <div className="flex justify-end">
            <a
              href={item.dataUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            >
              <ExternalLink className="size-3.5" />
              Abrir PDF em nova aba
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {items.map((preview, index) => {
            const isActive = index === currentIndex;
            const hasData = !!preview.dataUrl;

            return (
              <button
                key={preview.title}
                type="button"
                disabled={!hasData}
                onClick={() => onNavigate(index)}
                className={`rounded-lg border p-1 text-left transition ${
                  isActive
                    ? "border-white bg-white/20"
                    : hasData
                    ? "border-white/30 bg-white/5 hover:bg-white/15"
                    : "border-white/10 bg-white/5 opacity-50"
                }`}
              >
                <div className="mb-1 line-clamp-1 text-[11px] text-white/85">{preview.title}</div>
                <div className="flex h-20 items-center justify-center overflow-hidden rounded border border-white/20 bg-black/40">
                  {hasData ? (
                    isPdfDataUrl(preview.dataUrl) ? (
                      <FileText className="size-4 text-white/70" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview.dataUrl!} alt={preview.title} className="h-full w-full object-cover" />
                    )
                  ) : (
                    <FileImage className="size-4 text-white/40" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
      </motion.div>
    </ModalOverlayPortal>
  );
}
