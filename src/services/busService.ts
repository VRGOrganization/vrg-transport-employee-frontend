import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { Bus, BusCreateInput, BusStudent, BusRoute, BusUpdateInput } from "@/types/university.types";

export const busService = {
  list:               ()                                   => http.get<Paginated<Bus>>("/bus").then(resolvePaginated),
  listActive:         ()                                   => http.get<Paginated<Bus>>("/bus/active").then(resolvePaginated),
  listInactive:       ()                                   => http.get<Paginated<Bus>>("/bus/inactive").then(resolvePaginated),
  listWithQueueCounts: async () => {
    const [busList, queueResult] = await Promise.all([
      http.get<Paginated<Bus>>("/bus").then(resolvePaginated),
      // O backend (bus-queue-query.service → QueueCountsPerBus) devolve
      // `activeCount` e `waitlistedCount`. Não existe `pendingCount` aqui —
      // tipá-lo fazia o campo chegar sempre `undefined` e a UI mostrar 0.
      http.get<{ enrollmentCycleId: string | null; buses: Array<{ busId: string; busIdentifier?: string; activeCount: number; waitlistedCount: number }> }>("/bus/queue"),
    ]);
    const queueMapById = new Map(
      (queueResult.buses ?? []).map((q) => [q.busId, q]),
    );
    const queueMapByIdentifier = new Map(
      (queueResult.buses ?? [])
        .filter((q) => !!q.busIdentifier)
        .map((q) => [q.busIdentifier!, q]),
    );
    return busList.map((bus) => {
      const q =
        queueMapById.get((bus as unknown as { _id: string })._id) ??
        queueMapByIdentifier.get(bus.identifier);
      return {
        ...bus,
        activeCount: q?.activeCount ?? (bus as unknown as { activeCount?: number }).activeCount,
        waitlistedCount: q?.waitlistedCount ?? (bus as unknown as { waitlistedCount?: number }).waitlistedCount,
      };
    });
  },
  create:             (data: BusCreateInput) =>
                        http.post<Bus>("/bus", data),
  update:             (id: string, data: BusUpdateInput) =>
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
