export interface Employee {
  _id: string;
  name: string;
  email: string;
  registrationId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeCreatePayload {
  name: string;
  email: string;
  registrationId: string;
  password?: string;
}

export interface EmployeeUpdatePayload {
  name?: string;
  email?: string;
  registrationId?: string;
  password?: string;
}
