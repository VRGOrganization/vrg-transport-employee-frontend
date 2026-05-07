import { useState, useEffect } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { Student } from "@/types/student";
import { LicenseRecord } from "@/types/cards.types";
import { extractLicenseImage, buildCardsPdfUrl } from "@/lib/cardUtils";
import { Button } from "@/components/ui/Button";
import { Printer, Download, X } from "lucide-react";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";

interface StudentCardModalProps {
  student: Student;
  onClose: () => void;
}

export function StudentCardModal({ student, onClose }: StudentCardModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchLicense() {
      try {
        const license = await employeeApi.get<LicenseRecord>(
          `/license/searchByStudent/${student._id}`
        );
        if (cancelled) return;
        const img = extractLicenseImage(license);
        if (img) {
          setImage(img);
        } else {
          setError("A carteirinha ainda não foi gerada ou não possui imagem.");
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(
          err.status === 404
            ? "A carteirinha deste aluno ainda não foi solicitada ou aprovada."
            : "Falha ao carregar carteirinha."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLicense();
    return () => {
      cancelled = true;
    };
  }, [student._id]);

  const handlePrint = async () => {
    if (!image) return;
    try {
      const pdfUrl = await buildCardsPdfUrl(
        [{ studentName: student.name, imageData: image }],
        `Carteirinha - ${student.name}`
      );
      setPdfPreviewUrl(pdfUrl);
    } catch (err) {
      console.error(err);
      alert("Falha ao gerar PDF.");
    }
  };

  const handleDownload = () => {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image;
    a.download = `carteirinha-${student.name
      .replace(/\s+/g, "-")
      .toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-surface rounded-2xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-outline-variant/30">
            <div>
              <h2 className="text-xl font-bold text-on-surface tracking-tight">
                Carteirinha
              </h2>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {student.name}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 flex-1 overflow-y-auto flex flex-col items-center justify-center min-h-[400px] bg-surface-container-lowest">
            {loading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
                  className="w-full h-auto object-contain rounded-lg"
                  style={{ maxHeight: "70vh" }}
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
              icon={<Download className="w-4 h-4" />}
            >
              Baixar Carteirinha
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={!image}
              icon={<Printer className="w-4 h-4" />}
            >
              Imprimir Carteirinha
            </Button>
          </div>
        </div>
      </div>

      {pdfPreviewUrl && (
        <PdfPreviewModal
          pdfUrl={pdfPreviewUrl}
          title={`Carteirinha - ${student.name}`}
          onClose={() => setPdfPreviewUrl(null)}
        />
      )}
    </>
  );
}
