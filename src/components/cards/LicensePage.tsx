"use client";

import { useMemo, useState, useEffect } from "react";
import { useCardsData, type CardsScope } from "@/components/hooks/useCardsData";
import { useQueueViewMode, type QueueViewMode } from "@/components/hooks/useQueueViewMode";
import { useAutoRefresh } from "@/components/hooks/useAutoRefresh";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";
import UniversitySelectorPanel from "@/components/universities/UniversitySelectorPanel";
import BusQueueSelectorPanel from "@/components/cards/BusQueueSelectorPanel";
import { BusPageHeader } from "@/components/cards/BusPageHeader";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatusBanner } from "@/components/ui/StatusBanner";
import type { BusRequestQueueEntry } from "@/services/licenseRequestService";
import { universityService } from "@/services/universityService";
import { AutoRefreshSettings } from "@/components/cards/AutoRefreshSettings";
import { CardsPageHeader } from "@/components/cards/CardsPageHeader";
import { UniversityPageHeader } from "@/components/cards/UniversityPageHeader";
import { CardsStatsRow } from "@/components/cards/CardsStatsRow";
import { StudentListPanel } from "@/components/cards/StudentListPanel";
import { StudentDetailPanel } from "@/components/cards/StudentDetailPanel";
import { AcceptDocumentsButton } from "@/components/cards/AcceptDocumentsButton";
import { ReissueCandidatesSection } from "@/components/cards/ReissueCandidatesSection";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { RejectModal } from "@/components/cards/RejectModal";
import { RequestRevisionModal } from "@/components/cards/RequestRevisionModal";
import type { University } from "@/types/university.types";
import type { LicenseRequestRecord, StudentFilter } from "@/types/cards.types";

interface LicensePageProps {
  role: "admin" | "employee";
}

const VIEW_MODE_OPTIONS = [
  { value: "bus", label: "Por ônibus" },
  { value: "university", label: "Por faculdade" },
];

/** Ônibus do pedido fora do ônibus em revisão (ida e volta em ônibus diferentes). */
function otherBusIdentifiers(request: LicenseRequestRecord | null | undefined, busId: string): string[] {
  const identifiers = (request?.allocationSummary ?? [])
    .filter((entry) => entry.busId && entry.busId !== busId)
    .map((entry) => entry.busIdentifier ?? "")
    .filter(Boolean);
  return [...new Set(identifiers)];
}

