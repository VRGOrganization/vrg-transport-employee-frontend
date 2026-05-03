import { employeeApi } from "@/lib/employeeApi";
import type {
  University,
  Course,
  Bus,
  BusStudent,
  BusRoute,
  BusQueueSummary,
} from "@/types/university.types";

// ── Universities ──────────────────────────────────────────────

export const universityApi = {
  list: () => employeeApi.get<University[]>("/university"),
  listInactive: () => employeeApi.get<University[]>("/university/inactive"),
  getById: (id: string) => employeeApi.get<University>(`/university/${id}`),
  create: (data: { name: string; acronym: string; address: string }) =>
    employeeApi.post<University>("/university", data),
  update: (id: string, data: Partial<{ name: string; acronym: string; address: string }>) =>
    employeeApi.patch<University>(`/university/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/university/${id}`),
};

// ── Courses ───────────────────────────────────────────────────

export const courseApi = {
  list: () => employeeApi.get<Course[]>("/course"),
  listByUniversity: (universityId: string) =>
    employeeApi.get<Course[]>(`/course/by-university/${universityId}`),
  create: (data: { name: string; universityId: string }) =>
    employeeApi.post<Course>("/course", data),
  update: (id: string, data: { name: string }) =>
    employeeApi.patch<Course>(`/course/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/course/${id}`),
};

// ── Buses ─────────────────────────────────────────────────────

export const busApi = {
  list: () => employeeApi.get<Bus[]>("/bus"),
  listInactive: () => employeeApi.get<Bus[]>("/bus/inactive"),
  // Lista com contagens de fila/pendentes por ônibus (anônimo)
  listWithQueueCounts: () => employeeApi.get<Bus[]>("/bus/with-queue-counts"),
  create: (data: { identifier: string; capacity?: number | null; shift?: string }) =>
    employeeApi.post<Bus>("/bus", data),
  update: (id: string, data: Partial<{ identifier: string; capacity?: number | null; shift?: string }>) =>
    employeeApi.patch<Bus>(`/bus/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/bus/${id}`),
  linkUniversity: (busId: string, universityId: string) =>
    employeeApi.patch<Bus>(`/bus/${busId}/link-university`, { universityId }),
  unlinkUniversity: (busId: string, universityId: string) =>
    employeeApi.patch<Bus>(`/bus/${busId}/unlink-university`, { universityId }),
  // Busca alunos por identifier (legado)
  studentsByBus: (busIdentifier: string) =>
    employeeApi.get<BusStudent[]>(`/student/by-bus/${encodeURIComponent(busIdentifier)}`),
  // Novo endpoint para buscar alunos por busId
  studentsByBusId: (busId: string) =>
    employeeApi.get<BusStudent[]>(`/student/by-bus-id/${encodeURIComponent(busId)}`),
  // Atualiza a lista de universitySlots (substitui completamente)
  updateUniversitySlots: (busId: string, slots: Array<{ universityId: string; priorityOrder: number }>) =>
    employeeApi.patch<Bus>(`/bus/${busId}/university-slots`, { slots }),
  // Liberar vagas do ônibus — query params `promote` (true/false) e `quantity` (número)
  releaseSlots: (busId: string, promote?: boolean, quantity?: number) => {
    const params: string[] = [];
    if (promote !== undefined) params.push(`promote=${promote}`);
    if (quantity !== undefined && quantity !== null) params.push(`quantity=${encodeURIComponent(String(quantity))}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return employeeApi.patch<unknown>(`/bus/${encodeURIComponent(busId)}/release-slots${qs}`, undefined);
  },
  // Resumo detalhado da fila de um ônibus (pendentes + waitlisted por universidade)
  getQueueSummary: (busId: string) =>
    employeeApi.get<BusQueueSummary>(`/bus/${busId}/queue-summary`),
  // Recalcula filledSlots com base nos alunos reais (operação de manutenção)
  resyncFilledSlots: (busId: string) =>
    employeeApi.patch<Bus>(`/bus/${busId}/resync-filled-slots`, undefined),
};

// â”€â”€ Bus Routes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const busRouteApi = {
  list: () => employeeApi.get<BusRoute[]>("/bus"),
  listInactive: () => employeeApi.get<BusRoute[]>("/bus/inactive"),
  getById: (id: string) => employeeApi.get<BusRoute>(`/bus/${id}`),
};
