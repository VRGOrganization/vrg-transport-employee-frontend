export type EmployeeRole = "employee" | "admin";

export interface EmployeeUser {
  id: string;
  name: string;
  identifier: string;
  role: EmployeeRole;
  registrationId?: string;
  email?: string;
}

export interface EmployeeLoginCredentials {
  login: string;
  password: string;
  role: EmployeeRole;
}

export interface EmployeeAuthResponse {
  ok: true;
  user: EmployeeUser;
}

export interface EmployeeApiError {
  message: string;
  status: number;
}