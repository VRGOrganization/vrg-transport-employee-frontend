"use client";

import { useMemo, useState, useEffect } from "react";
import { useCardsData } from "@/components/hooks/useCardsData";
import { useAutoRefresh } from "@/components/hooks/useAutoRefresh";
import BusSelectorPanel from "@/components/buses/BusSelectorPanel";
import { busApi } from "@/lib/universityApi";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { AutoRefreshIndicator } from "@/components/cards/AutoRefreshIndicator";
import { CardsPageHeader } from "@/components/cards/CardsPageHeader";
import { CardsStatsRow } from "@/components/cards/CardsStatsRow";
import { StudentListPanel } from "@/components/cards/StudentListPanel";
import { StudentDetailPanel } from "@/components/cards/StudentDetailPanel";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { RejectModal } from "@/components/cards/RejectModal";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";
import type { Bus, BusRoute } from "@/types/university.types";

export default function AdminCardsPage() {
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedBusRoute, setSelectedBusRoute] = useState<BusRoute | null>(null);

  useEffect(() => {
    const mountState = { cancelled: false };
    setSelectedBusRoute(null);
    if (!selectedBusId) {
      setSelectedBus(null);
      return;
    }

    (async () => {
      try {
        const arr = await busApi.listWithQueueCounts();
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
  }, [selectedBusId]);

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

  const { isAutoRefreshing, refreshCount } = useAutoRefresh({
    intervalMs: 30_000,
    enabled: autoRefreshEnabled && hasPendingOrWaitlisted,
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
            <div className="flex items-start justify-between gap-4">
              <CardsPageHeader onRefresh={reload} />
              <AutoRefreshIndicator
                isRefreshing={isAutoRefreshing}
                enabled={autoRefreshEnabled && hasPendingOrWaitlisted}
                refreshCount={refreshCount}
                intervalSeconds={30}
                onToggle={() => setAutoRefreshEnabled((v) => !v)}
              />
            </div>

            <CardsStatsRow
              total={stats.total}
              withCard={stats.withCard}
              pending={stats.pending}
              waitlisted={stats.waitlisted}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div>
                {!selectedBusId ? (
                  <BusSelectorPanel onChange={setSelectedBusId} className="mb-4" />
                ) : (
                  <>
                    <BusSelectorPanel
                      value={selectedBusId}
                      onChange={setSelectedBusId}
                      className="mb-4"
                    />
                    {/* Rota para aprovação removida — usamos o ônibus selecionado como rota */}
                    {!selectedBus ? (
                      <div className="rounded-2xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
                        Carregando ônibus selecionado...
                      </div>
                    ) : (
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
                      />
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


