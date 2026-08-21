import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  BusPass,
  BusPassSettings,
  BusPassStatus,
  CivilDate,
  UpdateBusPassSettingsPayload,
} from "@/types/busPass";

import { http } from "./http";

export interface ListBusPassesFilters {
  status?: BusPassStatus[];
  travelDate?: CivilDate;
  travelDateFrom?: CivilDate;
  travelDateTo?: CivilDate;
  busId?: string;
  universityId?: string;
  page?: number;
  limit?: number;
}

function toQuery(filters: ListBusPassesFilters): string {
  const params = new URLSearchParams();

  // `status` repete a chave; o DTO do backend aceita tanto isso quanto CSV.
  filters.status?.forEach((status) => params.append("status", status));

  const single: Array<[string, string | number | undefined]> = [
    ["travelDate", filters.travelDate],
    ["travelDateFrom", filters.travelDateFrom],
    ["travelDateTo", filters.travelDateTo],
    ["busId", filters.busId],
    ["universityId", filters.universityId],
    ["page", filters.page],
    ["limit", filters.limit],
  ];

  for (const [key, value] of single) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export interface PaginatedBusPasses {
  data: BusPass[];
  total: number;
}

export const busPassService = {
  list: (filters: ListBusPassesFilters = {}) =>
    http
      .get<Paginated<BusPass>>(`/bus-pass${toQuery(filters)}`)
      .then(resolvePaginated),

  /**
   * Envelope cru, com `total` do backend — usado pela fila, que pagina de
   * verdade no servidor. `list()` continua devolvendo só o array pra quem já
   * dependia disso (ex.: `manifest`-like consumidores que buscam tudo de uma vez).
   */
  listPaginated: (filters: ListBusPassesFilters = {}): Promise<PaginatedBusPasses> =>
    http.get<Paginated<BusPass>>(`/bus-pass${toQuery(filters)}`).then((payload) => {
      const data = resolvePaginated(payload);
      const total = Array.isArray(payload) ? data.length : (payload.total ?? data.length);
      return { data, total };
    }),

  detail: (id: string) => http.get<BusPass>(`/bus-pass/${id}`),

  /** Manifesto: aprovados de uma data, opcionalmente de um ônibus só. */
  manifest: (date: CivilDate, busId?: string) =>
    http.get<BusPass[]>(
      `/bus-pass/manifest?date=${date}${busId ? `&busId=${busId}` : ""}`,
    ),

  /**
   * Responde 409 com `conflict` quando o ônibus lotou entre o pedido e a
   * aprovação — a tela usa isso para oferecer negar ou devolver ao aluno.
   */
  approve: (id: string) => http.patch<BusPass>(`/bus-pass/${id}/approve`, {}),

  reject: (id: string, reason: string) =>
    http.patch<BusPass>(`/bus-pass/${id}/reject`, { reason }),

  requestRevision: (id: string, reason: string) =>
    http.patch<BusPass>(`/bus-pass/${id}/request-revision`, { reason }),

  revoke: (id: string, reason: string) =>
    http.patch<BusPass>(`/bus-pass/${id}/revoke`, { reason }),

  // ── Configurações (somente ADMIN) ─────────────────────────────────────────
  getSettings: () => http.get<BusPassSettings>("/bus-pass/settings"),

  updateSettings: (payload: UpdateBusPassSettingsPayload) =>
    http.patch<BusPassSettings>("/bus-pass/settings", payload),
};
