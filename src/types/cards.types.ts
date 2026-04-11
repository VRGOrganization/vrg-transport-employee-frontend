export type PhotoType =
  | "ProfilePhoto"
  | "EnrollmentProof"
  | "CourseSchedule"
  | "LicenseImage";

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

export interface LicenseRecord {
  _id: string;
  studentId: string;
  imageLicense: string;
  status: "active" | "inactive" | "expired";
}

export interface LicenseRequestRecord {
  _id: string;
  studentId: string;
  type: "initial" | "update";
  changedDocuments: string[];
  pendingImages?: Array<{ photoType: string; dataUrl: string }>;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  rejectedAt: string | null;
  licenseId: string | null;
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
  photo3x4: string | null;
  documentImage: string | null;
  studentCard: string | null;
}

export interface PrintableCard {
  studentName: string;
  imageData: string;
}

export interface PreviewItem {
  title: string;
  dataUrl: string | null;
}

export type StudentFilter = "pending" | "all" | "with-card";

export const REJECTION_REASONS = [
  "Foto inadequada ou ilegível",
  "Comprovante de matrícula inválido",
  "Grade horária não corresponde aos documentos",
  "Documentos ilegíveis ou corrompidos",
  "Informações inconsistentes",
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const DAY_LABELS: Record<string, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
};

export const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  ProfilePhoto: "Foto 3x4",
  EnrollmentProof: "Comprovante de Matrícula",
  CourseSchedule: "Grade Horária",
  LicenseImage: "Carteirinha",
};