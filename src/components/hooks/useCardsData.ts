import { useCallback, useEffect, useMemo, useState } from "react";
import { http } from "@/services/http";
import {
  LicenseRecord,
  LicenseRequestRecord,
  StudentRecord,
  StudentsResponse,
} from "@/types/cards.types";

/** Recorte da fila: por faculdade ou por ônibus. `null` carrega tudo. */
export type CardsScope =
  | { kind: "university"; universityId: string }
  | { kind: "bus"; busId: string }
  | null;

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
  /** Passe `{ silent: true }` pra refresh de background (ex.: auto-refresh)
   * que não deve derrubar a lista pra um spinner de tela cheia. */
  reload: (opts?: { silent?: boolean }) => Promise<void>;
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

/**
 * Pedido pertence ao ônibus quando algum dia do resumo de alocações cai nele.
 * Sem resumo, vale o `busId` do pedido. Pedido com ida e volta em ônibus
 * diferentes aparece nos dois.
 */
export function requestUsesBus(request: LicenseRequestRecord, busId: string): boolean {
  const summary = request.allocationSummary ?? [];
  if (summary.some((entry) => entry.busId === busId)) return true;
  return summary.length === 0 && resolveId(request.busId) === busId;
}

export function useCardsData(scope?: CardsScope): UseCardsDataReturn {
  // Primitivos nas dependências: o escopo costuma ser recriado a cada render.
  const scopeKind = scope?.kind ?? null;
  const scopeId = scope ? (scope.kind === "university" ? scope.universityId : scope.busId) : null;

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);
  const [licenseRequests, setLicenseRequests] = useState<LicenseRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    setError("");
    try {
      const [studentsResponse, licensesResponse, requestsResponse] = await Promise.all([
        http.get<StudentsResponse>("/student"),
        http.get<LicenseRecord[]>("/license/all"),
        // limit alto: a fila é ordenada por prioridade → FIFO no cliente, então
        // precisamos do conjunto completo (um teto baixo truncaria a fila).
        http.get<LicenseRequestRecord[]>("/license-request?limit=1000"),
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

      if (scopeKind && scopeId) {
        const filteredRequests = normalizedRequests.filter((request) =>
          scopeKind === "university"
            ? resolveId(request.universityId) === scopeId
            : requestUsesBus(request, scopeId),
        );

        const scopedStudentIds = new Set(filteredRequests.map((request) => resolveId(request.studentId) ?? request.studentId));
        const scopedStudents = resolvedStudents.filter((student) => scopedStudentIds.has(student._id));

        setStudents(scopedStudents);
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
  }, [scopeKind, scopeId]);

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
