import { http } from "./http";
import type { Employee, EmployeeCreatePayload, EmployeeUpdatePayload } from "@/types/employee";

export const employeeService = {
  list:       ()                                  => http.get<Employee[]>("/employee"),
  listInactive: ()                                => http.get<Employee[]>("/employee/inactive"),
  getById:    (id: string)                        => http.get<Employee>(`/employee/${id}`),
  create:     (data: EmployeeCreatePayload)       => http.post<Employee>("/employee", data),
  update:     (id: string, data: EmployeeUpdatePayload) => http.patch<Employee>(`/employee/${id}`, data),
  deactivate: (id: string)                        => http.delete<{ message: string }>(`/employee/${id}`),
  reactivate: (id: string)                        => http.patch<Employee>(`/employee/${id}/activate`, {}),
};
