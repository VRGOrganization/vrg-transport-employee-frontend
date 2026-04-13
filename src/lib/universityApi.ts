import { employeeApi } from "@/lib/employeeApi";
import type { University, Course, Bus, BusStudent } from "@/types/university.types";

// ── Universities ──────────────────────────────────────────────

export const universityApi = {
  list: () => employeeApi.get<University[]>("/university"),
  listInactive: () => employeeApi.get<University[]>("/university/inactive"),
  getById: (id: string) => employeeApi.get<University>(`/university/${id}`),
  create: (data: { name: string; acronym: string; address: string }) =>
    employeeApi.post<University>("/university", data),
  update: (id: string, data: Partial<{ name: string; acronym: string; address: string }>) =>
    employeeApi.patch<University>(`/university/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/university/${id}`),
};

// ── Courses ───────────────────────────────────────────────────

export const courseApi = {
  list: () => employeeApi.get<Course[]>("/course"),
  listByUniversity: (universityId: string) =>
    employeeApi.get<Course[]>(`/course/by-university/${universityId}`),
  create: (data: { name: string; universityId: string }) =>
    employeeApi.post<Course>("/course", data),
  update: (id: string, data: { name: string }) =>
    employeeApi.patch<Course>(`/course/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/course/${id}`),
};

// ── Buses ─────────────────────────────────────────────────────

export const busApi = {
  list: () => employeeApi.get<Bus[]>("/bus"),
  listInactive: () => employeeApi.get<Bus[]>("/bus/inactive"),
  create: (data: { identifier: string; capacity: number }) =>
    employeeApi.post<Bus>("/bus", data),
  update: (id: string, data: Partial<{ identifier: string; capacity: number }>) =>
    employeeApi.patch<Bus>(`/bus/${id}`, data),
  deactivate: (id: string) => employeeApi.delete<{ message: string }>(`/bus/${id}`),
  linkUniversity: (busId: string, universityId: string) =>
    employeeApi.patch<Bus>(`/bus/${busId}/link-university`, { universityId }),
  unlinkUniversity: (busId: string, universityId: string) =>
    employeeApi.patch<Bus>(`/bus/${busId}/unlink-university`, { universityId }),
  studentsByBus: (busIdentifier: string) =>
    employeeApi.get<BusStudent[]>(`/student/by-bus/${encodeURIComponent(busIdentifier)}`),
};