import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { StudentsListPage } from "./StudentsListPage";
import { http } from "@/services/http";
import { studentService } from "@/services/studentService";
import { banlistService } from "@/services/banlistService";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import type { Student } from "@/types/student";

vi.mock("@/services/studentService", () => ({
  studentService: {
    list: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock("@/services/banlistService", () => ({
  banlistService: {
    list: vi.fn(),
    getByStudent: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("@/services/enrollmentPeriodService", () => ({
  enrollmentPeriodService: {
    getActive: vi.fn(),
  },
}));

vi.mock("@/services/http", () => ({
  http: {
    get: vi.fn(),
  },
}));

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const listStudentsMock = vi.mocked(studentService.list);
const listBansMock = vi.mocked(banlistService.list);
const getActiveEnrollmentMock = vi.mocked(enrollmentPeriodService.getActive);
const httpGetMock = vi.mocked(http.get);

function makeStudent(over: Partial<Student> = {}): Student {
  return {
    _id: "student-1",
    name: "Aluno Um",
    email: "aluno1@example.com",
    telephone: "11999999999",
    active: true,
    hasPersonalDocuments: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
    ...over,
  };
}

const OPEN_CYCLE = {
  _id: "cycle-1",
  startDate: "2024-01-01",
  endDate: "2024-02-01",
  cycleStartDate: "2024-01-01",
  totalSlots: 100,
  filledSlots: 0,
  licenseValidityMonths: 12,
  active: true,
  createdByAdminId: "admin-1",
  closedByAdminId: null,
  closedAt: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

async function openDropdown(studentName: string) {
  const row = (await screen.findByText(studentName)).closest("tr");
  if (!row) throw new Error("Linha do estudante não encontrada");
  const toggle = row.querySelector("button");
  if (!toggle) throw new Error("Botão de ações não encontrado");
  fireEvent.click(toggle);
}

describe("StudentsListPage — bloqueio de 'Novo pedido' manual de carteirinha", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue([makeStudent()]);
    listBansMock.mockResolvedValue([]);
  });

  it("desabilita 'Novo pedido' quando o ciclo de inscrição está fechado", async () => {
    getActiveEnrollmentMock.mockResolvedValue({
      _id: "cycle-1",
      startDate: null,
      endDate: null,
      cycleStartDate: "2024-01-01",
      totalSlots: 100,
      filledSlots: 0,
      licenseValidityMonths: 12,
      active: true,
      createdByAdminId: "admin-1",
      closedByAdminId: null,
      closedAt: null,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });
    httpGetMock.mockRejectedValue(new Error("not found"));

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    const newRequestBtn = await screen.findByText("Novo pedido");
    expect(newRequestBtn.closest("button")).toBeDisabled();

    fireEvent.click(newRequestBtn);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("desabilita 'Novo pedido' quando o aluno já possui carteirinha, mesmo com ciclo aberto", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockResolvedValue({ _id: "license-1" });

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Novo pedido").closest("button")).toBeDisabled();
    });

    fireEvent.click(screen.getByText("Novo pedido"));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("desabilita 'Novo pedido' quando o aluno não possui documentos pessoais (RG e/ou comprovante de residência)", async () => {
    listStudentsMock.mockResolvedValue([makeStudent({ hasPersonalDocuments: false })]);
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockRejectedValue(new Error("not found"));

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Novo pedido").closest("button")).toBeDisabled();
    });

    fireEvent.click(screen.getByText("Novo pedido"));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("permite 'Novo pedido' quando o ciclo está aberto, sem carteirinha e com documentos pessoais completos", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockRejectedValue(new Error("not found"));

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Novo pedido").closest("button")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByText("Novo pedido"));
    expect(pushMock).toHaveBeenCalledWith("/admin/students/license/new?id=student-1");
  });
});
