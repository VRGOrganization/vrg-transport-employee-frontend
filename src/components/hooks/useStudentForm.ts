"use client";

import { useState } from "react";
import {
  StudentFormData,
  StudentFormErrors,
  StudentFormFieldValue,
  EMPTY_STUDENT_ERRORS,
} from "@/types/student";
import { studentCreateSchema, studentEditSchema } from "@/lib/validation/student";

interface UseStudentFormOptions {
  mode: "create" | "edit";
  initial?: Partial<StudentFormData>;
}

export function useStudentForm({ mode, initial }: UseStudentFormOptions) {
  const [data, setData] = useState<StudentFormData>({
    name:        initial?.name        ?? "",
    email:       initial?.email       ?? "",
    telephone:   initial?.telephone   ?? "",
    institution: initial?.institution ?? "",
    shift:       (initial?.shift      ?? "") as StudentFormData["shift"],
    bloodType:   (initial?.bloodType  ?? "") as StudentFormData["bloodType"],
    degree:      initial?.degree      ?? "",
    cpf:         initial?.cpf         ?? "",
    alreadyUsesTransport:   initial?.alreadyUsesTransport   ?? false,
    hasDisability:          initial?.hasDisability          ?? false,
    governmentIdFile:       initial?.governmentIdFile       ?? null,
    proofOfResidenceFile:   initial?.proofOfResidenceFile   ?? null,
    transportCardProofFile: initial?.transportCardProofFile ?? null,
    disabilityProofFile:    initial?.disabilityProofFile    ?? null,
  });

  const [errors, setErrors] = useState<StudentFormErrors>(EMPTY_STUDENT_ERRORS);
  const [loading, setLoading] = useState(false);

  const onChange = (field: keyof StudentFormData, value: StudentFormFieldValue) => {
    setData((prev) => ({ ...prev, [field]: value }));
    const errorField = field as keyof StudentFormErrors;
    if (errors[errorField]) setErrors((prev) => ({ ...prev, [errorField]: "" }));
    // Trocar a flag PCD/uso limpa também erros de documentos condicionais.
    if (field === "hasDisability" || field === "alreadyUsesTransport") {
      setErrors((prev) => ({ ...prev, documents: "" }));
    }
  };

  const setError = (field: keyof StudentFormErrors, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearErrors = () => setErrors(EMPTY_STUDENT_ERRORS);

  /**
   * Regras de documentos (opcionais no cadastro interno), espelhando o backend:
   * se anexar algo, identidade + comprovante de residência são obrigatórios; e
   * carteirinha atual é exigida quando usa transporte, laudo quando é PCD.
   */
  const validateDocuments = (): string => {
    const hasAny =
      data.governmentIdFile ||
      data.proofOfResidenceFile ||
      data.transportCardProofFile ||
      data.disabilityProofFile;
    if (!hasAny) return "";

    if (!data.governmentIdFile || !data.proofOfResidenceFile) {
      return "Para anexar documentos, envie ao menos o documento de identidade e o comprovante de residência.";
    }
    if (data.alreadyUsesTransport && !data.transportCardProofFile) {
      return "Envie a carteirinha de transporte atual do aluno.";
    }
    if (data.hasDisability && !data.disabilityProofFile) {
      return "Envie o laudo médico que comprova a deficiência declarada.";
    }
    return "";
  };

  const validate = (): boolean => {
    const schema = mode === "create" ? studentCreateSchema : studentEditSchema;
    const result = schema.safeParse(data);
    const documentsError = mode === "create" ? validateDocuments() : "";

    if (result.success && !documentsError) {
      setErrors(EMPTY_STUDENT_ERRORS);
      return true;
    }

    const flat = result.success ? {} : result.error.flatten().fieldErrors;
    const next: StudentFormErrors = {
      ...EMPTY_STUDENT_ERRORS,
      name:        flat.name?.[0]        ?? "",
      email:       flat.email?.[0]       ?? "",
      telephone:   flat.telephone?.[0]   ?? "",
      institution: flat.institution?.[0] ?? "",
      shift:       flat.shift?.[0]       ?? "",
      bloodType:   flat.bloodType?.[0]   ?? "",
      degree:      flat.degree?.[0]      ?? "",
      cpf:         flat.cpf?.[0]         ?? "",
      documents:   documentsError,
    };

    setErrors(next);
    return false;
  };

  return { data, errors, loading, setLoading, onChange, setError, clearErrors, validate };
}