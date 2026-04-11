"use client";

import { useMemo, useState } from "react";
import { useEmployeeAuth } from "@/components/hooks/useEmployeeAuth";
import { SideNav } from "@/components/layout/SideNav";
import { TopBar } from "@/components/layout/TopBar";
import { useCardsData } from "@/components/hooks/useCardsData";
import { usePdfPrint } from "@/components/hooks/usePdfPrint";
import { CardsPageHeader } from "@/components/cards/CardsPageHeader";
import { CardsStatsRow } from "@/components/cards/CardsStatsRow";
import { StudentListPanel } from "@/components/cards/StudentListPanel";
import { StudentDetailPanel } from "@/components/cards/StudentDetailPanel";
import { PdfPreviewModal } from "@/components/cards/PdfPreviewModal";
import { RejectModal } from "@/components/cards/RejectModal";
import { useStudentSelection } from "@/components/hooks/useStudentSelection";

export default function AdminCardsPage() {
  const { user, logout } = useEmployeeAuth();

  const { students, licenses, licenseRequests, loading, error, licensedStudentIds, pendingStudentIds, stats, reload } =
    useCardsData();

  const { selected, currentLicenseRequest, selectStudent } = useStudentSelection(
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
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
              <StudentListPanel
                students={students}
                licenseRequests={licenseRequests}
                licensedStudentIds={licensedStudentIds}
                pendingStudentIds={pendingStudentIds}
                selectedStudent={selected}
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
              />

              <StudentDetailPanel
                selected={selected}
                licenses={licenses}
                licenseRequests={licenseRequests}
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