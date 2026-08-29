export interface Student {
  _id: string;
  name: string;
  socialName?: string | null;
  email: string;
  telephone: string;
  degree?: string;
  shift?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral';
  bloodType?: string;
  universityId?: string | { _id: string; name: string; acronym: string };
  institution?: string;
  courseId?: string | { _id: string; name: string } | null;
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
  // ── 2ª matrícula (aluno em duas instituições) ──────────────────────────────
  // Presentes só quando há segunda matrícula. Um aluno assim conta nas DUAS
  // faculdades em qualquer agregação por instituição.
  secondaryUniversityId?: string | { _id: string; name: string; acronym: string } | null;
  secondaryInstitution?: string | null;
  secondaryDegree?: string | null;
  secondaryShift?: 'Manhã' | 'Tarde' | 'Noite' | 'Integral' | null;
  secondarySchedule?: Array<{ day: string; period: string }>;
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
  /** Nome real do campo no backend. */
  enrollmentCycleId?: string | null;
  /** @deprecated Leia enrollmentCycleId. */
  enrollmentPeriodId?: string | null;
  filaPosition?: number | null;
  createdAt: string;
}

export type StudentShift = "Manhã" | "Tarde" | "Noite" | "Integral";

export const SHIFTS: { value: StudentShift; label: string; icon: string }[] = [
  { value: "Manhã",    label: "Manhã",    icon: "wb_sunny"    },
  { value: "Tarde",    label: "Tarde",    icon: "wb_twilight" },
  { value: "Noite",    label: "Noite",    icon: "dark_mode"   },
  { value: "Integral", label: "Integral", icon: "schedule"    },
];

export const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export type BloodType = typeof BLOOD_TYPES[number];
