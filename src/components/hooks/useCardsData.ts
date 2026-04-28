import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";
import type { Bus } from "@/types/university.types";

interface UseCardsDataReturn {
  students: StudentRecord[];
  licenses: LicenseRecord[];
  licenseRequests: LicenseRequestRecord[];
  loading: boolean;
  error: string;
  licensedStudentIds: Set<string>;
  pendingStudentIds: Set<string>;
  waitlistedStudentIds: Set<string>;
  stats: { total: number; withCard: number; pending: number; waitlisted: number };
  reload: () => Promise<void>;
}

function normalizeArrayResponse<T>(
  response: T[] | { data?: T[] } | null | undefined,
): T[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray((response as { data?: T[] } | null | undefined)?.data)) {
    return (response as { data?: T[] }).data ?? [];
  }
  return [];
}

function resolveId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const nested = (value as { _id?: unknown })._id;
    return typeof nested === "string" ? nested : null;
  }
  return null;
}

function normalizeIdentifierValue(value: unknown): string | null {
  const v = resolveId(value) ?? (typeof value === 'string' ? value : null);
  if (!v) return null;
  return String(v).replace(/^0+/, '');
}

export function useCardsData(bus?: Bus | null): UseCardsDataReturn {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licenseRequests, setLicenseRequests] = useState<LicenseRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [studentsResponse, licensesResponse, requestsResponse] = await Promise.all([
        employeeApi.get<StudentsResponse>("/student"),
        employeeApi.get<LicenseRecord[]>("/license/all"),
        employeeApi.get<LicenseRequestRecord[]>("/license-request/all"),
      ]);

      const resolvedStudents = normalizeArrayResponse<StudentRecord>(studentsResponse);
      const resolvedLicenses = normalizeArrayResponse<LicenseRecord>(licensesResponse);
      const resolvedRequests = normalizeArrayResponse<LicenseRequestRecord>(requestsResponse);

      // Normaliza campos que podem vir como ObjectId / nested objects
      const normalizedRequests = resolvedRequests.map((r: any) => ({
        ...r,
        studentId: resolveId((r as any).studentId) ?? r.studentId,
        busId: resolveId((r as any).busId) ?? r.busId,
        universityId: resolveId((r as any).universityId) ?? r.universityId,
        accessBusIdentifiers: Array.isArray(r?.accessBusIdentifiers)
          ? r.accessBusIdentifiers.map((x: any) => (typeof x === 'string' ? x : resolveId(x) ?? String(x)))
          : [],
      })) as LicenseRequestRecord[];

      setLicenses(resolvedLicenses);

      const busId = bus?._id ?? null;
      const busIdentifier = bus?.identifier ?? null;

      if (busId || busIdentifier) {
        const filteredRequests = normalizedRequests.filter((request) => {
          const requestBusId = resolveId((request as any).busId);
          // approved requests must match exact bus._id
          if (request.status === "approved") {
            return requestBusId === busId;
          }

          if (requestBusId === busId) return true;

          // compare normalized identifiers (strip leading zeros) against accessBusIdentifiers
          if (busIdentifier) {
            const normalizedSelected = normalizeIdentifierValue(busIdentifier);
            if (!normalizedSelected) return false;

            const access = (request.accessBusIdentifiers ?? []) as any[];
            const normalizedAccess = access.map((a) => normalizeIdentifierValue(a)).filter(Boolean) as string[];
            if (normalizedAccess.includes(normalizedSelected)) return true;
          }

          return false;
        });

        const busStudentIds = new Set(filteredRequests.map((request) => resolveId((request as any).studentId) ?? request.studentId));
        const busStudents = resolvedStudents.filter((student) => busStudentIds.has(student._id));

        setStudents(busStudents);
        setLicenseRequests(filteredRequests);
      } else {
        setStudents(resolvedStudents);
        setLicenseRequests(normalizedRequests);
      }
    } catch {
      setError("Não foi possível carregar os dados de revisão de carteirinhas.");
    } finally {
      setLoading(false);
    }
  }, [bus]);

  useEffect(() => {
    reload();
  }, [reload]);

  const licensedStudentIds = useMemo(
    () => new Set(licenses.map((l) => l.studentId)),
    [licenses],
  );

  const pendingStudentIds = useMemo(
    () =>
      new Set(
        licenseRequests
          .filter((r) => r.status === "pending")
          .map((r) => r.studentId),
      ),
    [licenseRequests],
  );

  const waitlistedStudentIds = useMemo(
    () =>
      new Set(
        licenseRequests
          .filter((r) => r.status === "waitlisted")
          .map((r) => r.studentId),
      ),
    [licenseRequests],
  );

  const stats = useMemo(() => {
    const activeStudents = students.filter((s) => s.active);
    const total = activeStudents.length;
    const withCard = activeStudents.filter((s) => licensedStudentIds.has(s._id)).length;
    const pending = activeStudents.filter((s) => pendingStudentIds.has(s._id)).length;
    const waitlisted = activeStudents.filter((s) => waitlistedStudentIds.has(s._id)).length;
    return { total, withCard, pending, waitlisted };
  }, [students, licensedStudentIds, pendingStudentIds, waitlistedStudentIds]);

  return {
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
  };
}
