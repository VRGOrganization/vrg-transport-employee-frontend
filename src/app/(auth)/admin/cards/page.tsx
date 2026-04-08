"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bus,
  CalendarDays,
  Eye,
  IdCard,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import {
  DocumentPreview,
  FilterButton,
  ImageLightbox,
  StatBox,
} from "../../../../components/cards/CardPageComponents";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import {
  buildCardsPdfUrl,
  extractLicenseImage,
  isPdfDataUrl,
  normalizeMediaSource,
} from "@/lib/cardUtils";
import { employeeApi } from "@/lib/employeeApi";

const REJECTION_REASONS = [
  "Foto inadequada ou ilegível",
  "Comprovante de matrícula inválido",
  "Grade horária não corresponde aos documentos",
  "Documentos ilegíveis ou corrompidos",
  "Informações inconsistentes",
] as const;

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

type StudentsResponse =
  | StudentRecord[]
  | {
      data?: StudentRecord[];
      total?: number;
      page?: number;
      limit?: number;
    };

interface LicenseRecord {
  _id: string;
  studentId: string;
  imageLicense: string;
  status: "active" | "inactive" | "expired";
}

interface LicenseRequestRecord {
  _id: string;
  studentId: string;
  type: "initial" | "update";
  changedDocuments: string[];
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  rejectedAt: string | null;
  licenseId: string | null;
  createdAt: string;
}

interface ImageHistory {
  _id: string;
  studentId: string;
  imageId: string;
  photoType: PhotoType;
  photo3x4: string | null;
  documentImage: string | null;
  replacedAt: string;
}

interface LicenseApiResponse {
  _id?: string;
  studentId?: string;
  imageLicense?: string;
  image?: string;
  licenseImage?: string;
  studentCard?: string;
  status?: "active" | "inactive" | "expired" | "rejected";
  rejectionReason?: string | null;
  rejectedAt?: string | null;
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


const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  ProfilePhoto: "Foto 3x4",
  EnrollmentProof: "Comprovante de Matrícula",
  CourseSchedule: "Grade Horária",
  LicenseImage: "Carteirinha",
};

// ── Página Principal ──────────────────────────────────────────────────────────

