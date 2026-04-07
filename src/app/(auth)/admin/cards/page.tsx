"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileImage,
  FileText,
  Download,
  IdCard,
  Loader2,
  Maximize2,
  ExternalLink,
  RefreshCw,
  Search,
  UserRound,
  X,
  Printer,
} from "lucide-react";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { employeeApi } from "@/lib/employeeApi";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type PhotoType = "ProfilePhoto" | "EnrollmentProof" | "CourseSchedule" | "LicenseImage";

interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  telephone?: string;
  institution?: string;
  degree?: string;
  shift?: string;
  bloodType?: string;
  schedule?: Array<{ day: string; period: string }>;
  active: boolean;
}

interface LicenseRecord {
  _id: string;
  studentId: string;
  imageLicense: string;
  status: "active" | "inactive" | "expired";
}

interface LicenseApiResponse {
  _id?: string;
  studentId?: string;
  imageLicense?: string;
  image?: string;
  licenseImage?: string;
  studentCard?: string;
  status?: "active" | "inactive" | "expired";
}

interface ImageRecord {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  photo3x4: string | null;
  documentImage: string | null;
  studentCard: string | null;
}

interface PreviewItem {
  title: string;
  dataUrl: string | null;
}

interface PrintableCard {
  studentName: string;
  imageData: string;
}

type PrintableImageFormat = "JPEG" | "PNG" | "WEBP";

// ── Utilitários ───────────────────────────────────────────────────────────────

function detectMimeFromBase64(base64Value: string): string {
  const normalized = base64Value.replace(/\s/g, "");
  if (normalized.startsWith("JVBERi0")) return "application/pdf";
  if (normalized.startsWith("iVBORw0KGgo")) return "image/png";
  if (normalized.startsWith("/9j/")) return "image/jpeg";
  if (normalized.startsWith("UklGR")) return "image/webp";
  return "image/jpeg";
}

function normalizeMediaSource(value: string | null | undefined): string | null {
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

function extractLicenseImage(data: LicenseApiResponse | null | undefined): string | null {
  if (!data) return null;
  return normalizeMediaSource(
    data.imageLicense ?? data.image ?? data.licenseImage ?? data.studentCard ?? null,
  );
}

function isPdfDataUrl(value: string | null): boolean {
  const normalized = normalizeMediaSource(value);
  if (!normalized) return false;
  return (
    normalized.startsWith("data:application/pdf") || /\.pdf(\?|#|$)/i.test(normalized)
  );
}

function getDownloadName(title: string, value: string | null): string {
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

function getImageFormatFromDataUrl(dataUrl: string): PrintableImageFormat {
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  if (dataUrl.startsWith("data:image/webp")) return "WEBP";
  return "JPEG";
}

async function getImageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth || 1, height: img.naturalHeight || 1 });
    };
    img.onerror = () => reject(new Error("Falha ao ler imagem para PDF"));
    img.src = dataUrl;
  });
}

