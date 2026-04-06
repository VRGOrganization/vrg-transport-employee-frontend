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
  createdAt: string;
  updatedAt: string;
}

export interface StudentFormData {
  name: string;
  email: string;
  telephone: string;
  institution: string;
  shift: "diurno" | "noturno" | "";
  password: string;
  confirmPassword: string;
}

export interface StudentFormErrors {
  name: string;
  email: string;
  telephone: string;
  institution: string;
  shift: string;
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