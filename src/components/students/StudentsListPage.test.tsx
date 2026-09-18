import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import { StudentsListPage } from "./StudentsListPage";
import { http } from "@/services/http";
import { studentService } from "@/services/studentService";
import { banlistService } from "@/services/banlistService";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import { licenseRequestService } from "@/services/licenseRequestService";
import type { Student, StudentListFlags } from "@/types/student";

vi.mock("@/services/studentService", () => ({
  studentService: {
    list: vi.fn(),
    listFlags: vi.fn(),
    getById: vi.fn(),
  },
}));

vi.mock("@/services/banlistService", () => ({
  banlistService: {
    list: vi.fn(),
    getHistory: vi.fn().mockResolvedValue([]),
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
const listFlagsMock = vi.mocked(studentService.listFlags);
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

const NO_FLAGS: StudentListFlags = {
  activeLicenseStudentIds: [],
  licenseRequestAwaitingReviewStudentIds: [],
  busPassAwaitingReviewStudentIds: [],
};

// "Carteirinha" também é o nome de um filtro da toolbar: procurar o item só
// dentro do menu de ações aberto.
async function menuItem(label: string) {
  return within(await screen.findByRole("menu")).getByText(label);
}

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
    listFlagsMock.mockResolvedValue(NO_FLAGS);
    listBansMock.mockResolvedValue([]);
    findRequestsByStudentMock.mockResolvedValue([]);
    // clearAllMocks apaga o retorno declarado no vi.mock — rearmar aqui.
    vi.mocked(banlistService.getHistory).mockResolvedValue([]);
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

    await waitFor(async () => {
      expect((await menuItem("Carteirinha")).closest("button")).toBeDisabled();
    });
  });

  it("desabilita 'Carteirinha' quando a carteirinha existe mas não está aprovada (status diferente de active)", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockResolvedValue({ _id: "license-1", status: "rejected" });

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(async () => {
      expect((await menuItem("Carteirinha")).closest("button")).toBeDisabled();
    });
  });

  it("permite 'Carteirinha' quando a carteirinha existe com status active", async () => {
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    httpGetMock.mockResolvedValue({ _id: "license-1", status: "active" });

    render(<StudentsListPage role="admin" />);

    await openDropdown("Aluno Um");

    await waitFor(async () => {
      expect((await menuItem("Carteirinha")).closest("button")).not.toBeDisabled();
    });
  });
});

describe("StudentsListPage — filtros da toolbar", () => {
  const withDocs = makeStudent({ _id: "s-docs", name: "Com Documentos", hasPersonalDocuments: true });
  const withoutDocs = makeStudent({ _id: "s-nodocs", name: "Sem Documentos", hasPersonalDocuments: false });
  const licensed = makeStudent({ _id: "s-license", name: "Com Carteirinha" });
  const pendingLicense = makeStudent({ _id: "s-req", name: "Pedido Pendente" });
  const pendingPass = makeStudent({ _id: "s-pass", name: "Passe Pendente" });
  const all = [withDocs, withoutDocs, licensed, pendingLicense, pendingPass];

  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue(all);
    listFlagsMock.mockResolvedValue({
      activeLicenseStudentIds: ["s-license"],
      licenseRequestAwaitingReviewStudentIds: ["s-req"],
      busPassAwaitingReviewStudentIds: ["s-pass"],
    });
    listBansMock.mockResolvedValue([]);
    getActiveEnrollmentMock.mockResolvedValue(OPEN_CYCLE);
    vi.mocked(banlistService.getHistory).mockResolvedValue([]);
  });

  async function pick(filterName: RegExp, option: string) {
    fireEvent.click(await screen.findByRole("button", { name: filterName }));
    fireEvent.click(await screen.findByRole("option", { name: option }));
  }

  function visibleNames() {
    return all.map((s) => s.name).filter((name) => screen.queryByText(name));
  }

  it("filtra por documentos pessoais não enviados", async () => {
    render(<StudentsListPage role="employee" />);
    await screen.findByText("Sem Documentos");

    await pick(/^Documentos/, "Não enviados");

    await waitFor(() => expect(visibleNames()).toEqual(["Sem Documentos"]));
  });

  it("filtra por carteirinha ativa", async () => {
    render(<StudentsListPage role="employee" />);
    await screen.findByText("Com Carteirinha");

    await pick(/^Carteirinha/, "Ativa");

    await waitFor(() => expect(visibleNames()).toEqual(["Com Carteirinha"]));
  });

  it.each([
    ["Carteirinha ou passe", ["Pedido Pendente", "Passe Pendente"]],
    ["Carteirinha", ["Pedido Pendente"]],
    ["Passe", ["Passe Pendente"]],
    ["Nada pendente", ["Com Documentos", "Sem Documentos", "Com Carteirinha"]],
  ])("filtra aguardando análise: %s", async (option, expected) => {
    render(<StudentsListPage role="employee" />);
    await screen.findByText("Passe Pendente");

    await pick(/^Aguardando análise/, option);

    await waitFor(() => expect(visibleNames()).toEqual(expected));
  });

  it("'Limpar filtros' volta a mostrar todos", async () => {
    render(<StudentsListPage role="employee" />);
    await screen.findByText("Com Carteirinha");
    expect(screen.queryByText("Limpar filtros")).not.toBeInTheDocument();

    await pick(/^Carteirinha/, "Ativa");
    await waitFor(() => expect(visibleNames()).toEqual(["Com Carteirinha"]));

    fireEvent.click(screen.getByText("Limpar filtros"));

    await waitFor(() => expect(visibleNames()).toHaveLength(all.length));
    expect(screen.queryByText("Limpar filtros")).not.toBeInTheDocument();
  });

  it("sem as flags, a lista carrega e os filtros que dependem delas ficam desabilitados", async () => {
    listFlagsMock.mockRejectedValue(new Error("falhou"));

    render(<StudentsListPage role="employee" />);
    await screen.findByText("Com Carteirinha");

    expect(screen.getByRole("button", { name: /^Documentos/ })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /^Carteirinha/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Aguardando análise/ })).toBeDisabled();
  });
});
