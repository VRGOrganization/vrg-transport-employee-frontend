import { Printer } from "lucide-react";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

interface PdfPreviewModalProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export function PdfPreviewModal({ pdfUrl, title, onClose }: PdfPreviewModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handlePrint = () => {
    frameRef.current?.contentWindow?.focus();
    frameRef.current?.contentWindow?.print();
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-60 m-0 flex h-full max-h-none w-full max-w-none items-center justify-center bg-black/75 p-4"
      onClose={onClose}
    >
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-surface-container-lowest shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-4 py-3">
          <p className="truncate text-sm font-semibold text-on-surface">{title}</p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Printer className="size-4" />}
              onClick={handlePrint}
            >
              Imprimir
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
        <iframe
          ref={frameRef}
          src={pdfUrl}
          title={title}
          className="h-full w-full border-0 bg-white"
        />
      </div>
    </dialog>
  );
}