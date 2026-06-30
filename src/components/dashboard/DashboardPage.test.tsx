import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import { http } from "@/services/http";
import { studentService } from "@/services/studentService";

vi.mock("@/services/studentService", () => ({
  studentService: {
    list: vi.fn(),
  },
}));

vi.mock("@/services/http", () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/components/hooks/useEmployeeAuth", () => ({
  useEmployeeAuth: () => ({ user: { name: "Maria Silva" }, logout: vi.fn() }),
}));

// Tabela pesada — substituída para isolar os cards de estatística.
vi.mock("@/components/admin/dashboard/DashboardUsersTable", () => ({
  DashboardUsersTable: () => <div data-testid="users-table" />,
}));

const listStudentsMock = vi.mocked(studentService.list);
const httpGetMock = vi.mocked(http.get);

describe("EmployeeDashboardPage (unificado)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue([
      { _id: "student-1", name: "Aluno Um", email: "a@a.com", active: true, createdAt: "2024-01-01" },
      { _id: "student-2", name: "Aluno Dois", email: "b@b.com", active: true, createdAt: "2024-01-02" },
    ] as never);
    // Apenas student-1 tem carteirinha → student-2 fica pendente.
    httpGetMock.mockResolvedValue([{ _id: "license-1", studentId: "student-1" }] as never);
  });

  it("renderiza os cards de alunos ativos e solicitações pendentes", async () => {
    render(<DashboardPage role="employee" />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    expect(screen.getByText("Alunos ativos")).toBeInTheDocument();
    expect(screen.getByText("Solicitações pendentes")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("2")).toBeInTheDocument()); // ativos
    expect(screen.getByText("1")).toBeInTheDocument(); // pendentes
  });

  it("não acessa endpoints admin-only (employees / license-request / student)", async () => {
    render(<DashboardPage role="employee" />);

    await waitFor(() => expect(listStudentsMock).toHaveBeenCalled());

    const paths = httpGetMock.mock.calls.map((c) => c[0]);
    expect(paths).toContain("/license/all");
    expect(paths).not.toContain("/student");
    expect(paths).not.toContain("/license-request");
    expect(paths).not.toContain("/enrollment-period/active");
  });
});
