import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  PriorityRule,
  CreatePriorityRulePayload,
  UpdatePriorityRulePayload,
  ReactivationResult,
} from "@/types/priorityRule";

export const priorityRuleService = {
  list: (page = 1, limit = 100) =>
    http
      .get<Paginated<PriorityRule>>(`/priority-rules?page=${page}&limit=${limit}`)
      .then(resolvePaginated),

  vacantLevels: () =>
    http.get<{ levels: number[] }>("/priority-rules/vacant-levels").then((r) => r.levels),

  create: (payload: CreatePriorityRulePayload) =>
    http.post<PriorityRule>("/priority-rules", payload),

  update: (id: string, payload: UpdatePriorityRulePayload) =>
    http.patch<PriorityRule>(`/priority-rules/${id}`, payload),

  deactivate: (id: string) =>
    http.delete<void>(`/priority-rules/${id}`),

  reactivate: (id: string, confirm = false) =>
    http.patch<ReactivationResult>(`/priority-rules/${id}/reactivate`, { confirm }),
};
