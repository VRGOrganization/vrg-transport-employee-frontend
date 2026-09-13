import { http } from "./http";
import type {
  AuditEvent,
  AuditFilters,
  AuditParticipant,
} from "@/types/audit";

export interface AuditListResult {
  data: AuditEvent[];
  total: number;
  page: number;
  limit: number;
}

function buildQuery(filters: AuditFilters): string {
  const params = new URLSearchParams();
  const entries: [string, string | number | undefined][] = [
    ["page", filters.page],
    ["limit", filters.limit],
    ["action", filters.action],
    ["actionPrefix", filters.actionPrefix],
    ["actorId", filters.actorId],
    ["actorRoles", filters.actorRoles],
    ["outcome", filters.outcome],
    ["from", filters.from],
    ["to", filters.to],
  ];
  for (const [key, value] of entries) {
    if (value !== undefined && value !== null && `${value}` !== "") {
      params.set(key, String(value));
    }
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const auditService = {
  list: (filters: AuditFilters = {}) =>
    http.get<AuditListResult>(`/audit${buildQuery(filters)}`),

  participants: () => http.get<AuditParticipant[]>("/audit/participants"),
};
