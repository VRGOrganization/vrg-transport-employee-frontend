import { http } from "./http";
import { resolvePaginated, type Paginated } from "@/types/api";
import type { Student } from "@/types/student";

export interface StudentCreatePayload {
  name: string;
  email: string;
  telephone: string;
  cpf: string;
  institution?: string;
  shift?: string;
  bloodType?: string;
  degree?: string;
  alreadyUsesTransport?: boolean;
  hasDisability?: boolean;
  governmentIdFile?: File | null;
  proofOfResidenceFile?: File | null;
  transportCardProofFile?: File | null;
  disabilityProofFile?: File | null;
}

const DOCUMENT_FIELDS = [
  "governmentIdFile",
  "proofOfResidenceFile",
  "transportCardProofFile",
  "disabilityProofFile",
] as const;

function toStudentFormData(data: StudentCreatePayload): FormData {
  const form = new FormData();
  const append = (key: string, value: string | boolean | undefined) => {
    if (value !== undefined && value !== "") form.append(key, String(value));
  };
  append("name", data.name);
  append("email", data.email);
  append("telephone", data.telephone);
  append("cpf", data.cpf);
  append("institution", data.institution);
  append("shift", data.shift);
  append("bloodType", data.bloodType);
  append("degree", data.degree);
  append("alreadyUsesTransport", data.alreadyUsesTransport);
  append("hasDisability", data.hasDisability);
  for (const field of DOCUMENT_FIELDS) {
    const file = data[field];
    if (file instanceof File) form.append(field, file);
  }
  return form;
}

export interface StudentUpdatePayload {
  name?: string;
  telephone?: string;
  institution?: string;
  shift?: string;
  bloodType?: string;
  degree?: string;
}

export const studentService = {
  list:         ()                                => http.get<Student[]>("/student/all"),
  listInactive: ()                                => http.get<Paginated<Student>>("/student/inactive").then(resolvePaginated),
  getById:      (id: string)                      => http.get<Student>(`/student/${id}`),
  // POST /student sempre exige multipart/form-data no backend (FileFieldsInterceptor
  // incondicional, para aceitar documentos opcionais) — enviar JSON aqui faz o corpo
  // chegar vazio na validação. Por isso sempre construímos FormData, mesmo sem arquivos.
  create: (data: StudentCreatePayload) => http.postForm<Student>("/student", toStudentFormData(data)),
  update:       (id: string, data: StudentUpdatePayload) => http.patch<Student>(`/student/${id}`, data),
  deactivate:   (id: string)                      => http.patch<{ message: string }>(`/student/${id}/deactivate`, {}),
  reactivate:   (id: string)                      => http.patch<Student>(`/student/${id}/activate`, {}),
};
