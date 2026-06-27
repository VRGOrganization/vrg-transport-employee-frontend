import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "@/services/http";
import {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";
import type { University } from "@/types/university.types";

interface UseCardsDataReturn {
  students: StudentRecord[];
  licenses: LicenseRecord[];
  licenseRequests: LicenseRequestRecord[];
  loading: boolean;
  error: string;
  licensedStudentIds: Set<string>;
  pendingStudentIds: Set<string>;
  waitlistedStudentIds: Set<string>;
  stats: { total: number; withCard: number; pending: number; waitlisted: number; review: number };
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

type RawLicenseRequestRecord = Omit<
  LicenseRequestRecord,
  "studentId" | "busId" | "universityId" | "accessBusIdentifiers"
> & {
  studentId?: unknown;
  busId?: unknown;
  universityId?: unknown;
  accessBusIdentifiers?: unknown;
};

export function useCardsData(university?: University | null): UseCardsDataReturn {
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
        http.get<StudentsResponse>("/student"),
        http.get<LicenseRecord[]>("/license/all"),
        http.get<LicenseRequestRecord[]>("/license-request"),
      ]);

      const resolvedStudents = normalizeArrayResponse<StudentRecord>(studentsResponse);
      const resolvedLicenses = normalizeArrayResponse<LicenseRecord>(licensesResponse);
      const resolvedRequests = normalizeArrayResponse<LicenseRequestRecord>(requestsResponse);

      // Normaliza campos que podem vir como ObjectId / nested objects
      const normalizedRequests = resolvedRequests.map((r: RawLicenseRequestRecord) => ({
        ...r,
        studentId: resolveId(r.studentId) ?? (typeof r.studentId === "string" ? r.studentId : ""),
        busId: resolveId(r.busId) ?? (typeof r.busId === "string" ? r.busId : null),
        universityId: resolveId(r.universityId) ?? (typeof r.universityId === "string" ? r.universityId : null),
        accessBusIdentifiers: Array.isArray(r?.accessBusIdentifiers)
          ? r.accessBusIdentifiers.map((x) => (typeof x === "string" ? x : resolveId(x) ?? String(x)))
          : [],
      })) as LicenseRequestRecord[];

      setLicenses(resolvedLicenses);

      const universityId = university?._id ?? null;

      if (universityId) {
        const filteredRequests = normalizedRequests.filter((request) => {
          const requestUniversityId = resolveId(request.universityId);
          return requestUniversityId === universityId;
        });

        const universityStudentIds = new Set(filteredRequests.map((request) => resolveId(request.studentId) ?? request.studentId));
        const universityStudents = resolvedStudents.filter((student) => universityStudentIds.has(student._id));

        setStudents(universityStudents);
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
  }, [university]);

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

  // Aba "Revisão": atualizações de documentos pendentes (type "update") +
  // pedidos enviados para revisão (status "revision").
  const reviewStudentIds = useMemo(
    () =>
      new Set(
        licenseRequests
          .filter(
            (r) =>
              (r.type === "update" && r.status === "pending") ||
              r.status === "revision",
          )
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
    const review = activeStudents.filter((s) => reviewStudentIds.has(s._id)).length;
    return { total, withCard, pending, waitlisted, review };
  }, [students, licensedStudentIds, pendingStudentIds, waitlistedStudentIds, reviewStudentIds]);

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