export function LicensePage({ role }: LicensePageProps) {
  void role;
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [activeFilter, setActiveFilter] = useState<StudentFilter>("pending");
  const [viewMode, setViewMode] = useQueueViewMode();
  const [selectedBus, setSelectedBus] = useState<BusRequestQueueEntry | null>(null);

  const handleUniversityChange = (universityId: string | null) => {
    setSelectedUniversityId(universityId);
    if (!universityId) setSelectedUniversity(null);
  };

  // Trocar a visão só muda o recorte da fila: a aprovação continua igual.
  const handleViewModeChange = (mode: string) => {
    if (mode !== "university" && mode !== "bus") return;
    setViewMode(mode as QueueViewMode);
    setSelectedUniversityId(null);
    setSelectedUniversity(null);
    setSelectedBus(null);
  };

  const isBusView = viewMode === "bus";
  const hasSelection = isBusView ? selectedBus !== null : selectedUniversityId !== null;
  const isSelectionReady = isBusView ? selectedBus !== null : selectedUniversity !== null;

  // Carrega a universidade selecionada.
  useEffect(() => {
    const mountState = { cancelled: false };
    if (!selectedUniversityId) {
      return;
    }

    (async () => {
      try {
        const arr = await universityService.list();
        const found = arr.find((university) => university._id === selectedUniversityId) ?? null;
        if (!mountState.cancelled) setSelectedUniversity(found);
      } catch {
        if (!mountState.cancelled) setSelectedUniversity(null);
      }
    })();

    return () => {
      mountState.cancelled = true;
    };
  }, [selectedUniversityId]);

  const cardsScope: CardsScope = isBusView
    ? selectedBus
      ? { kind: "bus", busId: selectedBus.busId }
      : null
    : selectedUniversity
      ? { kind: "university", universityId: selectedUniversity._id }
      : null;

  const {
    students,
    licenses,
    licenseRequests,
    loading,
    error,
    licensedStudentIds,
    pendingStudentIds,
    waitlistedStudentIds,
    stats,
    reload,
  } = useCardsData(cardsScope);

  const {
    selected,
    selectedImages,
    loadingSelected,
    currentLicense,
    fullLicense,
    currentLicenseRequest,
    pendingImagesByType,
    profileImage,
    enrollmentImage,
    scheduleImage,
    academicPeriodImage,
    secondaryEnrollmentImage,
    secondaryScheduleImage,
    secondaryAcademicPeriodImage,
    governmentImage,
    proofOfResidenceImage,
    transportCardProofImage,
    alreadyUsesTransport,
    disabilityProofImage,
    hasDisability,
    selectedLicensePreview,
    selectStudent,
    clearSelection,
  } = useStudentSelection(licenses, licenseRequests);

  const {
    pdfPreviewUrl,
    pdfPreviewTitle,
    printingSingle,
    printingBatch,
    selectedForBatch,
    closePdfPreview,
    toggleBatchSelection,
    setBatchSelection,
    handlePrintSingle,
    handlePrintBatch,
    buildPrintableMap,
  } = usePdfPrint();

  // Limpa seleção ao trocar de aba ou ao voltar para a tela de universidades
  useEffect(() => { clearSelection(); }, [activeFilter, clearSelection]);
  useEffect(() => { clearSelection(); }, [selectedUniversityId, clearSelection]);
  useEffect(() => { clearSelection(); }, [viewMode, selectedBus?.busId, clearSelection]);

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const hasPendingOrWaitlisted = stats.pending > 0 || stats.waitlisted > 0;
  const autoRefreshActive = autoRefreshEnabled && hasPendingOrWaitlisted;

  const { isAutoRefreshing } = useAutoRefresh({
    intervalMs: 30_000,
    enabled: autoRefreshActive,
    // silent: refresh de background não deve derrubar a lista pra um
    // spinner de tela cheia no meio de uma revisão ativa.
    onRefresh: () => reload({ silent: true }),
  });

  const printableCardsByStudentId = useMemo(
    () => buildPrintableMap(licenses, students),
    [licenses, students, buildPrintableMap],
  );

  return (
    <>
      <main className="bg-surface flex flex-col flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto w-full space-y-6">
          {!isSelectionReady ? (
            <div className="flex flex-wrap items-start justify-between gap-4">
              <CardsPageHeader />
              <AutoRefreshSettings
                isRefreshing={isAutoRefreshing}
                enabled={autoRefreshActive}
                intervalSeconds={30}
                onToggle={() => setAutoRefreshEnabled((v) => !v)}
              />
            </div>
          ) : isBusView && selectedBus ? (
            <BusPageHeader
              bus={selectedBus}
              onBack={() => setSelectedBus(null)}
              isRefreshing={isAutoRefreshing}
              autoRefreshEnabled={autoRefreshActive}
              onToggleAutoRefresh={() => setAutoRefreshEnabled((v) => !v)}
              approved={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
              review={stats.review}
            />
          ) : selectedUniversity ? (
            <UniversityPageHeader
              university={selectedUniversity}
              onBack={() => handleUniversityChange(null)}
              isRefreshing={isAutoRefreshing}
              autoRefreshEnabled={autoRefreshActive}
              onToggleAutoRefresh={() => setAutoRefreshEnabled((v) => !v)}
              approved={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
              review={stats.review}
            />
          ) : null}

          {!isSelectionReady && (
            <CardsStatsRow
              total={stats.total}
              withCard={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              {!hasSelection ? (
                <>
                  <SegmentedControl
                    options={VIEW_MODE_OPTIONS}
                    value={viewMode}
                    onChange={handleViewModeChange}
                    allowDeselect={false}
                    columns={2}
                    className="mb-4"
                  />
                  {isBusView ? (
                    <BusQueueSelectorPanel onChange={setSelectedBus} className="mb-4" />
                  ) : (
                    <UniversitySelectorPanel onChange={handleUniversityChange} className="mb-4" />
                  )}
                </>
              ) : (
                <>
                  {!isSelectionReady ? (
                    <div className="rounded-2xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
                      Carregando universidade selecionada...
                    </div>
                  ) : (
                    <>
                      <StudentListPanel
                        students={students}
                        licenseRequests={licenseRequests}
                        licensedStudentIds={licensedStudentIds}
                        pendingStudentIds={pendingStudentIds}
                        waitlistedStudentIds={waitlistedStudentIds}
                        selectedStudent={selected}
                        selectedForBatch={selectedForBatch}
                        printingBatch={printingBatch}
                        loading={loading}
                        error={error}
                        printableCardsByStudentId={printableCardsByStudentId}
                        onSelectStudent={selectStudent}
                        onToggleBatch={toggleBatchSelection}
                        onSetBatch={setBatchSelection}
                        onPrintBatch={() =>
                          handlePrintBatch(printableCardsByStudentId, setApproveMessage)
                        }
                        largeItems={true}
                        showReview={true}
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                        title={activeFilter === "review" ? "Reenvio de documentos" : undefined}
                        description={
                          activeFilter === "review"
                            ? "Solicitações de atualização pendentes para validar documentos reenviados."
                            : undefined
                        }
                      />

                      {approveMessage && (
                        <div className="mt-4 rounded-xl border border-outline-variant bg-surface p-3 text-sm text-on-surface">
                          {approveMessage}
                        </div>
                      )}

                      {activeFilter === "review" &&
                        selected &&
                        currentLicenseRequest?.type === "update" &&
                        currentLicenseRequest?.status === "pending" && (
                          <div className="mt-4">
                            <AcceptDocumentsButton
                              licenseRequest={currentLicenseRequest}
                              profileImage={profileImage}
                              onSuccess={reload}
                            />
                          </div>
                        )}

                      {activeFilter === "review" && (
                        <div className="mt-4">
                          <ReissueCandidatesSection
                            universityId={isBusView ? null : selectedUniversity?._id ?? null}
                            busId={isBusView ? selectedBus?.busId ?? null : null}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className={`min-w-0 ${hasSelection ? "" : "invisible pointer-events-none"}`} aria-hidden={!hasSelection}>
              {isBusView && selectedBus && otherBusIdentifiers(currentLicenseRequest, selectedBus.busId).length > 0 && (
                <StatusBanner variant="info" className="mb-4">
                  Aprovar aprova o pedido inteiro, incluindo os dias no ônibus{" "}
                  {otherBusIdentifiers(currentLicenseRequest, selectedBus.busId).join(", ")}.
                </StatusBanner>
              )}
              <StudentDetailPanel
                selected={selected}
                selectedImages={selectedImages}
                loadingSelected={loadingSelected}
                currentLicense={currentLicense}
                fullLicense={fullLicense}
                currentLicenseRequest={currentLicenseRequest}
                pendingImagesByType={pendingImagesByType}
                profileImage={profileImage}
                enrollmentImage={enrollmentImage}
                scheduleImage={scheduleImage}
                academicPeriodImage={academicPeriodImage}
                secondaryEnrollmentImage={secondaryEnrollmentImage}
                secondaryScheduleImage={secondaryScheduleImage}
                secondaryAcademicPeriodImage={secondaryAcademicPeriodImage}
                governmentImage={governmentImage}
                proofOfResidenceImage={proofOfResidenceImage}
                transportCardProofImage={transportCardProofImage}
                alreadyUsesTransport={alreadyUsesTransport}
                disabilityProofImage={disabilityProofImage}
                hasDisability={hasDisability}
                selectedLicensePreview={selectedLicensePreview}
                onReload={reload}
                onOpenRejectModal={() => setRejectModalOpen(true)}
                onOpenRevisionModal={() => setRevisionModalOpen(true)}
                printingSingle={printingSingle}
                onPrintSingle={() =>
                  handlePrintSingle(selected, printableCardsByStudentId, setApproveMessage)
                }
                showUpdateDiff={activeFilter === "review"}
              />
            </div>
          </div>
        </div>
      </main>

      {pdfPreviewUrl && (
        <PdfPreviewModal
          pdfUrl={pdfPreviewUrl}
          title={pdfPreviewTitle}
          onClose={closePdfPreview}
        />
      )}

      {rejectModalOpen && currentLicenseRequest && (
        <RejectModal
          currentLicenseRequest={currentLicenseRequest}
          onClose={() => setRejectModalOpen(false)}
          onSuccess={setApproveMessage}
          onReload={reload}
        />
      )}

      {revisionModalOpen && currentLicenseRequest && (
        <RequestRevisionModal
          currentLicenseRequest={currentLicenseRequest}
          alreadyUsesTransport={alreadyUsesTransport}
          hasDisability={hasDisability}
          onClose={() => setRevisionModalOpen(false)}
          onSuccess={setApproveMessage}
          onReload={reload}
        />
      )}
    </>
  );
}
