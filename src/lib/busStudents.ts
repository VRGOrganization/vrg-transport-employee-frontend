import type { Bus, BusStudent } from "@/types/university.types";
import type {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
} from "@/types/cards.types";

export function resolveId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const nested = (value as { _id?: unknown })._id;
    return typeof nested === "string" ? nested : null;
  }
  return null;
}

function normalizeIdentifierValue(value: unknown): string | null {
  const v = resolveId(value) ?? (typeof value === "string" ? value : null);
  if (!v) return null;
  return String(v).replace(/^0+/, "");
}

/**
 * Mirrors the /admin/cards "Aprovados" tab for a single bus.
 *
 * Returns exactly the students that appear under that tab when this bus is
 * selected: active students that belong to the bus (via a license-request
 * matching the bus) AND already have a license issued. The filtering rules are
 * kept in lock-step with `useCardsData` so the bus drawer / fleet card count
 * and the cards page never diverge.
 */
export function getApprovedBusStudents(
  students: StudentRecord[],
  licenses: LicenseRecord[],
  licenseRequests: LicenseRequestRecord[],
  bus: Pick<Bus, "_id" | "identifier">,
): BusStudent[] {
  const busId = bus._id;
  const busIdentifier = bus.identifier ?? null;
  const licensedStudentIds = new Set(licenses.map((l) => l.studentId));

  // Same bus-membership filter used by useCardsData.
  const matchingRequests = licenseRequests.filter((request) => {
    const requestBusId = resolveId(request.busId);
    if (requestBusId === busId) return true;

    // Aluno integral pode estar alocado em múltiplos ônibus (ida ≠ volta).
    // accessBusIdentifiers lista todos os ônibus do request — checar em todos os
    // statuses, inclusive approved.
    if (busIdentifier) {
      const normalizedSelected = normalizeIdentifierValue(busIdentifier);
      if (!normalizedSelected) return false;
      const access = request.accessBusIdentifiers ?? [];
      const normalizedAccess = access
        .map((a) => normalizeIdentifierValue(a))
        .filter(Boolean) as string[];
      if (normalizedAccess.includes(normalizedSelected)) return true;
    }

    return false;
  });

  const busStudentIds = new Set(
    matchingRequests.map((r) => resolveId(r.studentId) ?? r.studentId),
  );

  // studentId -> universityId, preferring the approved request's university.
  const universityByStudent = new Map<string, string | null>();
  for (const r of matchingRequests) {
    const sid = resolveId(r.studentId) ?? r.studentId;
    if (!sid) continue;
    if (r.status === "approved" || !universityByStudent.has(sid)) {
      universityByStudent.set(sid, resolveId(r.universityId));
    }
  }

  // studentId -> licenseRequest for day extraction (prefer approved).
  const requestByStudentForDays = new Map<string, LicenseRequestRecord>();
  for (const r of matchingRequests) {
    const sid = resolveId(r.studentId) ?? r.studentId;
    if (!sid) continue;
    if (r.status === "approved" || !requestByStudentForDays.has(sid)) {
      requestByStudentForDays.set(sid, r);
    }
  }
  const normalizedBusIdentifier = normalizeIdentifierValue(busIdentifier ?? "");

  return students
    .filter((s) => busStudentIds.has(s._id))
    .filter((s) => s.active && licensedStudentIds.has(s._id))
    .map((s) => {
      const req = requestByStudentForDays.get(s._id);
      const days = [
        ...new Set(
          (req?.allocationSummary ?? [])
            .filter((e) => {
              if (e.status !== "active") return false;
              if (e.busId && e.busId === busId) return true;
              const normEntry = normalizeIdentifierValue(e.busIdentifier ?? "");
              return !!(normalizedBusIdentifier && normEntry && normalizedBusIdentifier === normEntry);
            })
            .map((e) => e.day),
        ),
      ];
      return {
        _id: s._id,
        name: s.name,
        socialName: s.socialName,
        email: s.email,
        shift: s.shift,
        universityId: universityByStudent.get(s._id) ?? undefined,
        days,
      };
    });
}
