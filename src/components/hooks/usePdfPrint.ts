import { useCallback, useEffect, useRef, useState } from "react";
import { buildCardsPdfUrl, isPdfDataUrl, normalizeMediaSource, PrintableCard } from "@/lib/cardUtils";
import { LicenseRecord, StudentRecord } from "@/types/cards.types";


interface UsePdfPrintReturn {
  pdfPreviewUrl: string | null;
  pdfPreviewTitle: string;
  pdfFrameRef: React.RefObject<HTMLIFrameElement  | null >; 
  printingSingle: boolean;
  printingBatch: boolean;
  selectedForBatch: string[];
  openPdfPreview: (url: string, title: string) => void;
  closePdfPreview: () => void;
  handlePrintFromPreview: () => void;
  toggleBatchSelection: (studentId: string) => void;
  handlePrintSingle: (
    selected: StudentRecord | null,
    printableCardsByStudentId: Map<string, PrintableCard>,
    onError: (msg: string) => void,
  ) => Promise<void>;
  handlePrintBatch: (
    printableCardsByStudentId: Map<string, PrintableCard>,
    onError: (msg: string) => void,
  ) => Promise<void>;
  buildPrintableMap: (licenses: LicenseRecord[], students: StudentRecord[]) => Map<string, PrintableCard>;
}

export function usePdfPrint(): UsePdfPrintReturn {
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Preview de impressão");
  const [printingSingle, setPrintingSingle] = useState(false);
  const [printingBatch, setPrintingBatch] = useState(false);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const pdfFrameRef = useRef<HTMLIFrameElement>(null);

  const closePdfPreview = useCallback(() => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    setPdfPreviewUrl(null);
  }, [pdfPreviewUrl]);

  const openPdfPreview = useCallback((url: string, title: string) => {
    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
    setPdfPreviewTitle(title);
  }, []);

  const handlePrintFromPreview = useCallback(() => {
    pdfFrameRef.current?.contentWindow?.focus();
    pdfFrameRef.current?.contentWindow?.print();
  }, []);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const toggleBatchSelection = useCallback((studentId: string) => {
    setSelectedForBatch((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  }, []);

  const buildPrintableMap = useCallback(
    (licenses: LicenseRecord[], students: StudentRecord[]): Map<string, PrintableCard> => {
      const map = new Map<string, PrintableCard>();
      for (const license of licenses) {
        const imageData = normalizeMediaSource(license.imageLicense);
        if (!imageData || isPdfDataUrl(imageData)) continue;
        const student = students.find((s) => s._id === license.studentId);
        map.set(license.studentId, {
          studentName: student?.name ?? `Aluno ${license.studentId}`,
          imageData,
        });
      }
      return map;
    },
    [],
  );

  const handlePrintSingle = useCallback(
    async (
      selected: StudentRecord | null,
      printableCardsByStudentId: Map<string, PrintableCard>,
      onError: (msg: string) => void,
    ) => {
      if (!selected) {
        onError("Selecione um aluno aprovado para imprimir.");
        return;
      }
      const printable = printableCardsByStudentId.get(selected._id);
      if (!printable) {
        onError("Carteirinha indisponível para impressão deste aluno.");
        return;
      }
      setPrintingSingle(true);
      try {
        const pdfUrl = await buildCardsPdfUrl([printable], `Carteirinha - ${printable.studentName}`);
        openPdfPreview(pdfUrl, `Carteirinha - ${printable.studentName}`);
      } catch {
        onError("Falha ao gerar PDF de impressão.");
      } finally {
        setPrintingSingle(false);
      }
    },
    [openPdfPreview],
  );

  const handlePrintBatch = useCallback(
    async (
      printableCardsByStudentId: Map<string, PrintableCard>,
      onError: (msg: string) => void,
    ) => {
      if (selectedForBatch.length === 0) {
        onError("Selecione pelo menos uma carteirinha aprovada para impressão em lote.");
        return;
      }
      const cards = selectedForBatch
        .map((id) => printableCardsByStudentId.get(id) ?? null)
        .filter((item): item is PrintableCard => !!item);
      if (cards.length === 0) {
        onError("Nenhuma carteirinha selecionada está disponível para impressão.");
        return;
      }
      setPrintingBatch(true);
      try {
        const pdfUrl = await buildCardsPdfUrl(cards, `Carteirinhas em lote (${cards.length})`);
        openPdfPreview(pdfUrl, `Carteirinhas em lote (${cards.length})`);
      } catch {
        onError("Falha ao gerar PDF em lote.");
      } finally {
        setPrintingBatch(false);
      }
    },
    [selectedForBatch, openPdfPreview],
  );

  return {
    pdfPreviewUrl,
    pdfPreviewTitle,
    pdfFrameRef,
    printingSingle,
    printingBatch,
    selectedForBatch,
    openPdfPreview,
    closePdfPreview,
    handlePrintFromPreview,
    toggleBatchSelection,
    handlePrintSingle,
    handlePrintBatch,
    buildPrintableMap,
  };
}