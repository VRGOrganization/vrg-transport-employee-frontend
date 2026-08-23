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

export interface LicenseRequestReviewCounts {
  enrollmentCycleId: string | null;
  reissueCount: number;
  documentResendCount: number;
}

export interface ApproveReissueBody {
  allocationId?: string;
  day?: string;
  period?: string;
  institution?: string;
  photo?: string;
}

export interface ApproveReissueBatchTarget {
  allocationId?: string;
  day?: string;
  period?: string;
}

export interface ApproveReissueBatchBody {
  targets: ApproveReissueBatchTarget[];
  photo?: string;
}

export interface ApproveReissueBatchDay {
  allocationId: string | null;
  day: string;
  period: string;
}

export interface ApproveReissueBatchRefusal extends ApproveReissueBatchDay {
  reason: string;
}

export interface ApproveReissueBatchResult {
  requestId: string;
  licenseId: string | null;
  approved: ApproveReissueBatchDay[];
  refused: ApproveReissueBatchRefusal[];
}

export interface AdminCreateLicenseRequestInput {
  studentId: string;
  adminNote?: string;
  universityId?: string;
  busId?: string;
  institution?: string;
  degree?: string;
  shift?: string;
  bloodType?: string;
  schedule?: Array<{ day: string; period: string }>;
  transportMode?: "regular" | "weekly";
  weeklyTripConfig?: {
    departureDayOfWeek: string;
    departurePeriod: string;
    returnDayOfWeek: string;
    returnPeriod: string;
  } | null;
  // Segunda matrícula (aluno que cursa em duas instituições). Opcional; quando
  // ausente, o pedido segue normal com uma única instituição.
  secondaryUniversityId?: string;
  secondaryInstitution?: string;
  secondaryDegree?: string;
  secondaryShift?: string;
  secondarySchedule?: Array<{ day: string; period: string }>;
  secondaryBusId?: string;
  documents?: Partial<Record<string, File | null>>;
}

const REQUEST_DOCUMENT_FIELDS = [
  "ProfilePhoto",
  "EnrollmentProof",
  "CourseSchedule",
  "AcademicPeriodProof",
  "GovernmentId",
  "ProofOfResidence",
  // 2ª faculdade (aluno em duas instituições): comprovantes próprios.
  "SecondaryEnrollmentProof",
  "SecondaryCourseSchedule",
  "SecondaryAcademicPeriodProof",
] as const;

export interface StudentLicenseRequestSummary {
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "revision"
    | "waitlisted"
    | "partially_waitlisted"
    | "cancelled";
}

export const licenseRequestService = {
  /** Lista as solicitações de um estudante (mais recentes primeiro, no backend). */
  findByStudent: (studentId: string) =>
    http.get<StudentLicenseRequestSummary[]>(`/license-request/student/${studentId}`),

  /** Cria um pedido de carteirinha internamente (admin/funcionário). */
  adminCreate: (input: AdminCreateLicenseRequestInput) => {
    const form = new FormData();
    const put = (key: string, value: string | undefined) => {
      if (value !== undefined && value !== "") form.append(key, value);
    };
    put("studentId", input.studentId);
    put("adminNote", input.adminNote);
    put("universityId", input.universityId);
    put("busId", input.busId);
    put("institution", input.institution);
    put("degree", input.degree);
    put("shift", input.shift);
    put("bloodType", input.bloodType);
    put("transportMode", input.transportMode);
    put("secondaryUniversityId", input.secondaryUniversityId);
    put("secondaryInstitution", input.secondaryInstitution);
    put("secondaryDegree", input.secondaryDegree);
    put("secondaryShift", input.secondaryShift);
    put("secondaryBusId", input.secondaryBusId);
    if (input.schedule) form.append("schedule", JSON.stringify(input.schedule));
    if (input.secondarySchedule)
      form.append("secondarySchedule", JSON.stringify(input.secondarySchedule));
    if (input.weeklyTripConfig)
      form.append("weeklyTripConfig", JSON.stringify(input.weeklyTripConfig));
    const docs = input.documents ?? {};
    for (const field of REQUEST_DOCUMENT_FIELDS) {
      const file = docs[field];
      if (file instanceof File) form.append(field, file);
    }
    return http.postForm<{ message: string; requestId: string }>(
      "/license-request/admin-create",
      form,
    );
  },

  // O controller lê @Query('enrollmentCycleId'). Enviar `enrollmentPeriodId`
  // fazia o parâmetro ser silenciosamente ignorado e a resposta voltar sempre
  // do ciclo ativo, independentemente do ciclo pedido.
  getReviewCounts: (cycleId?: string) => {
    const query = cycleId ? `?enrollmentCycleId=${encodeURIComponent(cycleId)}` : "";
    return http.get<LicenseRequestReviewCounts>(`/license-request/review-counts${query}`);
  },

  listReissueCandidates: (cycleId?: string) => {
    const query = cycleId ? `?enrollmentCycleId=${encodeURIComponent(cycleId)}` : "";
    return http.get<ReissueCandidate[]>(`/license-request/reissue-candidates${query}`);
  },

  approveReissue: (id: string, body: ApproveReissueBody) =>
    http.patch(`/license-request/${id}/approve-reissue`, body),

  approveReissueBatch: (id: string, body: ApproveReissueBatchBody) =>
    http.patch<ApproveReissueBatchResult>(`/license-request/${id}/approve-reissue-batch`, body),
};