export default function AdminCardsPage() {
  const { user, logout } = useEmployeeAuth();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licenseRequests, setLicenseRequests] = useState<LicenseRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"pending" | "all" | "with-card">("pending");

  const [selected, setSelected] = useState<StudentRecord | null>(null);
  const [selectedImages, setSelectedImages] = useState<ImageRecord[]>([]);
  const [selectedImageHistory, setSelectedImageHistory] = useState<ImageHistory[]>([]);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [approving, setApproving] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>("");
  const [rejecting, setRejecting] = useState(false);
  const [rejectMessage, setRejectMessage] = useState("");
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
      const [studentsResponse, licensesResponse, requestsResponse] = await Promise.all([
        employeeApi.get<StudentsResponse>('/student'),
        employeeApi.get<LicenseRecord[]>("/license/all"),
        employeeApi.get<LicenseRequestRecord[]>("/license-request/all"),
      ]);
      const resolvedStudents = Array.isArray(studentsResponse)
        ? studentsResponse
        : Array.isArray(studentsResponse?.data)
          ? studentsResponse.data
          : [];

      setStudents(resolvedStudents);
      setLicenses(licensesResponse);
      setLicenseRequests(requestsResponse);
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

  const pendingStudentIds = useMemo(() => {
    return new Set(
      licenseRequests
        .filter((r) => r.status === "pending")
        .map((r) => r.studentId),
    );
  }, [licenseRequests]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return students
      .filter((student) => student.active)
      .filter((student) => {
        if (filter === "pending") return pendingStudentIds.has(student._id);
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
  }, [students, filter, search, licensedStudentIds, pendingStudentIds]);

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

  const currentLicenseRequest = useMemo(() => {
    if (!selected) return null;
    return (
      licenseRequests
        .filter((r) => r.studentId === selected._id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
    );
  }, [licenseRequests, selected]);

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
    setSelectedImages([]);
    setSelectedImageHistory([]);
    setApprovedLicensePreview(null);
    setApproveMessage("");
    setSelectedBus("");
    setLightboxIndex(null);
    setLoadingSelected(true);
    try {
      const [images, imageHistory, license] = await Promise.all([
        employeeApi.get<ImageRecord[]>(`/image/student/${student._id}`),
        employeeApi.get<ImageHistory[]>(`/image/history/student/${student._id}`).catch(() => []),
        employeeApi
          .get<LicenseApiResponse>(`/license/searchByStudent/${student._id}`)
          .catch(() => null),
      ]);
      setSelectedImages(images);
      setSelectedImageHistory(imageHistory);
      setApprovedLicensePreview(extractLicenseImage(license));
    } catch {
      setSelectedImages([]);
      setSelectedImageHistory([]);
      setApprovedLicensePreview(null);
    } finally {
      setLoadingSelected(false);
    }
  }, []);

  const handleApprove = useCallback(async () => {
    if (!selected || approving || !currentLicenseRequest) return;
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
      await employeeApi.patch(`/license-request/approve/${currentLicenseRequest._id}`, {
        institution: selected.institution,
        bus: normalizedBus,
        ...(profileImage ? { photo: profileImage } : {}),
      });
      setApproveMessage("Carteirinha criada com sucesso.");
      await loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setApproveMessage(e.message ?? "Falha ao criar a carteirinha.");
    } finally {
      setApproving(false);
    }
  }, [selected, approving, currentLicenseRequest, selectedBus, profileImage, loadData]);

  const handleReject = useCallback(async () => {
    if (!selected || !currentLicenseRequest || rejecting) return;
    if (!selectedRejectionReason) {
      setRejectMessage("Selecione um motivo de recusa.");
      return;
    }

    setRejecting(true);
    setRejectMessage("");

    try {
      await employeeApi.patch(`/license-request/reject/${currentLicenseRequest._id}`, {
        reason: selectedRejectionReason,
      });
      setRejectModalOpen(false);
      setSelectedRejectionReason("");
      setApproveMessage("Carteirinha recusada. O aluno foi notificado por e-mail.");
      await loadData();
    } catch (err: unknown) {
      const e = err as { message?: string };
      setRejectMessage(e.message ?? "Falha ao recusar a carteirinha.");
    } finally {
      setRejecting(false);
    }
  }, [selected, currentLicenseRequest, rejecting, selectedRejectionReason, loadData]);

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
                        const studentRequest =
                          licenseRequests
                            .filter((r) => r.studentId === student._id)
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
                        const hasCard = licensedStudentIds.has(student._id);
                        const isPending = studentRequest?.status === "pending";
                        const isRejected = studentRequest?.status === "rejected";
                        const isUpdateRequest = studentRequest?.type === "update";
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
                                    : isPending
                                    ? "bg-warning/20 text-warning"
                                    : isRejected
                                    ? "bg-error/15 text-error"
                                    : "bg-outline-variant/30 text-on-surface-variant"
                                }`}
                              >
                                {hasCard ? "Com carteirinha" : isPending ? "Pendente" : isRejected ? "Recusada" : "Sem solicitação"}
                              </span>
                              {isUpdateRequest && (
                                <span className="rounded-full px-2 py-1 text-[10px] font-semibold bg-secondary/15 text-secondary">
                                  Alteração
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* Painel de detalhes */}
              <section className="relative h-full min-h-0 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5 flex flex-col">
                {!selected && (
                  <div className="flex flex-1 min-h-96 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-outline-variant bg-surface text-center text-on-surface-variant">
                    <Eye className="h-8 w-8" />
                    <p className="font-medium">Selecione um aluno para revisar.</p>
                    <p className="max-w-xs text-xs">
                      Você verá documentos, informações acadêmicas e poderá aprovar a criação da
                      carteirinha.
                    </p>
                  </div>
                )}

                {selected && (
                  <div className="flex flex-1 min-h-0 flex-col">
                    <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pb-4 pr-1">
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
                      </div>

                      <div className="rounded-xl border border-outline-variant bg-surface px-4 py-4 space-y-4">
                        <h3 className="text-sm font-semibold text-on-surface">Dados do aluno</h3>
                        <div className="grid grid-cols-1 gap-2 text-xs text-on-surface-variant md:grid-cols-2">
                          <p><strong className="text-on-surface">Curso:</strong> {selected.degree ?? "—"}</p>
                          <p><strong className="text-on-surface">Turno:</strong> {selected.shift ?? "—"}</p>
                          <p className="md:col-span-2">
                            <strong className="text-on-surface">Instituição:</strong> {" "}
                            {selected.institution ?? "—"}
                          </p>
                        </div>

                        <div className="border-t border-outline-variant/20 pt-4">
                          <h4 className="mb-2 text-sm font-semibold text-on-surface">Grade informada</h4>
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
                      </div>

                      <div className="border-t border-outline-variant/20" />

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-on-surface">Documentos enviados</h3>

                      {currentLicenseRequest?.type === "update" && (
                        <>
                          <div className="rounded-xl border border-secondary/30 bg-secondary/5 p-4 space-y-3">
                            <h3 className="text-sm font-semibold text-on-surface">
                              Documentos alterados nesta solicitação
                            </h3>

                            {currentLicenseRequest.changedDocuments.length > 0 ? (
                              <div className="space-y-3">
                                {currentLicenseRequest.changedDocuments.map((docType) => {
                                  const typedDoc = docType as PhotoType;
                                  const newImage = selectedImages.find((img) => img.photoType === typedDoc);
                                  const historyImage = selectedImageHistory.find((img) => img.photoType === typedDoc);

                                  const newDataUrl = typedDoc === "ProfilePhoto"
                                    ? normalizeMediaSource(newImage?.photo3x4 ?? null)
                                    : normalizeMediaSource(newImage?.documentImage ?? null);

                                  const previousDataUrl = typedDoc === "ProfilePhoto"
                                    ? normalizeMediaSource(historyImage?.photo3x4 ?? null)
                                    : normalizeMediaSource(historyImage?.documentImage ?? null);

                                  return (
                                    <div key={docType} className="rounded-xl border border-outline-variant bg-surface p-3 space-y-2">
                                      <p className="inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold bg-secondary/15 text-secondary">
                                        {PHOTO_TYPE_LABELS[typedDoc] ?? docType}
                                      </p>

                                      {previousDataUrl ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                          <DocumentPreview
                                            title="Anterior"
                                            dataUrl={previousDataUrl}
                                            loading={loadingSelected}
                                          />
                                          <DocumentPreview
                                            title="Novo"
                                            dataUrl={newDataUrl}
                                            loading={loadingSelected}
                                          />
                                        </div>
                                      ) : (
                                        <DocumentPreview
                                          title="Novo (primeiro envio)"
                                          dataUrl={newDataUrl}
                                          loading={loadingSelected}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-on-surface-variant">Nenhum documento informado nesta solicitação.</p>
                            )}
                          </div>
                        </>
                      )}

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
                      </div>

                      {approveMessage && (
                        <>
                          <div className="border-t border-outline-variant/60" />
                          <div className="rounded-xl border border-outline-variant bg-surface p-3 text-xs text-on-surface">
                            {approveMessage}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t border-outline-variant bg-surface-container-lowest pt-3 pb-4 px-4 space-y-3">
                      <div>
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

                      <div className="border-t border-outline-variant/60" />

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="outline"
                          size="md"
                          icon={<Printer className="h-4 w-4" />}
                          disabled={!selectedLicensePreview || isPdfDataUrl(selectedLicensePreview ?? "") || printingSingle}
                          loading={printingSingle}
                          onClick={handlePrintSingle}
                        >
                          Impressão única
                        </Button>

                        <Button
                          variant="outline"
                          size="md"
                          icon={<XCircle className="h-4 w-4" />}
                          disabled={!currentLicenseRequest || currentLicenseRequest.status !== "pending" || rejecting}
                          onClick={() => {
                            setSelectedRejectionReason("");
                            setRejectMessage("");
                            setRejectModalOpen(true);
                          }}
                          className="text-error border-error/40 hover:bg-error/5"
                        >
                          Recusar
                        </Button>

                        <Button
                          variant="primary"
                          size="md"
                          icon={<Bus className="h-4 w-4" />}
                          loading={approving}
                          disabled={!currentLicenseRequest || currentLicenseRequest.status !== "pending" || !selected?.institution || !selectedBus.trim()}
                          onClick={handleApprove}
                        >
                          {currentLicense ? "Carteirinha já criada" : "Aprovar e criar"}
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

      {rejectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !rejecting && setRejectModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-surface p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center shrink-0">
                <XCircle className="h-5 w-5 text-error" />
              </div>
              <div>
                <h2 className="font-bold text-on-surface text-base">Recusar carteirinha</h2>
                <p className="text-xs text-on-surface-variant">Selecione o motivo da recusa</p>
              </div>
            </div>

            <div className="space-y-2">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedRejectionReason(reason)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border transition-all ${
                    selectedRejectionReason === reason
                      ? "border-error bg-error/10 text-error font-medium"
                      : "border-outline-variant bg-surface-container-low text-on-surface hover:border-error/40"
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {rejectMessage && (
              <p className="text-xs text-error">{rejectMessage}</p>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                disabled={rejecting}
                className="flex-1 py-2.5 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-xl transition-all disabled:opacity-40"
              >
                Cancelar
              </button>
              <Button
                variant="primary"
                size="md"
                loading={rejecting}
                disabled={!selectedRejectionReason || rejecting}
                onClick={handleReject}
                className="flex-1 bg-error hover:bg-error/90"
              >
                Confirmar recusa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
