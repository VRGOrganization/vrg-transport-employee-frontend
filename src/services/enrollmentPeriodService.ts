import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { EnrollmentPeriod } from "@/types/enrollmentPeriod";

export type { EnrollmentPeriod };

export const enrollmentPeriodService = {
  getActive: ()                      => http.get<EnrollmentPeriod>("/enrollment-period/active"),
  list:      ()                      => http.get<Paginated<EnrollmentPeriod>>("/enrollment-period").then(resolvePaginated),
  create:    (data: { startDate: string; endDate: string; licenseValidityMonths?: number }) =>
               http.post<EnrollmentPeriod>("/enrollment-period", data),
  update:    (id: string, data: Partial<{ startDate: string; endDate: string; licenseValidityMonths?: number }>) =>
               http.patch<EnrollmentPeriod>(`/enrollment-period/${id}`, data),
  close:     (id: string)            => http.patch<EnrollmentPeriod>(`/enrollment-period/${id}/close`, {}),
  reopen:    (id: string)            => http.patch<EnrollmentPeriod>(`/enrollment-period/${id}/reopen`, {}),
};
