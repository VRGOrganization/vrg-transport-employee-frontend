import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { BanlistEntry } from "@/types/banlist";

export const banlistService = {
  list: (active?: boolean) => {
    const qs = active !== undefined ? `?active=${active}` : "";
    return http.get<Paginated<BanlistEntry>>(`/banlist${qs}`).then(resolvePaginated);
  },
  ban: (studentId: string, reasons: string[]) =>
    http.post<BanlistEntry>("/banlist/ban", { studentId, reasons }),
  unban: (studentId: string, reasons: string[]) =>
    http.patch<BanlistEntry>(`/banlist/unban/${studentId}`, { reasons }),
};
