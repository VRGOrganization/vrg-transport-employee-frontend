import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  PriorityRule,
  CreatePriorityRulePayload,
  UpdatePriorityRulePayload,
} from "@/types/priorityRule";

export const priorityRuleService = {
  list: (page = 1, limit = 100) =>
    http
      .get<Paginated<PriorityRule>>(`/priority-rules?page=${page}&limit=${limit}`)
      .then(resolvePaginated),

  create: (payload: CreatePriorityRulePayload) =>
    http.post<PriorityRule>("/priority-rules", payload),

  update: (id: string, payload: UpdatePriorityRulePayload) =>
    http.patch<PriorityRule>(`/priority-rules/${id}`, payload),

  toggle: (id: string) =>
    http.patch<PriorityRule>(`/priority-rules/${id}/toggle`, {}),

  deactivate: (id: string) =>
    http.delete<void>(`/priority-rules/${id}`),
};
