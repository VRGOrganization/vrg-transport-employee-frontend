import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { StudentsListPage } from "./StudentsListPage";
import { http } from "@/services/http";
import { studentService } from "@/services/studentService";
import { banlistService } from "@/services/banlistService";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import { licenseRequestService } from "@/services/licenseRequestService";
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

vi.mock("@/services/licenseRequestService", () => ({
  licenseRequestService: {
    findByStudent: vi.fn(),
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
const findRequestsByStudentMock = vi.mocked(licenseRequestService.findByStudent);

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
    findRequestsByStudentMock.mockResolvedValue([]);
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

  it("desabilita 'Novo pedido' quando o aluno já possui uma solicitação pendente", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockRejectedValue(new Error("not found"));
    findRequestsByStudentMock.mockResolvedValue([{ status: "pending" }]);

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

  it("desabilita 'Carteirinha' quando o aluno não possui carteirinha", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockRejectedValue(new Error("not found"));

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Carteirinha").closest("button")).toBeDisabled();
    });
  });

  it("desabilita 'Carteirinha' quando a carteirinha existe mas não está aprovada (status diferente de active)", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockResolvedValue({ _id: "license-1", status: "rejected" });

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Carteirinha").closest("button")).toBeDisabled();
    });
  });

  it("permite 'Carteirinha' quando a carteirinha existe com status active", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockResolvedValue({ _id: "license-1", status: "active" });

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(() => {
      expect(screen.getByText("Carteirinha").closest("button")).not.toBeDisabled();
    });
  });
});

describe("StudentsListPage — direção do menu de ações", () => {
  // Abrir para baixo nas últimas linhas estourava o container da tabela e
  // criava um segundo scroll vertical. Da 7ª linha em diante o menu abre para
  // cima (bottom-full) em vez de para baixo (top-full).
  const manyStudents = Array.from({ length: 10 }, (_, i) =>
    makeStudent({
      _id: `student-${i + 1}`,
      name: `Aluno ${String(i + 1).padStart(2, "0")}`,
      email: `aluno${i + 1}@example.com`,
    }),
  );

  beforeEach(() => {
    listStudentsMock.mockResolvedValue(manyStudents);
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockRejectedValue(new Error("not found"));
  });

  /** Abre o menu da linha informada (1-based) e devolve o container do menu. */
  async function openMenuAtRow(rowNumber: number) {
    const name = `Aluno ${String(rowNumber).padStart(2, "0")}`;
    const row = (await screen.findByText(name)).closest("tr")!;
    fireEvent.click(row.querySelector("button")!);
    // o menu é o irmão posicionado do botão de ações
    return row.querySelector('[class*="absolute"][class*="w-36"]') as HTMLElement;
  }

  it("abre para baixo nas seis primeiras linhas", async () => {
    render(<StudentsListPage role="admin" />);

    for (const rowNumber of [1, 6]) {
      const menu = await openMenuAtRow(rowNumber);
      expect(menu.className).toContain("top-full");
      expect(menu.className).not.toContain("bottom-full");
    }
  });

  it("abre para cima a partir da sétima linha", async () => {
    render(<StudentsListPage role="admin" />);

    for (const rowNumber of [7, 10]) {
      const menu = await openMenuAtRow(rowNumber);
      expect(menu.className).toContain("bottom-full");
      expect(menu.className).not.toContain("top-full");
    }
  });
});
