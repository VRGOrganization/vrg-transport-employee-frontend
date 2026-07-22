"use client";

import { useMemo, useState, useEffect } from "react";
import { useCardsData } from "@/components/hooks/useCardsData";
import { useAutoRefresh } from "@/components/hooks/useAutoRefresh";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";
import UniversitySelectorPanel from "@/components/universities/UniversitySelectorPanel";
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
import type { StudentFilter } from "@/types/cards.types";

interface LicensePageProps {
  role: "admin" | "employee";
}

export function LicensePage({ role }: LicensePageProps) {
  void role;
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null);
  const [activeFilter, setActiveFilter] = useState<StudentFilter>("pending");

  const handleUniversityChange = (universityId: string | null) => {
    setSelectedUniversityId(universityId);
    if (!universityId) setSelectedUniversity(null);
  };

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
  } = useCardsData(selectedUniversity);

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

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [approveMessage, setApproveMessage] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  const hasPendingOrWaitlisted = stats.pending > 0 || stats.waitlisted > 0;
  const autoRefreshActive = autoRefreshEnabled && hasPendingOrWaitlisted;

  const { isAutoRefreshing } = useAutoRefresh({
    intervalMs: 30_000,
    enabled: autoRefreshActive,
    onRefresh: reload,
  });

  const printableCardsByStudentId = useMemo(
    () => buildPrintableMap(licenses, students),
    [licenses, students, buildPrintableMap],
  );

  return (
    <>
      <main className="bg-surface flex flex-col flex-1 px-6 py-8 md:px-10">
        <div className="mx-auto w-full space-y-6">
          {!selectedUniversity ? (
            <div className="flex items-start justify-between gap-4">
              <CardsPageHeader />
              <AutoRefreshSettings
                isRefreshing={isAutoRefreshing}
                enabled={autoRefreshActive}
                intervalSeconds={30}
                onToggle={() => setAutoRefreshEnabled((v) => !v)}
              />
            </div>
          ) : (
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
          )}

          {!selectedUniversity && (
            <CardsStatsRow
              total={stats.total}
              withCard={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              {!selectedUniversityId ? (
                <UniversitySelectorPanel onChange={handleUniversityChange} className="mb-4" />
              ) : (
                <>
                  {!selectedUniversity ? (
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
                          <ReissueCandidatesSection universityId={selectedUniversity._id} />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <div className={`min-w-0 ${selectedUniversityId ? "" : "invisible pointer-events-none"}`} aria-hidden={!selectedUniversityId}>
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
