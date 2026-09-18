import { API_BASE_URL, http } from "./http";
import type { ApiError } from "@/types/api";

export type NoticeType = "message" | "poll";
export type NoticeStatus = "scheduled" | "published" | "cancelled" | "expired";

export interface NoticePollOption {
  id: string;
  label: string;
  voteCount: number;
}

export interface Notice {
  id: string;
  authorName: string;
  authorRole: "admin" | "employee" | "system";
  type: NoticeType;
  title: string;
  body: string | null;
  pollOptions: NoticePollOption[] | null;
  allowMultiple: boolean | null;
  status: NoticeStatus;
  publishAt: string;
  expiresAt: string;
  pinned: boolean;
}

export interface CreateNoticeInput {
  type: NoticeType;
  title: string;
  body?: string;
  pollOptions?: string[];
  allowMultiple?: boolean;
  expiresInDays: number;
  pinned?: boolean;
}

export interface PollResultAggregate {
  optionId: string;
  label: string;
  voteCount: number;
}

export interface PollResultNominalEntry {
  studentName: string;
  studentEmail: string;
  optionIds: string[];
  votedAt: string;
}

export interface PollResults {
  aggregate: PollResultAggregate[];
  nominal: PollResultNominalEntry[] | null;
}

export const noticeService = {
  listNotices: () => http.get<Notice[]>("/employee/notices"),

  createNotice: (input: CreateNoticeInput) => http.post<Notice>("/employee/notices", input),

  cancelScheduledNotice: (noticeId: string) =>
    http.post<void>(`/employee/notices/${noticeId}/cancel`, {}),

  deleteNotice: (noticeId: string) => http.delete<void>(`/employee/notices/${noticeId}`),

  resendNotice: (noticeId: string) =>
    http.post<void>(`/employee/notices/${noticeId}/resend`, {}),

  togglePin: (noticeId: string, pinned: boolean) =>
    http.patch<Notice>(`/employee/notices/${noticeId}/pin`, { pinned }),

  getPollResults: (noticeId: string) => http.get<PollResults>(`/employee/notices/${noticeId}/results`),

  // Endpoint retorna CSV como texto puro — não passa por http (que sempre faz JSON.parse).
  exportPollResults: async (noticeId: string): Promise<string> => {
    const res = await fetch(`${API_BASE_URL}/employee/notices/${noticeId}/export`, {
      method: "GET",
      credentials: "include",
    });

    if (!res.ok) {
      const message = await res.text().catch(() => "Erro desconhecido");
      const error: ApiError = { message: message || "Erro desconhecido", status: res.status };
      throw error;
    }

    return res.text();
  },
};
