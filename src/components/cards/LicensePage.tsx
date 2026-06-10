"use client";

import { useMemo, useState, useEffect } from "react";
import { useCardsData } from "@/components/hooks/useCardsData";
import { useAutoRefresh } from "@/components/hooks/useAutoRefresh";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";
import BusSelectorPanel from "@/components/buses/BusSelectorPanel";
import BusRouteSelectorPanel from "@/components/buses/BusRouteSelectorPanel";
import { busApi } from "@/lib/universityApi";
import { busLabel } from "@/lib/busLabel";
import { AutoRefreshIndicator } from "@/components/cards/AutoRefreshIndicator";
import { CardsPageHeader } from "@/components/cards/CardsPageHeader";
import { BusPageHeader } from "@/components/cards/BusPageHeader";
import { CardsStatsRow } from "@/components/cards/CardsStatsRow";
import { StudentListPanel } from "@/components/cards/StudentListPanel";
import { StudentDetailPanel } from "@/components/cards/StudentDetailPanel";
import { AcceptDocumentsButton } from "@/components/cards/AcceptDocumentsButton";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { RejectModal } from "@/components/cards/RejectModal";
import type { Bus, BusRoute } from "@/types/university.types";
import type { StudentFilter } from "@/types/cards.types";

interface LicensePageProps {
  role: "admin" | "employee";
}

export function LicensePage({ role }: LicensePageProps) {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedBusRoute, setSelectedBusRoute] = useState<BusRoute | null>(null);
  const [activeFilter, setActiveFilter] = useState<StudentFilter>("pending");

  // Carrega o ônibus selecionado. Admin usa contagens de fila; employee usa lista simples.
  useEffect(() => {
    const mountState = { cancelled: false };
    setSelectedBusRoute(null);
    if (!selectedBusId) {
      setSelectedBus(null);
      return;
    }

    (async () => {
      try {
        const arr =
          role === "admin" ? await busApi.listWithQueueCounts() : await busApi.list();
        const found = arr.find((b) => b._id === selectedBusId) ?? null;
        if (!mountState.cancelled) setSelectedBus(found);
        if (!mountState.cancelled) setSelectedBusRoute(found as unknown as BusRoute);
      } catch {
        if (!mountState.cancelled) setSelectedBus(null);
      }
    })();

    return () => {
      mountState.cancelled = true;
    };
  }, [selectedBusId, role]);

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
  } = useCardsData(selectedBus);

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
    governmentImage,
    proofOfResidenceImage,
    selectedLicensePreview,
    selectStudent,
  } = useStudentSelection(licenses, licenseRequests);

  const {
    pdfPreviewUrl,
    pdfPreviewTitle,
    printingSingle,
    printingBatch,
    selectedForBatch,
    closePdfPreview,
    toggleBatchSelection,
    handlePrintSingle,
    handlePrintBatch,
    buildPrintableMap,
  } = usePdfPrint();

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
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
          {!selectedBus ? (
            <div className="flex items-start justify-between gap-4">
              <CardsPageHeader onRefresh={reload} />
              <AutoRefreshIndicator
                isRefreshing={isAutoRefreshing}
                enabled={autoRefreshActive}
                intervalSeconds={30}
                onToggle={() => setAutoRefreshEnabled((v) => !v)}
              />
            </div>
          ) : (
            <BusPageHeader
              bus={selectedBus}
              onRefresh={reload}
              onBack={() => setSelectedBusId(null)}
              isRefreshing={isAutoRefreshing}
              autoRefreshEnabled={autoRefreshActive}
              onToggleAutoRefresh={() => setAutoRefreshEnabled((v) => !v)}
            />
          )}

          {!selectedBus && (
            <CardsStatsRow
              total={stats.total}
              withCard={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
            />
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
            <div>
              {!selectedBusId ? (
                <BusSelectorPanel onChange={setSelectedBusId} className="mb-4" />
              ) : (
                <>
                  {role === "employee" && (
                    <BusRouteSelectorPanel
                      value={selectedBusRoute?._id ?? null}
                      onChange={setSelectedBusRoute}
                      className="mb-4"
                    />
                  )}
                  {!selectedBus ? (
                    <div className="rounded-2xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
                      Carregando ônibus selecionado...
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
                        bus={selectedBus}
                        selectedForBatch={selectedForBatch}
                        printingBatch={printingBatch}
                        loading={loading}
                        error={error}
                        printableCardsByStudentId={printableCardsByStudentId}
                        onSelectStudent={selectStudent}
                        onToggleBatch={toggleBatchSelection}
                        onPrintBatch={() =>
                          handlePrintBatch(printableCardsByStudentId, setApproveMessage)
                        }
                        largeItems={true}
                        showReview={true}
                        filter={activeFilter}
                        onFilterChange={setActiveFilter}
                      />

                      {activeFilter === "review" && selected && (
                        <div className="mt-4">
                          <AcceptDocumentsButton
                            licenseRequest={currentLicenseRequest}
                            selectedBusRouteLabel={busLabel(selectedBusRoute) ?? ""}
                            hasInstitution={!!selected.institution?.trim()}
                            profileImage={profileImage}
                            institution={selected.institution}
                            onSuccess={reload}
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            <StudentDetailPanel
              selected={selected}
              selectedImages={selectedImages}
              loadingSelected={loadingSelected}
              currentLicense={currentLicense}
              fullLicense={fullLicense}
              currentLicenseRequest={currentLicenseRequest}
              selectedBusRoute={selectedBusRoute}
              pendingImagesByType={pendingImagesByType}
              profileImage={profileImage}
              enrollmentImage={enrollmentImage}
              scheduleImage={scheduleImage}
              governmentImage={governmentImage}
              proofOfResidenceImage={proofOfResidenceImage}
              selectedLicensePreview={selectedLicensePreview}
              onReload={reload}
              onOpenRejectModal={() => setRejectModalOpen(true)}
              printingSingle={printingSingle}
              onPrintSingle={() =>
                handlePrintSingle(selected, printableCardsByStudentId, setApproveMessage)
              }
            />
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
    </>
  );
}
