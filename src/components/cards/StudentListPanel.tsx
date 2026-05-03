import { Loader2 } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import type {
  LicenseRequestRecord,
  PrintableCard,
  StudentFilter,
  StudentRecord,
} from "@/types/cards.types";
import type { Bus } from "@/types/university.types";
import { StudentListItem } from "./StudentListItem";
import { StudentListToolbar } from "./StudentListToolbar";

interface StudentListPanelProps {
  students: StudentRecord[];
  licenseRequests: LicenseRequestRecord[];
  licensedStudentIds: Set<string>;
  pendingStudentIds: Set<string>;
  waitlistedStudentIds: Set<string>;
  selectedStudent: StudentRecord | null;
  selectedForBatch: string[];
  printingBatch: boolean;
  loading: boolean;
  error: string;
  printableCardsByStudentId: Map<string, PrintableCard>;
  onSelectStudent: (student: StudentRecord) => void;
  onToggleBatch: (studentId: string) => void;
  onPrintBatch: () => void;
  largeItems?: boolean;
  bus?: Bus | null;
}

export function StudentListPanel({
  students,
  licenseRequests,
  licensedStudentIds,
  pendingStudentIds,
  waitlistedStudentIds,
  selectedStudent,
  selectedForBatch,
  printingBatch,
  loading,
  error,
  bus = null,
  onSelectStudent,
  onToggleBatch,
  onPrintBatch,
  largeItems = false,
}: StudentListPanelProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StudentFilter>("pending");

  // Clear search when filter is not 'all' to avoid stale queries
  // and ensure search only applies when 'all' is active.
  // Use effect to avoid calling setState during render.
  useEffect(() => {
    // keep search only when filter is 'all' or 'with-card' (Aprovados)
    if (filter !== "all" && filter !== "with-card" && search) {
      setSearch("");
    }
  }, [filter]);

  const cardRelatedStudentIds = useMemo(() => {
    const ids = new Set<string>();

    licensedStudentIds.forEach((id) => ids.add(id));
    licenseRequests.forEach((request) => ids.add(request.studentId));

    return ids;
  }, [licensedStudentIds, licenseRequests]);

  // helper: resolve id from either string or nested object
  const resolveId = (v: unknown): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (typeof v === "object" && v !== null && "_id" in (v as any)) {
      const nested = (v as any)._id;
      return typeof nested === "string" ? nested : null;
    }
    return null;
  };

  // If bus + priority slots exist, compute the set of studentIds that belong to the
  // highest-priority group that currently has requests (for the active `filter`).
  // Determine which studentIds belong to the currently active priority group.
  // Rule (per architecture): find the highest-priority university slot that has
  // ANY active demand (pending OR waitlisted). That university is the active
  // priority — return studentIds from that university that match the current
  // `filter`. IMPORTANT: even if that set is empty (e.g. P1 has only waitlisted
  // but filter === 'pending'), DO NOT fallthrough to lower priorities.
  const priorityFilteredStudentIds = useMemo(() => {
    if (!bus) return null;
    if (filter !== "pending" && filter !== "waitlisted") return null;

    const slots = (bus.universitySlots ?? bus.universityIds ?? []) as any[];
    if (!slots || slots.length === 0) return null;

    // order slots by priorityOrder (default 1)
    const ordered = [...slots].sort((a, b) => (typeof a.priorityOrder === "number" ? a.priorityOrder : 1) - (typeof b.priorityOrder === "number" ? b.priorityOrder : 1));

    for (const slot of ordered) {
      const uniId = typeof slot.universityId === "string" ? slot.universityId : resolveId((slot as any).universityId) ?? resolveId(slot);
      if (!uniId) continue;

      // check for ANY active demand (pending OR waitlisted) for this university
      const hasAnyActiveDemand = licenseRequests.some((r) => {
        const rid = resolveId((r as any).universityId);
        return rid === uniId && (r.status === "pending" || r.status === "waitlisted");
      });

      if (!hasAnyActiveDemand) continue; // no demand -> check next priority

      // This university is the active priority. Return studentIds that match
      // the current filter. Do NOT fallthrough even if empty.
      const matches = licenseRequests.filter((r) => {
        const rid = resolveId((r as any).universityId);
        return rid === uniId && r.status === filter;
      });

      return new Set(matches.map((m) => m.studentId));
    }

    return null;
  }, [bus, licenseRequests, filter]);

  const filteredStudents = useMemo(() => {
    const normalized = (filter === "all" || filter === "with-card") ? search.trim().toLowerCase() : "";
    return students
      .filter((s) => s.active)
      .filter((s) => {
        if (filter === "pending") {
          if (priorityFilteredStudentIds) return priorityFilteredStudentIds.has(s._id);
          return pendingStudentIds.has(s._id);
        }
        if (filter === "waitlisted") {
          if (priorityFilteredStudentIds) return priorityFilteredStudentIds.has(s._id);
          return waitlistedStudentIds.has(s._id);
        }
        if (filter === "with-card") return licensedStudentIds.has(s._id);
        return cardRelatedStudentIds.has(s._id);
      })
      .filter((s) => {
        if (!normalized) return true;
        return (
          s.name.toLowerCase().includes(normalized) ||
          s.email.toLowerCase().includes(normalized) ||
          (s.institution ?? "").toLowerCase().includes(normalized)
        );
      });
  }, [
    students,
    filter,
    search,
    licensedStudentIds,
    pendingStudentIds,
    waitlistedStudentIds,
    cardRelatedStudentIds,
  ]);


  const selectableStudentIds = useMemo(() => {
    try {
      if (filter === "pending") {
        let pendings = licenseRequests.filter((r) => r.status === "pending");
        if (priorityFilteredStudentIds) {
          pendings = pendings.filter((p) => priorityFilteredStudentIds.has(p.studentId));
        }
        if (pendings.length === 0) return new Set<string>();
        pendings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return new Set([pendings[0].studentId]);
      }

      if (filter === "waitlisted") {
        let waitlisted = licenseRequests.filter((r) => r.status === "waitlisted");
        if (priorityFilteredStudentIds) {
          waitlisted = waitlisted.filter((w) => priorityFilteredStudentIds.has(w.studentId));
        }
        if (waitlisted.length === 0) return new Set<string>();
        waitlisted.sort((a, b) => {
          const pa = typeof a.filaPosition === "number" ? a.filaPosition : Number.MAX_VALUE;
          const pb = typeof b.filaPosition === "number" ? b.filaPosition : Number.MAX_VALUE;
          if (pa !== pb) return pa - pb;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return new Set([waitlisted[0].studentId]);
      }

      return new Set<string>();
    } catch {
      return new Set<string>();
    }
  }, [licenseRequests, filter, priorityFilteredStudentIds]);

  const emptyMessage =
    filter === "pending"
      ? "Nenhuma solicitação pendente encontrada."
      : filter === "waitlisted"
        ? "Nenhuma solicitação na fila encontrada."
        : "Nenhuma carteirinha encontrada.";

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
          Carregando carteirinhas...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-error/40 bg-error/10 p-4 text-sm text-error">
          {error}
        </div>
      )}

      {!loading && !error && filteredStudents.length === 0 && (
        <div className="rounded-xl border border-outline-variant bg-surface p-6 text-center text-sm text-on-surface-variant">
          {emptyMessage}
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
            const isSelectable =
              // if set contains entries, only those ids are selectable
              (selectableStudentIds.size === 0 && true) || selectableStudentIds.has(student._id);

            return (
              <StudentListItem
                key={student._id}
                student={student}
                isSelected={selectedStudent?._id === student._id}
                hasCard={licensedStudentIds.has(student._id)}
                latestRequest={latestRequest}
                isInBatch={selectedForBatch.includes(student._id)}
                onSelect={onSelectStudent}
                selectable={isSelectable}
                onToggleBatch={onToggleBatch}
                large={largeItems}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}