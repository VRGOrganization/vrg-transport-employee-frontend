import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import { http } from "@/services/http";
import { studentService } from "@/services/studentService";
import { employeeService } from "@/services/employeeService";
import { busApi } from "@/lib/universityApi";

vi.mock("@/services/studentService", () => ({
  studentService: {
    list: vi.fn(),
    dashboardStats: vi.fn(),
  },
}));

vi.mock("@/services/employeeService", () => ({
  employeeService: {
    list: vi.fn(),
  },
}));

vi.mock("@/lib/universityApi", () => ({
  universityApi: { list: vi.fn() },
  busApi: { fleetCapacity: vi.fn() },
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
const dashboardStatsMock = vi.mocked(studentService.dashboardStats);
const listEmployeesMock = vi.mocked(employeeService.list);
const fleetCapacityMock = vi.mocked(busApi.fleetCapacity);
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

// Em produção estes dois KPIs quebravam: "Alunos ativos" era contado em cima
// da página de /student (teto de 20) e a frota sumia quando não havia ciclo
// de inscrição aberto.
describe("AdminDashboardPage — KPIs independentes de paginação e de ciclo", () => {
  // 120 alunos na base, mas a API só devolve a primeira página.
  const pageOfStudents = Array.from({ length: 100 }, (_, i) => ({
    _id: `student-${i}`,
    name: `Aluno ${i}`,
    email: `aluno${i}@a.com`,
    active: true,
    status: "ACTIVE",
    createdAt: "2024-01-01",
  }));

  beforeEach(() => {
    vi.clearAllMocks();
    listEmployeesMock.mockResolvedValue([] as never);
    dashboardStatsMock.mockResolvedValue({
      totalStudents: 1234,
      studentsWithCard: 1000,
      studentsWithoutCard: 234,
      studentsWithPendingRequest: 57,
    } as never);
    fleetCapacityMock.mockResolvedValue({ totalSlots: 1250 } as never);
    httpGetMock.mockImplementation((path: string) => {
      if (path.startsWith("/student")) {
        return Promise.resolve({ data: pageOfStudents, total: 1234, page: 1, limit: 100 }) as never;
      }
      // Sem ciclo de inscrição ativo: o backend devolve null, que o http
      // client entrega como {}.
      return Promise.resolve({}) as never;
    });
  });

  it("conta alunos ativos pelo censo agregado, não pela página carregada", async () => {
    render(<DashboardPage role="admin" />);

    await waitFor(() => expect(dashboardStatsMock).toHaveBeenCalled());
    // 1.234 do censo — não 100, que é o tamanho da página.
    await waitFor(() => expect(screen.getByText("1.234")).toBeInTheDocument());
    expect(screen.queryByText("100")).not.toBeInTheDocument();
  });

  it("conta solicitações pendentes pelo censo agregado", async () => {
    render(<DashboardPage role="admin" />);

    await waitFor(() => expect(screen.getByText("57")).toBeInTheDocument());
  });

  it("pede /student com limit explícito para não truncar em 20", async () => {
    render(<DashboardPage role="admin" />);

    await waitFor(() => expect(httpGetMock).toHaveBeenCalled());
    const studentCall = httpGetMock.mock.calls.find((c) =>
      String(c[0]).startsWith("/student"),
    );
    expect(studentCall?.[0]).toContain("limit=");
  });

  it("sem ciclo ativo, mostra a capacidade da frota em vez de '-'", async () => {
    render(<DashboardPage role="admin" />);

    await waitFor(() => expect(fleetCapacityMock).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText("0/1250")).toBeInTheDocument());
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("com ciclo ativo, mantém ocupadas/total do ciclo", async () => {
    httpGetMock.mockImplementation((path: string) => {
      if (path.startsWith("/student")) {
        return Promise.resolve({ data: pageOfStudents, total: 1234, page: 1, limit: 100 }) as never;
      }
      if (path === "/enrollment-period/active") {
        return Promise.resolve({
          _id: "cycle-1",
          startDate: "2024-01-01",
          endDate: "2024-12-31",
          totalSlots: 1250,
          filledSlots: 847,
          active: true,
        }) as never;
      }
      return Promise.resolve({}) as never;
    });

    render(<DashboardPage role="admin" />);

    await waitFor(() => expect(screen.getByText("847/1250")).toBeInTheDocument());
  });
});
