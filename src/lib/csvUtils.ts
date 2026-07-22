function escapeVal(v: unknown): string {
  if (v === null || v === undefined) return '""';
  const s = String(v).replace(/"/g, '""').replace(/[\r\n]+/g, " ");
  return `"${s}"`;
}

function csvRow(values: unknown[]): string {
  return values.map(escapeVal).join(",");
}

const SHIFT_MAP: Record<string, string> = {
  diurno: "Diurno",
  noturno: "Noturno",
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
};

function shiftLabel(shift: string | null | undefined): string {
  if (!shift) return "—";
  return SHIFT_MAP[shift] ?? shift;
}

function studentStatus(status: string | undefined, active: boolean): string {
  if (status === "PENDING") return "Pendente";
  if (status === "ACTIVE") return "Ativo";
  return active ? "Ativo" : "Inativo";
}

export interface CsvStudent {
  name: string;
  socialName?: string | null;
  email: string;
  telephone?: string;
  institution?: string;
  shift?: string;
  active: boolean;
  status?: string;
  createdAt: string;
}

export interface CsvEmployee {
  name: string;
  email: string;
  registrationId?: string;
  active: boolean;
  createdAt: string;
}

export interface CsvBus {
  identifier: string;
  shift?: string | null;
  capacity?: number | null;
  filledSlotsTotal?: number;
  active: boolean;
}

export interface CsvUniversity {
  name: string;
  acronym?: string;
  address?: string;
  active: boolean;
}

export function buildStudentsCsv(rows: CsvStudent[]): string {
  const header = csvRow(["Nome", "Nome social", "Email", "Telefone", "Instituição", "Turno", "Ativo", "Status", "Data de Cadastro"]);
  const body = rows.map((s) =>
    csvRow([
      s.name,
      s.socialName ?? "",
      s.email,
      s.telephone ?? "",
      s.institution ?? "",
      shiftLabel(s.shift),
      s.active ? "Sim" : "Não",
      studentStatus(s.status, s.active),
      new Date(s.createdAt).toLocaleDateString("pt-BR"),
    ])
  );
  return [header, ...body].join("\n");
}

export function buildEmployeesCsv(rows: CsvEmployee[]): string {
  const header = csvRow(["Nome", "Email", "Matrícula", "Ativo", "Data de Cadastro"]);
  const body = rows.map((e) =>
    csvRow([
      e.name,
      e.email,
      e.registrationId ?? "",
      e.active ? "Sim" : "Não",
      new Date(e.createdAt).toLocaleDateString("pt-BR"),
    ])
  );
  return [header, ...body].join("\n");
}

export function buildBusesCsv(rows: CsvBus[]): string {
  const header = csvRow(["Identificador", "Turno", "Capacidade", "Vagas Preenchidas", "Ativo"]);
  const body = rows.map((b) =>
    csvRow([
      b.identifier,
      shiftLabel(b.shift),
      b.capacity ?? "Sem limite",
      b.filledSlotsTotal ?? 0,
      b.active ? "Sim" : "Não",
    ])
  );
  return [header, ...body].join("\n");
}

export function buildUniversitiesCsv(rows: CsvUniversity[]): string {
  const header = csvRow(["Nome", "Sigla", "Endereço", "Ativo"]);
  const body = rows.map((u) =>
    csvRow([u.name, u.acronym ?? "", u.address ?? "", u.active ? "Sim" : "Não"])
  );
  return [header, ...body].join("\n");
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
