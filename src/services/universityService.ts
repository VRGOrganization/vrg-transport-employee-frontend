import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { University, Course, CourseModel } from "@/types/university.types";

// GET /university é paginado no backend (default limit=20, teto 100). As telas
// de admin fazem sua própria paginação client-side sobre a lista inteira, então
// pedimos o teto para não truncar antes da hora (ver /course/inactive, mesmo padrão).
export const universityService = {
  list:         ()                                                    => http.get<Paginated<University>>("/university?limit=100").then(resolvePaginated),
  listWithQueueCounts: async () => {
    const [universityList, queueResult] = await Promise.all([
      http.get<Paginated<University>>("/university?limit=100").then(resolvePaginated),
      http.get<{ enrollmentCycleId: string | null; universities: Array<{ universityId: string; pendingCount: number; revisionCount: number; waitlistedCount: number }> }>("/university/queue"),
    ]);
    const queueMapById = new Map(
      (queueResult.universities ?? []).map((q) => [q.universityId, q]),
    );

    return universityList.map((university) => {
      const q = queueMapById.get(university._id);
      return {
        ...university,
        pendingCount: q?.pendingCount ?? university.pendingCount ?? 0,
        revisionCount: q?.revisionCount ?? university.revisionCount ?? 0,
        waitlistedCount: q?.waitlistedCount ?? university.waitlistedCount ?? 0,
      };
    });
  },
  listInactive: ()                                                    => http.get<Paginated<University>>("/university/inactive?limit=100").then(resolvePaginated),
  getById:      (id: string)                                          => http.get<University>(`/university/${id}`),
  create:       (data: { name: string; acronym: string; address: string }) => http.post<University>("/university", data),
  createTemporary: (name: string) => http.post<University>("/university/temporary", { name }),
  update:       (id: string, data: Partial<{ name: string; acronym: string; address: string }>) =>
                  http.patch<University>(`/university/${id}`, data),
  deactivate:   (id: string) => http.delete<{ message: string }>(`/university/${id}`),
  reactivate:   (id: string) => http.patch<{ message: string }>(`/university/${id}/activate`, {}),
};

export const courseService = {
  list:                     ()                                                          => http.get<Course[]>("/course"),
  listByUniversity:         (universityId: string)                                     => http.get<Course[]>(`/course/by-university/${universityId}`),
  listInactiveByUniversity: (universityId: string)                                     => http.get<Course[]>(`/course/inactive/by-university/${universityId}`),
  // GET /course/inactive é global (todas as faculdades), paginado — limit alto
  // no MVP para trazer tudo em uma chamada; reavaliar paginação real na UI se
  // o volume de cursos desativados crescer além disso.
  listInactive:             ()                                                          => http.get<Paginated<Course>>("/course/inactive?limit=100").then(resolvePaginated),
  create:                   (data: { name: string; universityId: string; model?: CourseModel }) => http.post<Course>("/course", data),
  update:                   (id: string, data: { name?: string; model?: CourseModel | null })   => http.patch<Course>(`/course/${id}`, data),
  deactivate:               (id: string)                                               => http.delete<{ message: string }>(`/course/${id}`),
  reactivate:               (id: string)                                               => http.patch<{ message: string }>(`/course/${id}/reactivate`, {}),
};
