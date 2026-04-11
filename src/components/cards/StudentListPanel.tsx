import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import type {
  LicenseRequestRecord,
  PrintableCard,
  StudentFilter,
  StudentRecord,
} from "@/types/cards.types";
import { StudentListItem } from "./StudentListItem";
import { StudentListToolbar } from "./StudentListToolbar";

interface StudentListPanelProps {
  students: StudentRecord[];
  licenseRequests: LicenseRequestRecord[];
  licensedStudentIds: Set<string>;
  pendingStudentIds: Set<string>;
  selectedStudent: StudentRecord | null;
  selectedForBatch: string[];
  printingBatch: boolean;
  loading: boolean;
  error: string;
  printableCardsByStudentId: Map<string, PrintableCard>;
  onSelectStudent: (student: StudentRecord) => void;
  onToggleBatch: (studentId: string) => void;
  onPrintBatch: () => void;
}

export function StudentListPanel({
  students,
  licenseRequests,
  licensedStudentIds,
  pendingStudentIds,
  selectedStudent,
  selectedForBatch,
  printingBatch,
  loading,
  error,
  onSelectStudent,
  onToggleBatch,
  onPrintBatch,
}: StudentListPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("pending");

  const filteredStudents = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return students
      .filter((s) => s.active)
      .filter((s) => {
        if (filter === "pending") return pendingStudentIds.has(s._id);
        if (filter === "with-card") return licensedStudentIds.has(s._id);
        return true;
      })
      .filter((s) => {
        if (!normalized) return true;
        return (
          s.name.toLowerCase().includes(normalized) ||
          s.email.toLowerCase().includes(normalized) ||
          (s.institution ?? "").toLowerCase().includes(normalized)
        );
      });
  }, [students, filter, search, licensedStudentIds, pendingStudentIds]);

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:p-5">
      <StudentListToolbar
        search={search}
        filter={filter}
        selectedForBatchCount={selectedForBatch.length}
        printingBatch={printingBatch}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onPrintBatch={onPrintBatch}
      />

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
            const latestRequest =
              licenseRequests
                .filter((r) => r.studentId === student._id)
                .sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
                )[0] ?? null;

            return (
              <StudentListItem
                key={student._id}
                student={student}
                isSelected={selectedStudent?._id === student._id}
                hasCard={licensedStudentIds.has(student._id)}
                latestRequest={latestRequest}
                isInBatch={selectedForBatch.includes(student._id)}
                onSelect={onSelectStudent}
                onToggleBatch={onToggleBatch}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}