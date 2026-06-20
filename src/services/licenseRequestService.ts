import { http } from "./http";

export interface ReissueCandidate {
  allocationId: string;
  licenseRequestId: string;
  requestStatus: string;
  studentId: string;
  studentName: string | null;
  studentEmail: string | null;
  universityId: string;
  busId: string;
  busIdentifier: string | null;
  day: string;
  period: string;
  filaPosition: number | null;
  hasLicense: boolean;
  capacity: number;
  activeCount: number;
  availableSlots: number;
}

export interface ApproveReissueBody {
  allocationId?: string;
  day?: string;
  period?: string;
  institution?: string;
  photo?: string;
}

export const licenseRequestService = {
  listReissueCandidates: (periodId?: string) => {
    const query = periodId ? `?enrollmentPeriodId=${encodeURIComponent(periodId)}` : "";
    return http.get<ReissueCandidate[]>(`/license-request/reissue-candidates${query}`);
  },

  approveReissue: (id: string, body: ApproveReissueBody) =>
    http.patch(`/license-request/${id}/approve-reissue`, body),
};
