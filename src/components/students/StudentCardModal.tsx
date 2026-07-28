import { useState, useEffect, useId, useRef } from "react";
import { http } from "@/services/http";
import { Student } from "@/types/student";
import { resolveDisplayName, toTitleCase } from "@/lib/utils/string";
import { LicenseRecord } from "@/types/cards.types";
import { extractLicenseImage, buildCardsPdfUrl, downloadMedia, getDownloadName } from "@/lib/cardUtils";
import { Button } from "@/components/ui/Button";
import { Printer, Download, X } from "lucide-react";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { useModalA11y } from "@/hooks/ui/useModalA11y";

interface StudentCardModalProps {
  student: Student;
  onClose: () => void;
}

export function StudentCardModal({ student, onClose }: StudentCardModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  useModalA11y(panelRef, onClose);

  useEffect(() => {
    const mountState = { cancelled: false };
    async function fetchLicense() {
      try {
        const license = await http.get<LicenseRecord>(
          `/license/searchByStudent/${student._id}`
        );
        if (mountState.cancelled) return;
        const img = extractLicenseImage(license);
        if (img) {
          setImage(img);
        } else {
          setError("A carteirinha ainda não foi gerada ou não possui imagem.");
        }
      } catch (err: any) {
        if (mountState.cancelled) return;
        setError(
          err.status === 404
            ? "A carteirinha deste aluno ainda não foi solicitada ou aprovada."
            : "Falha ao carregar carteirinha."
        );
      } finally {
        if (!mountState.cancelled) setLoading(false);
      }
    }
    fetchLicense();
    return () => {
      mountState.cancelled = true;
    };
  }, [student._id]);

  const handlePrint = async () => {
    if (!image) return;
    try {
      const displayName = resolveDisplayName(student);
      const pdfUrl = await buildCardsPdfUrl(
        [{ studentName: displayName, imageData: image }],
        `Carteirinha - ${displayName}`
      );
      setPdfPreviewUrl(pdfUrl);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") console.error(err);
      alert("Falha ao gerar PDF.");
    }
  };

  const handleDownload = () => {
    if (!image) return;
    // image pode ser presigned URL ou base64 legado; downloadMedia trata ambos
    // (URL → fetch dos bytes assinados, pois o atributo download é ignorado cross-origin).
    void downloadMedia(image, getDownloadName(`carteirinha ${resolveDisplayName(student)}`, image));
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in zoom-in-95 duration-200">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] outline-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
            <div>
              <h2 id={titleId} className="text-xl font-bold text-on-surface tracking-tight">
                Carteirinha
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {toTitleCase(resolveDisplayName(student))}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar modal"
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center size-8 rounded-full hover:bg-primary/10 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full size-8 border-b-2 border-primary"></div>
                <span className="text-sm text-on-surface-variant">Carregando carteirinha...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-4xl text-error">
                  error
                </span>
                <p className="text-on-surface-variant text-sm max-w-sm">
                  {error}
                </p>
              </div>
            ) : image ? (
              <div className="relative group rounded-xl overflow-hidden shadow-lg border border-outline-variant/20 bg-white p-2 w-full max-w-5xl">
                <img
                  src={image}
                  alt="Carteirinha"
                  className="w-full h-auto object-contain rounded-lg max-h-[70vh]"
                />
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={!image}
              icon={<Download className="size-4" />}
            >
              Baixar Carteirinha
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={!image}
              icon={<Printer className="size-4" />}
            >
              Imprimir Carteirinha
            </Button>
          </div>
        </div>
      </div>

      {pdfPreviewUrl && (
        <PdfPreviewModal
          pdfUrl={pdfPreviewUrl}
          title={`Carteirinha - ${resolveDisplayName(student)}`}
          onClose={() => setPdfPreviewUrl(null)}
        />
      )}
    </>
  );
}