async function buildCardsPdfUrl(cards: PrintableCard[], title: string): Promise<string> {
  const [{ jsPDF }, imageSizes] = await Promise.all([
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
  const cutLineGap = 1;
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

const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

// ── Página Principal ──────────────────────────────────────────────────────────

export default function AdminCardsPage() {
  const { user, logout } = useEmployeeAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pending" | "all" | "with-card">("pending");

  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageRecord[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [approving, setApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [approvedLicensePreview, setApprovedLicensePreview] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [selectedForBatch, setSelectedForBatch] = useState<string[]>([]);
  const [printingSingle, setPrintingSingle] = useState(false);
  const [printingBatch, setPrintingBatch] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [pdfPreviewTitle, setPdfPreviewTitle] = useState("Preview de impressão");
  const pdfFrameRef = useRef<HTMLIFrameElement | null>(null);

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

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsResponse, licensesResponse] = await Promise.all([
        employeeApi.get<StudentRecord[]>("/student"),
        employeeApi.get<LicenseRecord[]>("/license/all"),
      ]);
      setStudents(studentsResponse);
      setLicenses(licensesResponse);
    } catch {
      setError("Não foi possível carregar os dados de revisão de carteirinhas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const licensedStudentIds = useMemo(() => {
    return new Set(licenses.map((license) => license.studentId));
  }, [licenses]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students
      .filter((student) => student.active)
      .filter((student) => {
        if (filter === "pending") return !licensedStudentIds.has(student._id);
        if (filter === "with-card") return licensedStudentIds.has(student._id);
        return true;
      })
      .filter((student) => {
        if (!normalizedSearch) return true;
        return (
          student.name.toLowerCase().includes(normalizedSearch) ||
          student.email.toLowerCase().includes(normalizedSearch) ||
          (student.institution ?? "").toLowerCase().includes(normalizedSearch)
        );
      });
  }, [students, filter, search, licensedStudentIds]);

  const stats = useMemo(() => {
    const total = students.filter((student) => student.active).length;
    const withCard = students.filter((student) => licensedStudentIds.has(student._id)).length;
    const pending = Math.max(total - withCard, 0);
    return { total, withCard, pending };
  }, [students, licensedStudentIds]);

  const currentLicense = useMemo(() => {
    if (!selected) return null;
    return licenses.find((license) => license.studentId === selected._id) ?? null;
  }, [licenses, selected]);

  const profileImage = normalizeMediaSource(
    selectedImages.find((img) => img.photoType === "ProfilePhoto")?.photo3x4 ?? null,
  );
  const enrollmentImage = normalizeMediaSource(
    selectedImages.find((img) => img.photoType === "EnrollmentProof")?.documentImage ?? null,
  );
  const scheduleImage = normalizeMediaSource(
    selectedImages.find((img) => img.photoType === "CourseSchedule")?.documentImage ?? null,
  );
  const licenseImageFromImages = normalizeMediaSource(
    selectedImages.find((img) => img.photoType === "LicenseImage")?.studentCard ?? null,
  );

  const selectedLicensePreview = useMemo(() => {
    return (
      approvedLicensePreview ??
      extractLicenseImage((currentLicense as unknown as LicenseApiResponse) ?? null) ??
      licenseImageFromImages
    );
  }, [approvedLicensePreview, currentLicense, licenseImageFromImages]);

  const printableCardsByStudentId = useMemo(() => {
    const map = new Map<string, PrintableCard>();
    for (const license of licenses) {
      const imageData = normalizeMediaSource(license.imageLicense);
      if (!imageData || isPdfDataUrl(imageData)) continue;
      const student = students.find((item) => item._id === license.studentId);
      map.set(license.studentId, {
        studentName: student?.name ?? `Aluno ${license.studentId}`,
        imageData,
      });
    }
    return map;
  }, [licenses, students]);

  const previewItems = useMemo<PreviewItem[]>(() => {
    const baseItems: PreviewItem[] = [
      { title: "Foto 3x4", dataUrl: profileImage },
      { title: "Comprovante de Matrícula", dataUrl: enrollmentImage },
      { title: "Imagem da Grade Horária", dataUrl: scheduleImage },
    ];
    if (selectedLicensePreview) {
      baseItems.push({ title: "Preview da Carteirinha", dataUrl: selectedLicensePreview });
    }
    return baseItems;
  }, [profileImage, enrollmentImage, scheduleImage, selectedLicensePreview]);

  const availablePreviewIndexes = useMemo(() => {
    return previewItems
      .map((item, index) => (item.dataUrl ? index : -1))
      .filter((index) => index >= 0);
  }, [previewItems]);

  const activeLightboxItem = lightboxIndex !== null ? previewItems[lightboxIndex] : null;

  const selectStudent = useCallback(async (student: StudentRecord) => {
    setSelected(student);
    setApprovedLicensePreview(null);
    setApproveMessage("");
    setSelectedBus("");
    setLightboxIndex(null);
    setLoadingSelected(true);
    try {
      const [images, license] = await Promise.all([
        employeeApi.get<ImageRecord[]>(`/image/student/${student._id}`),
        employeeApi
          .get<LicenseApiResponse>(`/license/searchByStudent/${student._id}`)
          .catch(() => null),
      ]);
      setSelectedImages(images);
      setApprovedLicensePreview(extractLicenseImage(license));
    } catch {
      setSelectedImages([]);
      setApprovedLicensePreview(null);
    } finally {
      setLoadingSelected(false);
    }
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selected || approving) return;
    if (!selected.institution?.trim()) {
      setApproveMessage("Não é possível criar a carteirinha sem instituição no cadastro.");
      return;
    }
    const normalizedBus = selectedBus.trim();
    if (!normalizedBus) {
      setApproveMessage("Defina a linha de ônibus antes de criar a carteirinha.");
      return;
    }
    setApproving(true);
    setApproveMessage("");
    try {
      const created = await employeeApi.post<LicenseApiResponse>("/license/create", {
        id: selected._id,
        institution: selected.institution,
        bus: normalizedBus,
        ...(profileImage ? { photo: profileImage } : {}),
      });
      setApprovedLicensePreview(extractLicenseImage(created));
      setApproveMessage("Carteirinha criada com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setApproveMessage(e.message ?? "Falha ao criar a carteirinha.");
    } finally {
      setApproving(false);
    }
  }, [selected, approving, selectedBus, profileImage, loadData]);

  const toggleBatchSelection = useCallback((studentId: string) => {
    setSelectedForBatch((prev) => {
      if (prev.includes(studentId)) return prev.filter((id) => id !== studentId);
      return [...prev, studentId];
    });
  }, []);

  const handlePrintSingle = useCallback(async () => {
    if (!selected) {
      setApproveMessage("Selecione um aluno aprovado para imprimir.");
      return;
    }
    const printable = printableCardsByStudentId.get(selected._id);
    if (!printable) {
      setApproveMessage("Carteirinha indisponível para impressão deste aluno.");
      return;
    }
    setPrintingSingle(true);
    setApproveMessage("");
    try {
      const pdfUrl = await buildCardsPdfUrl([printable], `Carteirinha - ${printable.studentName}`);
      openPdfPreview(pdfUrl, `Carteirinha - ${printable.studentName}`);
    } catch {
      setApproveMessage("Falha ao gerar PDF de impressão.");
    } finally {
      setPrintingSingle(false);
    }
  }, [selected, printableCardsByStudentId, openPdfPreview]);

  const handlePrintBatch = useCallback(async () => {
    if (selectedForBatch.length === 0) {
      setApproveMessage("Selecione pelo menos uma carteirinha aprovada para impressão em lote.");
      return;
    }
    const cards = selectedForBatch
      .map((id) => printableCardsByStudentId.get(id) ?? null)
      .filter((item): item is PrintableCard => !!item);
    if (cards.length === 0) {
      setApproveMessage("Nenhuma carteirinha selecionada está disponível para impressão.");
      return;
    }
    setPrintingBatch(true);
    setApproveMessage("");
    try {
      const pdfUrl = await buildCardsPdfUrl(cards, `Carteirinhas em lote (${cards.length})`);
      openPdfPreview(pdfUrl, `Carteirinhas em lote (${cards.length})`);
    } catch {
      setApproveMessage("Falha ao gerar PDF em lote.");
    } finally {
      setPrintingBatch(false);
    }
  }, [selectedForBatch, printableCardsByStudentId, openPdfPreview]);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Side Navigation do Admin */}
      <SideNav activePath="/admin/cards" onLogout={logout} />

      {/* Main Wrapper */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Bar */}
        <TopBar user={user} />

        {/* Page Content */}
        <main className="mt-16 bg-surface flex flex-col flex-1 px-6 py-8 md:px-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">

            {/* Header */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low p-2 text-on-surface-variant hover:bg-surface-container"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Link>
                <div>
                  <h1 className="font-headline text-2xl font-bold text-on-surface">
                    Gerenciar Carteirinhas
                  </h1>
                  <p className="text-sm text-on-surface-variant">
                    Visualize documentos, revise informações e aprove emissões.
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                icon={<RefreshCw className="h-4 w-4" />}
              >
                Atualizar
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <StatBox icon={UserRound} label="Alunos ativos" value={stats.total} />
              <StatBox icon={IdCard} label="Carteirinhas criadas" value={stats.withCard} />
              <StatBox icon={CalendarDays} label="Pendentes de aprovação" value={stats.pending} />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">

              {/* Lista de alunos */}
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="relative w-full md:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar por nome, e-mail ou instituição"
                      className="h-10 w-full rounded-xl border border-outline-variant bg-surface px-9 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex rounded-xl border border-outline-variant bg-surface-container-low p-1 text-sm">
                    <FilterButton active={filter === "pending"} onClick={() => setFilter("pending")}>
                      Pendentes
                    </FilterButton>
                    <FilterButton active={filter === "with-card"} onClick={() => setFilter("with-card")}>
                      Com carteirinha
                    </FilterButton>
                    <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                      Todos
                    </FilterButton>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between gap-2 rounded-xl border border-outline-variant bg-surface p-2">
                  <p className="text-xs text-on-surface-variant">
                    Selecionadas para lote:{" "}
                    <strong className="text-on-surface">{selectedForBatch.length}</strong>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Printer className="h-4 w-4" />}
                    disabled={selectedForBatch.length === 0 || printingBatch}
                    loading={printingBatch}
                    onClick={handlePrintBatch}
                  >
                    Impressão em lote
                  </Button>
                </div>

                {loading && (
                  <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando alunos...
                  </div>
                )}

                {!loading && error && (
                  <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
                    {error}
                  </div>
                )}

                {!loading && !error && filteredStudents.length === 0 && (
                  <div className="rounded-xl border border-outline-variant bg-surface p-6 text-center text-sm text-on-surface-variant">
                    Nenhum aluno encontrado para esse filtro.
                  </div>
                )}

                {!loading && !error && filteredStudents.length > 0 && (
                  <div className="space-y-2">
                    {filteredStudents.map((student) => {
                      const hasCard = licensedStudentIds.has(student._id);
                      const isSelected = selected?._id === student._id;
                      const selectedInBatch = selectedForBatch.includes(student._id);

                      return (
                        <div
                          key={student._id}
                          className={`w-full rounded-xl border p-3 transition ${
                            isSelected
                              ? "border-primary bg-primary/10"
                              : "border-outline-variant bg-surface hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <button
                              onClick={() => selectStudent(student)}
                              className="min-w-0 flex-1 text-left"
                            >
                              <p className="truncate font-semibold text-on-surface">{student.name}</p>
                              <p className="truncate text-xs text-on-surface-variant">{student.email}</p>
                              <p className="truncate text-xs text-on-surface-variant">
                                {student.institution ?? "Instituição não informada"}
                              </p>
                            </button>

                            <div className="flex items-center gap-2">
                              {hasCard && (
                                <label className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface-variant">
                                  <input
                                    type="checkbox"
                                    checked={selectedInBatch}
                                    onChange={() => toggleBatchSelection(student._id)}
                                    className="h-3.5 w-3.5"
                                  />
                                  Lote
                                </label>
                              )}
                              <span
                                className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                                  hasCard
                                    ? "bg-success/15 text-success"
                                    : "bg-warning/20 text-warning"
                                }`}
                              >
                                {hasCard ? "Com carteirinha" : "Pendente"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Painel de detalhes */}
              <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5">
                {!selected && (
                  <div className="flex h-full min-h-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface text-center text-on-surface-variant">
                    <Eye className="h-8 w-8" />
                    <p className="font-medium">Selecione um aluno para revisar.</p>
                    <p className="max-w-xs text-xs">
                      Você verá documentos, informações acadêmicas e poderá aprovar a criação da
                      carteirinha.
                    </p>
                  </div>
                )}

                {selected && (
                  <div className="space-y-4">
                    {/* Info do aluno */}
                    <div className="rounded-xl border border-outline-variant bg-surface p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h2 className="font-semibold text-on-surface">{selected.name}</h2>
                        {currentLicense ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-1 text-xs font-semibold text-success">
                            <BadgeCheck className="h-3.5 w-3.5" />
                            Carteirinha ativa
                          </span>
                        ) : (
                          <span className="rounded-full bg-warning/20 px-2 py-1 text-xs font-semibold text-warning">
                            Aguardando aprovação
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-2 text-xs text-on-surface-variant md:grid-cols-2">
                        <p><strong className="text-on-surface">Curso:</strong> {selected.degree ?? "—"}</p>
                        <p><strong className="text-on-surface">Turno:</strong> {selected.shift ?? "—"}</p>
                        <p className="md:col-span-2">
                          <strong className="text-on-surface">Instituição:</strong>{" "}
                          {selected.institution ?? "—"}
                        </p>
                      </div>
                    </div>

                    {/* Grade horária */}
                    <div className="rounded-xl border border-outline-variant bg-surface p-4">
                      <h3 className="mb-2 text-sm font-semibold text-on-surface">Grade informada</h3>
                      {selected.schedule && selected.schedule.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selected.schedule.map((item, index) => (
                            <span
                              key={`${item.day}-${item.period}-${index}`}
                              className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                            >
                              {DAY_LABELS[item.day] ?? item.day} · {item.period}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-on-surface-variant">Sem grade cadastrada.</p>
                      )}
                    </div>

                    {/* Linha de ônibus */}
                    <div className="rounded-xl border border-outline-variant bg-surface p-4">
                      <label className="mb-2 block text-sm font-semibold text-on-surface">
                        Linha de ônibus para a carteirinha
                      </label>
                      <input
                        value={selectedBus}
                        onChange={(e) => setSelectedBus(e.target.value)}
                        placeholder="Ex.: 205"
                        maxLength={10}
                        className="h-10 w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
                      />
                      <p className="mt-1 text-[11px] text-on-surface-variant">
                        Esse valor será usado no campo de ônibus da carteirinha.
                      </p>
                    </div>

                    {/* Documentos */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {previewItems.map((item, index) => (
                        <DocumentPreview
                          key={item.title}
                          title={item.title}
                          dataUrl={item.dataUrl}
                          loading={item.title !== "Preview da Carteirinha" && loadingSelected}
                          onOpen={item.dataUrl ? () => setLightboxIndex(index) : undefined}
                        />
                      ))}
                    </div>

                    {/* Mensagem de feedback */}
                    {approveMessage && (
                      <div className="rounded-xl border border-outline-variant bg-surface p-3 text-xs text-on-surface">
                        {approveMessage}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex justify-end">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="md"
                          icon={<Printer className="h-4 w-4" />}
                          disabled={
                            !selected ||
                            !selectedLicensePreview ||
                            isPdfDataUrl(selectedLicensePreview) ||
                            printingSingle
                          }
                          loading={printingSingle}
                          onClick={handlePrintSingle}
                        >
                          Impressão única
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          icon={<Bus className="h-4 w-4" />}
                          loading={approving}
                          disabled={
                            !!currentLicense ||
                            !selected.institution ||
                            !selectedBus.trim()
                          }
                          onClick={handleApprove}
                        >
                          {currentLicense ? "Carteirinha já criada" : "Aprovar e criar carteirinha"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Lightbox de imagens */}
      {activeLightboxItem?.dataUrl && (
        <ImageLightbox
          items={previewItems}
          availableIndexes={availablePreviewIndexes}
          currentIndex={lightboxIndex ?? 0}
          onClose={() => setLightboxIndex(null)}
          onNavigate={(nextIndex) => setLightboxIndex(nextIndex)}
        />
      )}

      {/* Modal de preview PDF */}
      {pdfPreviewUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-surface-container-lowest shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface px-4 py-3">
              <p className="truncate text-sm font-semibold text-on-surface">{pdfPreviewTitle}</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer className="h-4 w-4" />}
                  onClick={handlePrintFromPreview}
                >
                  Imprimir
                </Button>
                <Button variant="outline" size="sm" onClick={closePdfPreview}>
                  Fechar
                </Button>
              </div>
            </div>
            <iframe
              ref={pdfFrameRef}
              src={pdfPreviewUrl}
              title={pdfPreviewTitle}
              className="h-full w-full border-0 bg-white"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function FilterButton({
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
      className={`rounded-lg px-3 py-1.5 font-medium transition ${
        active
          ? "bg-surface-container-lowest text-on-surface shadow"
          : "text-on-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4">
      <div className="mb-2 inline-flex rounded-lg bg-primary/10 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <p className="text-xl font-bold text-on-surface">{value}</p>
      <p className="text-xs text-on-surface-variant">{label}</p>
    </div>
  );
}

function DocumentPreview({
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
            <a
              href={dataUrl}
              download={getDownloadName(title, dataUrl)}
              className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface hover:bg-surface-container"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </a>
            {onOpen && (
              <button
                type="button"
                onClick={onOpen}
                className="inline-flex items-center gap-1 rounded-md border border-outline-variant bg-surface-container-low px-2 py-1 text-[11px] text-on-surface hover:bg-surface-container"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Ampliar
              </button>
            )}
          </div>
        )}
      </div>

      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low md:h-56">
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin text-on-surface-variant" />
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
                <Eye className="h-3.5 w-3.5" />
                {isPdf ? "Ler melhor" : "Ver melhor"}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-1 text-on-surface-variant">
            <FileImage className="h-5 w-5" />
            <span className="text-[11px]">Sem arquivo</span>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageLightbox({
  items,
  availableIndexes,
  currentIndex,
  onClose,
  onNavigate,
}: {
  items: PreviewItem[];
  availableIndexes: number[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}) {
  const currentPos = availableIndexes.indexOf(currentIndex);
  const canNavigate = availableIndexes.length > 1;
  const item = items[currentIndex];
  const currentIsPdf = isPdfDataUrl(item?.dataUrl ?? null);

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex w-full max-w-5xl flex-col gap-3 rounded-2xl border border-white/20 bg-black/60 p-3 md:p-4">
        <div className="flex items-center justify-between gap-2 text-white">
          <div>
            <p className="text-sm font-semibold">{item.title}</p>
            <p className="text-xs text-white/70">Clique na miniatura para trocar de documento.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={item.dataUrl}
              download={getDownloadName(item.title, item.dataUrl)}
              className="inline-flex items-center gap-1 rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
            >
              <Download className="h-3.5 w-3.5" />
              Baixar
            </a>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 p-2 hover:bg-white/20"
              aria-label="Fechar visualização"
            >
              <X className="h-4 w-4" />
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
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-2 inline-flex items-center justify-center rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
                aria-label="Próxima imagem"
              >
                <ChevronRight className="h-5 w-5" />
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
              <ExternalLink className="h-3.5 w-3.5" />
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
                      <FileText className="h-4 w-4 text-white/70" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview.dataUrl!}
                        alt={preview.title}
                        className="h-full w-full object-cover"
                      />
                    )
                  ) : (
                    <FileImage className="h-4 w-4 text-white/40" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}