import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type {
  EnrollmentPeriod,
  EnrollmentWindow,
  EnrollmentWindowEligibilityScope,
} from "@/types/enrollmentPeriod";

export type { EnrollmentPeriod };

export interface OpenEnrollmentWindowPayload {
  startDate: string;
  endDate: string;
  eligibilityScope: EnrollmentWindowEligibilityScope;
  eligibleUniversityIds?: string[];
}

export const enrollmentPeriodService = {
  getActive: ()                      => http.get<EnrollmentPeriod>("/enrollment-period/active"),
  getScheduled: ()                   => http.get<EnrollmentPeriod>("/enrollment-period/scheduled"),
  list:      ()                      => http.get<Paginated<EnrollmentPeriod>>("/enrollment-period").then(resolvePaginated),
  create:    (data: { startDate: string; licenseValidityMonths: number }) =>
               http.post<EnrollmentPeriod>("/enrollment-period", data),
  update:    (id: string, data: Partial<{ startDate: string; endDate: string; licenseValidityMonths?: number }>) =>
               http.patch<EnrollmentPeriod>(`/enrollment-period/${id}`, data),
  close:     (id: string)            => http.patch<EnrollmentPeriod>(`/enrollment-period/${id}/close`, {}),
  scheduleReset: (id: string, days: number) =>
               http.patch<EnrollmentPeriod>(`/enrollment-period/${id}/schedule-reset`, { days }),
  openWindow: (cycleId: string, data: OpenEnrollmentWindowPayload) =>
               http.post<EnrollmentWindow>(`/enrollment-period/${cycleId}/window`, data),
  closeWindow: (cycleId: string) =>
               http.patch<EnrollmentWindow>(`/enrollment-period/${cycleId}/window/close`, {}),
};
