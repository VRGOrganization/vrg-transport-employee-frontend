"use client";

import { useState } from "react";
import {
  StudentFormData,
  StudentFormErrors,
  EMPTY_STUDENT_ERRORS,
} from "@/types/student";
import { studentCreateSchema, studentEditSchema } from "@/lib/validation/student";

interface UseStudentFormOptions {
  mode: "create" | "edit";
  initial?: Partial<StudentFormData>;
}

export function useStudentForm({ mode, initial }: UseStudentFormOptions) {
  const [data, setData] = useState<StudentFormData>({
    name: initial?.name ?? "",
    email: initial?.email ?? "",
    telephone: initial?.telephone ?? "",
    institution: initial?.institution ?? "",
    shift: initial?.shift ?? "",
    cpf: initial?.cpf ?? "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<StudentFormErrors>(EMPTY_STUDENT_ERRORS);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof StudentFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const setError = (field: keyof StudentFormErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearErrors = () => setErrors(EMPTY_STUDENT_ERRORS);

  const validate = (): boolean => {
    const schema = mode === "create" ? studentCreateSchema : studentEditSchema;
    const result = schema.safeParse(data);

    if (result.success) {
      setErrors(EMPTY_STUDENT_ERRORS);
      return true;
    }

    const flat = result.error.flatten().fieldErrors;
    const next: StudentFormErrors = {
      ...EMPTY_STUDENT_ERRORS,
      name: flat.name?.[0] ?? "",
      email: flat.email?.[0] ?? "",
      telephone: flat.telephone?.[0] ?? "",
      institution: flat.institution?.[0] ?? "",
      shift: flat.shift?.[0] ?? "",
      cpf: flat.cpf?.[0] ?? "",
      password: flat.password?.[0] ?? "",
      confirmPassword: flat.confirmPassword?.[0] ?? "",
    };

    setErrors(next);
    return false;
  };

  return { data, errors, loading, setLoading, onChange, setError, clearErrors, validate };
}