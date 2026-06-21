import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { University, Course, CourseModel } from "@/types/university.types";

export const universityService = {
  list:         ()                                                    => http.get<Paginated<University>>("/university").then(resolvePaginated),
  listWithQueueCounts: async () => {
    const [universityList, queueResult] = await Promise.all([
      http.get<Paginated<University>>("/university").then(resolvePaginated),
      http.get<{ enrollmentPeriodId: string | null; universities: Array<{ universityId: string; pendingCount: number; waitlistedCount: number }> }>("/university/queue"),
    ]);
    const queueMapById = new Map(
      (queueResult.universities ?? []).map((q) => [q.universityId, q]),
    );

    return universityList.map((university) => {
      const q = queueMapById.get(university._id);
      return {
        ...university,
        pendingCount: q?.pendingCount ?? university.pendingCount ?? 0,
        waitlistedCount: q?.waitlistedCount ?? university.waitlistedCount ?? 0,
      };
    });
  },
  listInactive: ()                                                    => http.get<Paginated<University>>("/university/inactive").then(resolvePaginated),
  getById:      (id: string)                                          => http.get<University>(`/university/${id}`),
  create:       (data: { name: string; acronym: string; address: string }) => http.post<University>("/university", data),
  update:       (id: string, data: Partial<{ name: string; acronym: string; address: string }>) =>
                  http.patch<University>(`/university/${id}`, data),
  deactivate:   (id: string) => http.delete<{ message: string }>(`/university/${id}`),
  reactivate:   (id: string) => http.patch<{ message: string }>(`/university/${id}/activate`, {}),
};

export const courseService = {
  list:           ()                                           => http.get<Course[]>("/course"),
  listByUniversity: (universityId: string)                    => http.get<Course[]>(`/course/by-university/${universityId}`),
  create:         (data: { name: string; universityId: string; model?: CourseModel }) => http.post<Course>("/course", data),
  update:         (id: string, data: { name?: string; model?: CourseModel | null })   => http.patch<Course>(`/course/${id}`, data),
  deactivate:     (id: string)                                => http.delete<{ message: string }>(`/course/${id}`),
};
