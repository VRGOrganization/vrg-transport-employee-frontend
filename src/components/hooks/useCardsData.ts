import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeApi } from "@/lib/employeeApi";
import { LicenseRecord, LicenseRequestRecord, StudentRecord, StudentsResponse } from "@/types/cards.types";


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

export function useCardsData(): UseCardsDataReturn {
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
      const resolvedStudents = Array.isArray(studentsResponse)
        ? studentsResponse
        : Array.isArray(studentsResponse?.data)
          ? studentsResponse.data
          : [];

      setStudents(resolvedStudents);
      setLicenses(licensesResponse);
      setLicenseRequests(requestsResponse);
    } catch {
      setError("Não foi possível carregar os dados de revisão de carteirinhas.");
    } finally {
      setLoading(false);
    }
  }, []);

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