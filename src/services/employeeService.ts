import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from "@/types/employee";

export const employeeService = {
  list:       ()                                  => http.get<Paginated<Employee>>("/employee").then(resolvePaginated),
  listInactive: ()                                => http.get<Paginated<Employee>>("/employee/inactive").then(resolvePaginated),
  getById:    (id: string)                        => http.get<Employee>(`/employee/${id}`),
  create:     (data: EmployeeCreatePayload)       => http.post<Employee>("/employee", data),
  update:     (id: string, data: EmployeeUpdatePayload) => http.patch<Employee>(`/employee/${id}`, data),
  deactivate: (id: string)                        => http.delete<{ message: string }>(`/employee/${id}`),
  reactivate: (id: string)                        => http.patch<Employee>(`/employee/${id}/activate`, {}),
  /** Exclusão permanente — só funcionário desativado. Irreversível. */
  remove:     (id: string, reasons: string[])     => http.delete<{ message: string }>(`/employee/${id}/permanent`, { reasons }),
};
