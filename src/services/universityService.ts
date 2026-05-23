import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { University, Course } from "@/types/university.types";

export const universityService = {
  list:         ()                                                    => http.get<Paginated<University>>("/university").then(resolvePaginated),
  listInactive: ()                                                    => http.get<Paginated<University>>("/university/inactive").then(resolvePaginated),
  getById:      (id: string)                                          => http.get<University>(`/university/${id}`),
  create:       (data: { name: string; acronym: string; address: string }) => http.post<University>("/university", data),
  update:       (id: string, data: Partial<{ name: string; acronym: string; address: string }>) =>
                  http.patch<University>(`/university/${id}`, data),
  deactivate:   (id: string) => http.delete<{ message: string }>(`/university/${id}`),
};

export const courseService = {
  list:           ()                                           => http.get<Course[]>("/course"),
  listByUniversity: (universityId: string)                    => http.get<Course[]>(`/course/by-university/${universityId}`),
  create:         (data: { name: string; universityId: string }) => http.post<Course>("/course", data),
  update:         (id: string, data: { name: string })        => http.patch<Course>(`/course/${id}`, data),
  deactivate:     (id: string)                                => http.delete<{ message: string }>(`/course/${id}`),
};
