export type EmployeeRole = "employee" | "admin";

export interface EmployeeUser {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  registrationId?: string; // apenas para funcionários
  createdAt: Date;
  updatedAt: Date;
}

export interface EmployeeLoginCredentials {
  login: string; 
  password: string;
}

export interface EmployeeAuthResponse {
  user: EmployeeUser;
  access_token: string;
  refresh_token: string;
}

export interface EmployeeApiError {
  message: string;
  code: string;
  status: number;
}