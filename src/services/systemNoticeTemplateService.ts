import { http } from "./http";

export type SystemNoticeTemplateKey =
  | "WINDOW_OPEN"
  | "WINDOW_CLOSE_7"
  | "WINDOW_CLOSE_3"
  | "WINDOW_CLOSE_1"
  | "CYCLE_RESET_7"
  | "CYCLE_RESET_3"
  | "CYCLE_RESET_1";

export interface SystemNoticeTemplate {
  key: SystemNoticeTemplateKey;
  title: string;
  body: string;
  updatedAt: string;
  updatedByAdminId: string | null;
}

export interface UpdateSystemNoticeTemplateInput {
  title?: string;
  body?: string;
}

export const systemNoticeTemplateService = {
  list: () => http.get<SystemNoticeTemplate[]>("/system-notice-templates"),

  update: (key: SystemNoticeTemplateKey, payload: UpdateSystemNoticeTemplateInput) =>
    http.patch<SystemNoticeTemplate>(`/system-notice-templates/${key}`, payload),
};
