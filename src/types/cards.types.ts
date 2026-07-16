export type PhotoType =
  | "ProfilePhoto"
  | "EnrollmentProof"
  | "CourseSchedule"
  | "AcademicPeriodProof"
  | "LicenseImage"
  | "GovernmentId"
  | "ProofOfResidence"
  | "TransportCardProof";

export interface StudentRecord {
  _id: string;
  name: string;
  email: string;
  telephone?: string;
  institution?: string;
  degree?: string;
  shift?: string;
  bloodType?: string;
  schedule?: Array<{ day: string; period: string }>;
  active: boolean;
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
    | "cancelled";
  rejectionReason: string | null;
  rejectedAt: string | null;
  // Revisão
  revisionStage?: RevisionStage | null;
  revisionReasons?: string[];
  revisionFields?: string[];
  revisionMessage?: string | null;
  licenseId: string | null;
  enrollmentPeriodId?: string | null;
  filaPosition?: number | null;
  busId?: string | { _id: string } | null;
  universityId?: string | { _id: string } | null;
  accessBusIdentifiers?: string[];
  // Campos de prioridade e alocação
  allocationSummary?: AllocationEntry[] | null;
  priorityLevel?: number | null;
  priorityRuleName?: string | null;
  transportMode?: "regular" | "weekly" | null;
  alreadyUsesTransport?: boolean;
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

export type RevisionFieldKey = "institution" | "degree" | "shift" | "schedule";

export const REVISION_FIELD_LABELS: Record<RevisionFieldKey, string> = {
  institution: "Instituição",
  degree: "Curso",
  shift: "Turno",
  schedule: "Grade horária",
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
};
