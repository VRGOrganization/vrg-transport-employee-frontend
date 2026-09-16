import { Printer } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface PdfPreviewModalProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export function PdfPreviewModal({ pdfUrl, title, onClose }: PdfPreviewModalProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);

  const handlePrint = () => {
    frameRef.current?.contentWindow?.focus();
    frameRef.current?.contentWindow?.print();
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="wide"
      noPadding
      hideClose
      header={
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
      }
    >
      <iframe
        ref={frameRef}
        src={pdfUrl}
        title={title}
        className="h-[75vh] w-full border-0 bg-white"
      />
    </Modal>
  );
}