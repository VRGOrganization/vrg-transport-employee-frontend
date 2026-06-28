export interface Student {
  _id: string;
  name: string;
  email: string;
  telephone: string;
  degree?: string;
  shift?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  bloodType?: string;
  universityId?: string | { _id: string; name: string; acronym: string };
  institution?: string;
  photo?: string;
  schedule?: Array<{
    day: string;
    period: string;
    needsOutbound?: boolean;
    needsReturn?: boolean;
  }>;
  transportMode?: 'regular' | 'weekly';
  weeklyTripConfig?: {
    departureDayOfWeek: string;
    departurePeriod: string;
    returnDayOfWeek: string;
    returnPeriod: string;
  };
  hasDisability?: boolean;
  distanceKm?: number;
  courseSemester?: number;
  status?: 'PENDING' | 'ACTIVE' | 'EXPIRED';
  isInstitutionalEmail?: boolean;
  hasPersonalDocuments?: boolean;
  hasCompletedInitialEnrollment?: boolean;
  active: boolean;
  secondaryBusId?: string;
  registrationNumber?: string;
  emailVerified?: boolean;
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
  // Presigned URL assinada (http(s)) ou base64/data URL legado — use normalizeMediaSource/resolveToDataUrl.
  photo3x4: string | null;
  documentImage: string | null;
  replacedAt: string;
}

export interface LicenseRequestRecord {
  _id: string;
  studentId: string;
  type: "initial" | "update";
  changedDocuments: string[];
  status: "pending" | "approved" | "rejected" | "waitlisted" | "cancelled";
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
  shift: "Manhã" | "Tarde" | "Noite" | "Integral" | "";
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";
  degree: string;
  cpf: string;
}

export interface StudentFormErrors {
  name: string;
  email: string;
  telephone: string;
  institution: string;
  shift: string;
  bloodType: string;
  degree: string;
  cpf: string;
  general: string;
}

export const EMPTY_STUDENT_ERRORS: StudentFormErrors = {
  name: "",
  email: "",
  telephone: "",
  institution: "",
  shift: "",
  bloodType: "",
  degree: "",
  cpf: "",
  general: "",
};

export type StudentShift = "Manhã" | "Tarde" | "Noite" | "Integral";

export const SHIFTS: { value: StudentShift; label: string; icon: string }[] = [
  { value: "Manhã",    label: "Manhã",    icon: "wb_sunny"    },
  { value: "Tarde",    label: "Tarde",    icon: "wb_twilight" },
  { value: "Noite",    label: "Noite",    icon: "dark_mode"   },
  { value: "Integral", label: "Integral", icon: "schedule"    },
];

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = typeof BLOOD_TYPES[number];
