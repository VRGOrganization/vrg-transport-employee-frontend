import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PanelCard } from "@/components/ui/PanelCard";
import type {
  LicenseRequestRecord,
  PrintableCard,
  StudentFilter,
  StudentRecord,
} from "@/types/cards.types";
import type { Bus } from "@/types/university.types";
import { StudentListItem } from "./StudentListItem";
import { StudentListToolbar } from "./StudentListToolbar";

type PrioritySlot = {
  universityId?: unknown;
  priorityOrder?: number;
  _id?: unknown;
} | string;

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
  onSetBatch: (ids: string[]) => void;
  onPrintBatch: () => void;
  largeItems?: boolean;
  bus?: Bus | null;
  showReview?: boolean;
  /** Modo controlled: quando fornecidos, o filtro é gerido pelo componente pai. */
  filter?: StudentFilter;
  onFilterChange?: (filter: StudentFilter) => void;
  title?: string;
  description?: string;
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
  onSetBatch,
  onPrintBatch,
  largeItems = false,
  showReview = false,
  filter: filterProp,
  onFilterChange,
  title,
  description,
}: StudentListPanelProps) {
  const [search, setSearch] = useState("");
  const [internalFilter, setInternalFilter] = useState<StudentFilter>("pending");

  // Controlled quando `filter`/`onFilterChange` são passados; senão usa estado interno.
  const filter = filterProp ?? internalFilter;
  const setFilter = (next: StudentFilter) => {
    if (onFilterChange) onFilterChange(next);
    else setInternalFilter(next);
  };

  const resolveId = (v: unknown): string | null => {
    if (!v) return null;
    if (typeof v === "string") return v;
    if (typeof v === "object" && v !== null && "_id" in v) {
      const nested = (v as { _id?: unknown })._id;
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

    const slots = (bus.universitySlots ?? bus.universityIds ?? []) as PrioritySlot[];
    if (!slots || slots.length === 0) return null;

    // order slots by priorityOrder (default 1)
    const priorityOrder = (slot: PrioritySlot) =>
      typeof slot === "object" && typeof slot.priorityOrder === "number" ? slot.priorityOrder : 1;
    const ordered = [...slots].sort((a, b) => priorityOrder(a) - priorityOrder(b));

    for (const slot of ordered) {
      const uniId =
        typeof slot === "object" ? resolveId(slot.universityId) ?? resolveId(slot) : resolveId(slot);
      if (!uniId) continue;

      // check for ANY active demand (pending OR waitlisted) for this university
      const hasAnyActiveDemand = licenseRequests.some((r) => {
        const rid = resolveId(r.universityId);
        return rid === uniId && (r.status === "pending" || r.status === "waitlisted");
      });

      if (!hasAnyActiveDemand) continue; // no demand -> check next priority

      // This university is the active priority. Return studentIds that match
      // the current filter. Do NOT fallthrough even if empty.
      const matches = licenseRequests.filter((r) => {
        const rid = resolveId(r.universityId);
        return rid === uniId && r.status === filter;
      });

      return new Set(matches.map((m) => m.studentId));
    }

    return null;
  }, [bus, licenseRequests, filter]);

  // Aba "Revisão": atualizações de documentos pendentes (type "update") +
  // pedidos enviados para revisão (status "revision").
  const reviewStudentIds = useMemo(() => {
    return new Set(
      licenseRequests
        .filter(
          (r) =>
            (r.type === "update" && r.status === "pending") ||
            r.status === "revision",
        )
        .map((r) => r.studentId),
    );
  }, [licenseRequests]);

  // Mapa studentId -> pedido pendente (para ordenar a fila por prioridade → FIFO).
  // priorityLevel vem recalculado do backend com as regras ATUAIS; ausente = 3
  // (mesmo default do backend). Menor priorityLevel = maior prioridade.
  const pendingRequestByStudent = useMemo(() => {
    const map = new Map<string, { priorityLevel: number; createdAt: string }>();
    for (const r of licenseRequests) {
      if (r.status !== "pending") continue;
      map.set(r.studentId, {
        priorityLevel: typeof r.priorityLevel === "number" ? r.priorityLevel : 3,
        createdAt: r.createdAt,
      });
    }
    return map;
  }, [licenseRequests]);

  const filteredStudents = useMemo(() => {
    const normalized = filter === "with-card" ? search.trim().toLowerCase() : "";
    const list = students
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
        if (filter === "review") return reviewStudentIds.has(s._id);
        return false;
      })
      .filter((s) => {
        if (!normalized) return true;
        return (
          s.name.toLowerCase().includes(normalized) ||
          (s.socialName ?? "").toLowerCase().includes(normalized) ||
          s.email.toLowerCase().includes(normalized) ||
          (s.institution ?? "").toLowerCase().includes(normalized)
        );
      });

    // A fila de pendentes é exibida na ordem de aprovação: prioridade
    // (priorityLevel asc) e, dentro do mesmo nível, FIFO por createdAt asc.
    if (filter === "pending") {
      list.sort((a, b) => {
        const ra = pendingRequestByStudent.get(a._id);
        const rb = pendingRequestByStudent.get(b._id);
        const pa = ra?.priorityLevel ?? 3;
        const pb = rb?.priorityLevel ?? 3;
        if (pa !== pb) return pa - pb;
        const ta = ra ? new Date(ra.createdAt).getTime() : 0;
        const tb = rb ? new Date(rb.createdAt).getTime() : 0;
        return ta - tb;
      });
    }

    return list;
  }, [
    students,
    filter,
    search,
    licensedStudentIds,
    pendingStudentIds,
    waitlistedStudentIds,
    reviewStudentIds,
    priorityFilteredStudentIds,
    pendingRequestByStudent,
  ]);


  const selectableStudentIds = useMemo(() => {
    try {
      if (filter === "pending") {
        const initialPendings = licenseRequests.filter((r) => r.status === "pending");
        const pendings = priorityFilteredStudentIds
          ? initialPendings.filter((p) => priorityFilteredStudentIds.has(p.studentId))
          : initialPendings;
        if (pendings.length === 0) return new Set<string>();
        // Próximo a aprovar = maior prioridade (priorityLevel asc, recalculado
        // pelo backend) e, empatando, o mais antigo (FIFO por createdAt asc).
        pendings.sort((a, b) => {
          const pa = typeof a.priorityLevel === "number" ? a.priorityLevel : 3;
          const pb = typeof b.priorityLevel === "number" ? b.priorityLevel : 3;
          if (pa !== pb) return pa - pb;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        return new Set([pendings[0].studentId]);
      }

      if (filter === "waitlisted") {
        const initialWaitlisted = licenseRequests.filter((r) => r.status === "waitlisted");
        const waitlisted = priorityFilteredStudentIds
          ? initialWaitlisted.filter((w) => priorityFilteredStudentIds.has(w.studentId))
          : initialWaitlisted;
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

  // Select all logic (only relevant for "with-card" filter)
  const approvedStudentIds = useMemo(
    () => (filter === "with-card" ? filteredStudents.map((s) => s._id) : []),
    [filter, filteredStudents],
  );
  const isAllSelected =
    approvedStudentIds.length > 0 &&
    approvedStudentIds.every((id) => selectedForBatch.includes(id));
  const isSomeSelected =
    !isAllSelected && approvedStudentIds.some((id) => selectedForBatch.includes(id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      onSetBatch([]);
    } else {
      onSetBatch(approvedStudentIds);
    }
  };

  const emptyMessage =
    filter === "pending"
      ? "Nenhuma solicitação pendente encontrada."
      : filter === "waitlisted"
        ? "Nenhuma solicitação na fila encontrada."
        : filter === "review"
          ? "Nenhuma solicitação de atualização pendente."
          : "Nenhuma carteirinha encontrada.";

  return (
    <PanelCard as="section" className="md:p-5">
      <StudentListToolbar
        search={search}
        filter={filter}
        selectedForBatchCount={selectedForBatch.length}
        printingBatch={printingBatch}
        isAllSelected={isAllSelected}
        isSomeSelected={isSomeSelected}
        hasApproved={approvedStudentIds.length > 0}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onPrintBatch={onPrintBatch}
        onSelectAll={handleSelectAll}
        showReview={showReview}
      />

      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-base font-bold text-on-surface">{title}</h2>}
          {description && (
            <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface p-4 text-sm text-on-surface-variant">
          <Loader2 className="size-4 animate-spin" />
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
    </PanelCard>
  );
}
