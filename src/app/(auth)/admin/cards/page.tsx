"use client";

import { useMemo, useState, useEffect } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { useCardsData } from "@/components/hooks/useCardsData";
import BusSelectorPanel from "@/components/buses/BusSelectorPanel";
import { busApi } from "@/lib/universityApi";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { CardsPageHeader } from "@/components/cards/CardsPageHeader";
import { CardsStatsRow } from "@/components/cards/CardsStatsRow";
import { StudentListPanel } from "@/components/cards/StudentListPanel";
import { StudentDetailPanel } from "@/components/cards/StudentDetailPanel";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { RejectModal } from "@/components/cards/RejectModal";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";
import type { Bus } from "@/types/university.types";

export default function AdminCardsPage() {
  const { user, logout } = useEmployeeAuth();

  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);

  // load selected bus details (universitySlots) so StudentListPanel can apply priority filtering
  useEffect(() => {
    let cancelled = false;
    if (!selectedBusId) {
      setSelectedBus(null);
      return;
    }

    (async () => {
      try {
        const list = await busApi.list();
        const arr = Array.isArray(list) ? list : (list as any)?.data ?? [];
        const found = arr.find((b: any) => b._id === selectedBusId) ?? null;
        if (!cancelled) setSelectedBus(found);
      } catch (e) {
        if (!cancelled) setSelectedBus(null);
      }
    })();

    return () => {
      cancelled = true;
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
  } =
    useCardsData(selectedBus);

  const {
    selected,
    selectedImages,
    loadingSelected,
    currentLicense,
    currentLicenseRequest,
    pendingImagesByType,
    profileImage,
    enrollmentImage,
    scheduleImage,
    selectedLicensePreview,
    selectStudent,
  } = useStudentSelection(
    licenses,
    licenseRequests,

  );

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

  const printableCardsByStudentId = useMemo(
    () => buildPrintableMap(licenses, students),
    [licenses, students, buildPrintableMap],
  );

  return (
    <div className="flex min-h-screen bg-surface">
      <SideNav activePath="/admin/cards" onLogout={logout} />

      <div className="flex-1 ml-64 flex flex-col">
        <TopBar user={user} />

        <main className="mt-16 bg-surface flex flex-col flex-1 px-6 py-8 md:px-10">
          <div className="max-w-7xl mx-auto w-full space-y-6">

            <CardsPageHeader onRefresh={reload} />

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
                    <BusSelectorPanel value={selectedBusId} onChange={setSelectedBusId} className="mb-4" />
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
                currentLicenseRequest={currentLicenseRequest}
                selectedBus={selectedBus}
                pendingImagesByType={pendingImagesByType}
                profileImage={profileImage}
                enrollmentImage={enrollmentImage}
                scheduleImage={scheduleImage}
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
      </div>

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
    </div>
  );
}
