import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { Bus, BusStudent, BusRoute } from "@/types/university.types";

export const busService = {
  list:               ()                                   => http.get<Paginated<Bus>>("/bus").then(resolvePaginated),
  listActive:         ()                                   => http.get<Paginated<Bus>>("/bus/active").then(resolvePaginated),
  listInactive:       ()                                   => http.get<Paginated<Bus>>("/bus/inactive").then(resolvePaginated),
  listWithQueueCounts: async () => {
    const [busList, queueResult] = await Promise.all([
      http.get<Paginated<Bus>>("/bus").then(resolvePaginated),
      http.get<{ enrollmentPeriodId: string | null; buses: Array<{ busId: string; pendingCount: number; waitlistedCount: number }> }>("/bus/queue"),
    ]);
    const queueMap = new Map(
      (queueResult.buses ?? []).map((q) => [q.busId, q])
    );
    return busList.map((bus) => {
      const q = queueMap.get((bus as unknown as { _id: string })._id);
      return { ...bus, pendingCount: q?.pendingCount ?? (bus as unknown as { pendingCount?: number }).pendingCount, waitlistedCount: q?.waitlistedCount ?? (bus as unknown as { waitlistedCount?: number }).waitlistedCount };
    });
  },
  create:             (data: { identifier: string; capacity?: number | null; shift?: string }) =>
                        http.post<Bus>("/bus", data),
  update:             (id: string, data: Partial<{ identifier: string; capacity?: number | null; shift?: string }>) =>
                        http.patch<Bus>(`/bus/${id}`, data),
  deactivate:         (id: string)                         => http.patch<{ message: string }>(`/bus/${id}/deactivate`, {}),
  reactivate:         (id: string)                         => http.patch<{ message: string }>(`/bus/${id}/activate`, {}),
  linkUniversity:     (busId: string, universityId: string) =>
                        http.post<Bus>(`/bus/${busId}/link-university`, { universityId }),
  unlinkUniversity:   (busId: string, universityId: string) =>
                        http.post<Bus>(`/bus/${busId}/unlink-university`, { universityId }),
  studentsByBus:      (busIdentifier: string) =>
                        http.get<BusStudent[]>(`/student/by-bus/${encodeURIComponent(busIdentifier)}`),
  studentsByBusId:    (busId: string) =>
                        http.get<BusStudent[]>(`/student/by-bus-id/${encodeURIComponent(busId)}`),
  updateUniversitySlots: (busId: string, slots: Array<{ universityId: string; priorityOrder: number }>) =>
                        http.put<Bus>(`/bus/${busId}/university-slots`, { slots }),
  releaseSlots: (busId: string, promote?: boolean, quantity?: number) => {
    const params: string[] = [];
    if (promote !== undefined) params.push(`promote=${promote}`);
    if (quantity !== undefined && quantity !== null) params.push(`quantity=${encodeURIComponent(String(quantity))}`);
    const qs = params.length ? `?${params.join("&")}` : "";
    return http.post<unknown>(`/bus/${encodeURIComponent(busId)}/release-slots${qs}`, undefined);
  },
};

export const busRouteService = {
  list:       ()           => http.get<BusRoute[]>("/bus"),
  listInactive: ()         => http.get<BusRoute[]>("/bus/inactive"),
  getById:    (id: string) => http.get<BusRoute>(`/bus/${id}`),
};
