"use client";

import { useState } from "react";
import {
  StudentFormData,
  StudentFormErrors,
  EMPTY_STUDENT_ERRORS,
} from "@/types/student";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,64}$/;

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
    const next = { ...EMPTY_STUDENT_ERRORS };
    let valid = true;

    if (!data.name.trim()) {
      next.name = "Nome é obrigatório";
      valid = false;
    } else if (data.name.trim().length > 100) {
      next.name = "Nome deve ter no máximo 100 caracteres";
      valid = false;
    }

    if (!data.email.trim()) {
      next.email = "Email é obrigatório";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      next.email = "Email inválido";
      valid = false;
    }

    if (!data.telephone.trim()) {
      next.telephone = "Telefone é obrigatório";
      valid = false;
    }

    if (!data.institution) {
      next.institution = "Selecione uma instituição";
      valid = false;
    }

    if (!data.shift) {
      next.shift = "Selecione um turno";
      valid = false;
    }

    if (mode === "create") {
      if (!data.password) {
        next.password = "Senha é obrigatória";
        valid = false;
      } else if (!PASSWORD_REGEX.test(data.password)) {
        next.password = "Mínimo 8 caracteres com maiúsculas, minúsculas e números";
        valid = false;
      }

      if (!data.confirmPassword) {
        next.confirmPassword = "Confirme a senha";
        valid = false;
      } else if (data.password !== data.confirmPassword) {
        next.confirmPassword = "As senhas não coincidem";
        valid = false;
      }
    }

    setErrors(next);
    return valid;
  };

  return { data, errors, loading, setLoading, onChange, setError, clearErrors, validate };
}