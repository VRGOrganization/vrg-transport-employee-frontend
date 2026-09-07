import { http } from "./http";

export interface TransportUsageDeclaration {
  studentId: string;
  alreadyUsesTransport: boolean;
}

export const transportUsageService = {
  getByStudent: (studentId: string) =>
    http.get<TransportUsageDeclaration>(`/transport-usage/${studentId}`),
};
