export type PrintableImageFormat = "JPEG" | "PNG" | "WEBP";

export interface PrintableCard {
  studentName: string;
  imageData: string;
}

export function detectMimeFromBase64(base64Value: string): string {
  const normalized = base64Value.replace(/\s/g, "");

  if (normalized.startsWith("JVBERi0")) return "application/pdf";
  if (normalized.startsWith("iVBORw0KGgo")) return "image/png";
  if (normalized.startsWith("/9j/")) return "image/jpeg";
  if (normalized.startsWith("UklGR")) return "image/webp";

  return "image/jpeg";
}

export function normalizeMediaSource(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    /^https?:\/\//i.test(trimmed)
  ) {
    return trimmed;
  }

  const mimeType = detectMimeFromBase64(trimmed);
  return `data:${mimeType};base64,${trimmed}`;
}

export function extractLicenseImage(data: {
  imageLicense?: string;
  image?: string;
  licenseImage?: string;
  studentCard?: string;
} | null | undefined): string | null {
  if (!data) return null;
  return normalizeMediaSource(
    data.imageLicense ?? data.image ?? data.licenseImage ?? data.studentCard ?? null,
  );
}

export function isPdfDataUrl(value: string | null): boolean {
  const normalized = normalizeMediaSource(value);
  if (!normalized) return false;

  return (
    normalized.startsWith("data:application/pdf") || /\.pdf(\?|#|$)/i.test(normalized)
  );
}

export function getDownloadName(title: string, value: string | null): string {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!value) return `${slug || "documento"}.bin`;
  if (isPdfDataUrl(value)) return `${slug || "documento"}.pdf`;
  return `${slug || "documento"}.jpg`;
}

export function getImageFormatFromDataUrl(dataUrl: string): PrintableImageFormat {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

export async function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    };
    img.onerror = () => reject(new Error("Falha ao ler imagem para PDF"));
    img.src = dataUrl;
  });
}

export async function buildCardsPdfUrl(cards: PrintableCard[], _title: string): Promise<string> {
  void _title;
  const [{ jsPDF }] = await Promise.all([
    import("jspdf"),
    Promise.all(cards.map((card) => getImageSize(card.imageData))),
  ]);

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 2;

  const cardW = 171.2;
  const cardH = 53.98;
  const cutLineGap = 3;
  const blockHeight = cardH + cutLineGap;

  const offsetX = (pageWidth - cardW) / 2;
  let y = margin;

  cards.forEach((card, index) => {
    if (index > 0 && y + cardH > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }

    doc.addImage(
      card.imageData,
      getImageFormatFromDataUrl(card.imageData),
      offsetX,
      y,
      cardW,
      cardH,
      undefined,
      "FAST",
    );

    if (index < cards.length - 1) {
      const cutY = y + cardH + cutLineGap / 2;
      doc.setDrawColor(107, 114, 128);
      doc.setLineDashPattern([1.5, 1.5], 0);
      doc.setLineWidth(0.2);
      doc.line(margin, cutY, pageWidth - margin, cutY);
      doc.setLineDashPattern([], 0);
    }

    y += blockHeight;
  });

  const pdfBlob = doc.output("blob");
  return URL.createObjectURL(pdfBlob);
}
