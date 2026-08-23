import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { BanHistoryEntry, BanlistEntry } from "@/types/banlist";

export const banlistService = {
  list: (active?: boolean) => {
    const qs = active !== undefined ? `?active=${active}` : "";
    return http.get<Paginated<BanlistEntry>>(`/banlist${qs}`).then(resolvePaginated);
  },
  /**
   * Histórico de banimentos do aluno, do mais antigo ao mais recente, com os
   * nomes dos admins já resolvidos. Array vazio = aluno nunca foi banido.
   */
  getHistory: (studentId: string) =>
    http.get<BanHistoryEntry[]>(`/banlist/student/${studentId}`),
  ban: (studentId: string, reasons: string[]) =>
    http.post<BanlistEntry>("/banlist/ban", { studentId, reasons }),
  unban: (studentId: string, reasons: string[]) =>
    http.patch<BanlistEntry>(`/banlist/unban/${studentId}`, { reasons }),
};
