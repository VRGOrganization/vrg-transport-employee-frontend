export type PhotoType =
  | "ProfilePhoto"
  | "EnrollmentProof"
  | "CourseSchedule"
  | "AcademicPeriodProof"
  | "LicenseImage"
  | "GovernmentId"
  | "ProofOfResidence"
  | "TransportCardProof"
  | "DisabilityProof"
  // 2ª faculdade (aluno em duas instituições): comprovantes próprios.
  | "SecondaryEnrollmentProof"
  | "SecondaryCourseSchedule"
  | "SecondaryAcademicPeriodProof";

export interface StudentRecord {
  _id: string;
  name: string;
  socialName?: string | null;
  email: string;
  telephone?: string;
  institution?: string;
  degree?: string;
  shift?: string;
  bloodType?: string;
  schedule?: Array<{ day: string; period: string }>;
  active: boolean;
  hasDisability?: boolean;
  // 2ª faculdade (carteirinha interna com duas instituições). Presentes só quando
  // o aluno tem uma 2ª matrícula.
  secondaryUniversityId?: string | null;
  secondaryInstitution?: string;
  secondaryDegree?: string;
  secondaryShift?: string;
  secondaryBusId?: string | null;
  secondarySchedule?: Array<{ day: string; period: string }>;
}

export type StudentsResponse =
  | StudentRecord[]
  | { data?: StudentRecord[]; total?: number; page?: number; limit?: number };

// Representa uma alocação de ônibus por dia/período dentro do allocationSummary
export interface AllocationEntry {
  day: string;           // "SEG" | "TER" | "QUA" | "QUI" | "SEX"
  period: string;        // "Manhã" | "Tarde" | "Noite"
  busIdentifier?: string | null;
  busId?: string | null;
  status: "active" | "waitlisted" | "cancelled";
  needsOutbound: boolean;
  needsReturn: boolean;
}

export interface LicenseRecord {
  _id: string;
  studentId: string;
  employeeId?: string;
  /** Nome real do campo no backend (entidade License). */
  enrollmentCycleId?: string | null;
  /** @deprecated Leia enrollmentCycleId. */
  enrollmentPeriodId?: string | null;
  /** Presigned URL assinada (http(s)) ou base64/data URL legado. Use normalizeMediaSource/resolveToDataUrl. */
  imageLicense: string;
  status: "active" | "inactive" | "expired" | "rejected";
  existing?: boolean;
  expirationDate?: string | null;
  verificationCode?: string | null;
  qrCodeUrl?: string | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type RevisionStage = "pending_student" | "resubmitted";

export interface LicenseRequestRecord {
  _id: string;
  studentId: string;
  type: "initial" | "update";
  changedDocuments: string[];
  pendingImages?: Array<{ photoType: string; dataUrl: string }>;
  status:
    | "pending"
    | "approved"
    | "rejected"
    | "revision"
    | "waitlisted"
    // Valor real do enum LicenseRequestStatus no backend: pedido em que parte
    // dos dias entrou na lista de espera. Sem ele, a lista de espera fica
    // subcontada em qualquer agregação.
    | "partially_waitlisted"
    | "cancelled";
  rejectionReason: string | null;
  rejectedAt: string | null;
  // Revisão
  revisionStage?: RevisionStage | null;
  revisionReasons?: string[];
  revisionFields?: string[];
  revisionMessage?: string | null;
  licenseId: string | null;
  /**
   * Ciclo de inscrição do pedido. Este é o nome real do campo na entidade e em
   * todas as respostas HTTP do backend.
   */
  enrollmentCycleId?: string | null;
  /** @deprecated Nunca existiu na resposta do backend — leia enrollmentCycleId. */
  enrollmentPeriodId?: string | null;
  filaPosition?: number | null;
  busId?: string | { _id: string } | null;
  universityId?: string | { _id: string } | null;
  // Snapshot da 2ª faculdade (aluno em duas instituições).
  secondaryUniversityId?: string | { _id: string } | null;
  accessBusIdentifiers?: string[];
  // Campos de prioridade e alocação
  allocationSummary?: AllocationEntry[] | null;
  priorityLevel?: number | null;
  priorityRuleName?: string | null;
  transportMode?: "regular" | "weekly" | null;
  cardNote?: string | null;
  createdAt: string;
}

export interface LicenseApiResponse {
  _id?: string;
  studentId?: string;
  imageLicense?: string;
  image?: string;
  licenseImage?: string;
  studentCard?: string;
  status?: "active" | "inactive" | "expired" | "rejected";
  rejectionReason?: string | null;
  rejectedAt?: string | null;
}

export interface ImageRecord {
  _id: string;
  studentId: string;
  photoType: PhotoType;
  // Campos de imagem: presigned URL assinada (http(s)) ou base64/data URL legado.
  // Sempre passe por normalizeMediaSource (exibição) ou resolveToDataUrl (print/download).
  photo3x4: string | null;
  documentImage: string | null;
  studentCard: string | null;
}

export interface ImageHistoryRecord {
  _id: string;
  studentId: string;
  imageId: string;
  photoType: PhotoType;
  photo3x4: string | null;
  documentImage: string | null;
  replacedAt: string;
}

export interface PrintableCard {
  studentName: string;
  imageData: string;
}

export interface PreviewItem {
  title: string;
  dataUrl: string | null;
}

export type StudentFilter = "pending" | "waitlisted" | "with-card" | "review";

export interface RejectionReasonConfig {
  label: string;
  isPersonalDocumentReason: boolean;
}

export type RejectionReason = string;

export const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

export type RevisionFieldKey =
  | "institution"
  | "degree"
  | "shift"
  | "schedule"
  | "secondaryInstitution"
  | "secondaryDegree"
  | "secondaryShift"
  | "secondarySchedule";

export const REVISION_FIELD_LABELS: Record<RevisionFieldKey, string> = {
  institution: "Instituição",
  degree: "Curso",
  shift: "Turno",
  schedule: "Grade horária",
  secondaryInstitution: "Instituição (2ª faculdade)",
  secondaryDegree: "Curso (2ª faculdade)",
  secondaryShift: "Turno (2ª faculdade)",
  secondarySchedule: "Grade horária (2ª faculdade)",
};

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  ProfilePhoto: "Foto 3x4",
  EnrollmentProof: "Comprovante de Matrícula",
  CourseSchedule: "Grade Horária",
  AcademicPeriodProof: "Calendário Acadêmico",
  LicenseImage: "Carteirinha",
  GovernmentId: "Documento de identidade",
  ProofOfResidence: "Comprovante de residência",
  TransportCardProof: "Carteirinha de Transporte Atual",
  DisabilityProof: "Laudo Médico (PCD)",
  SecondaryEnrollmentProof: "Comprovante de Matrícula (2ª faculdade)",
  SecondaryCourseSchedule: "Grade Horária (2ª faculdade)",
  SecondaryAcademicPeriodProof: "Calendário Acadêmico (2ª faculdade)",
};
