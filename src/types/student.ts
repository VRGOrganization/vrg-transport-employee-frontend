export interface Student {
  _id: string;
  name: string;
  email: string;
  telephone: string;
  registrationNumber?: string;
  institution?: string;
  shift?: "diurno" | "noturno";
  active: boolean;
  emailVerified?: boolean;
  schedule?: { day: string; period: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageHistory {
  _id: string;
  studentId: string;
  imageId: string;
  photoType:
    | "ProfilePhoto"
    | "EnrollmentProof"
    | "CourseSchedule"
    | "LicenseImage"
    | "GovernmentId"
    | "ProofOfResidence";
  photo3x4: string | null;
  documentImage: string | null;
  replacedAt: string;
}

export interface LicenseRequestRecord {
  _id: string;
  studentId: string;
  type: "initial" | "update";
  changedDocuments: string[];
  status: "pending" | "approved" | "rejected" | "waitlisted";
  rejectionReason: string | null;
  rejectedAt: string | null;
  licenseId: string | null;
  enrollmentPeriodId?: string | null;
  filaPosition?: number | null;
  createdAt: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  telephone: string;
  institution: string;
  shift: "diurno" | "noturno" | "";
  cpf: string;
  password: string;
  confirmPassword: string;
}

export interface StudentFormErrors {
  name: string;
  email: string;
  telephone: string;
  institution: string;
  shift: string;
  cpf: string;
  password: string;
  confirmPassword: string;
  general: string;
}

export const EMPTY_STUDENT_ERRORS: StudentFormErrors = {
  name: "",
  email: "",
  telephone: "",
  institution: "",
  shift: "",
  cpf: "",
  password: "",
  confirmPassword: "",
  general: "",
};

export const INSTITUTIONS = [
    
];

export const SHIFTS: { value: "diurno" | "noturno"; label: string; icon: string }[] = [
  { value: "diurno", label: "Diurno", icon: "light_mode" },
  { value: "noturno", label: "Noturno", icon: "dark_mode" },
];