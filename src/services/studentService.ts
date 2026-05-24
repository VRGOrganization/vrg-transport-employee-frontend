import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { Student } from "@/types/student";

export interface StudentCreatePayload {
  name: string;
  email: string;
  telephone: string;
  cpf: string;
  institution?: string;
  shift?: string;
  bloodType?: string;
  degree?: string;
}

export interface StudentUpdatePayload {
  name?: string;
  telephone?: string;
  institution?: string;
  shift?: string;
  bloodType?: string;
  degree?: string;
}

export const studentService = {
  list:         ()                                => http.get<Paginated<Student>>("/student").then(resolvePaginated),
  listInactive: ()                                => http.get<Paginated<Student>>("/student/inactive").then(resolvePaginated),
  getById:      (id: string)                      => http.get<Student>(`/student/${id}`),
  create:       (data: StudentCreatePayload)      => http.post<Student>("/student", data),
  update:       (id: string, data: StudentUpdatePayload) => http.patch<Student>(`/student/${id}`, data),
  deactivate:   (id: string)                      => http.patch<{ message: string }>(`/student/${id}/deactivate`, {}),
  reactivate:   (id: string)                      => http.patch<Student>(`/student/${id}/activate`, {}),
};
