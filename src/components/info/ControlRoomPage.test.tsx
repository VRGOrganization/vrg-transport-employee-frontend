import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { server } from "@/mocks/server";
import { ControlRoomPage } from "./ControlRoomPage";

// ── Navegação: a lente vive na URL ──────────────────────────────────────────
const replaceMock = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/admin/info",
  useSearchParams: () => searchParams,
}));

const NOW = "2026-03-01T12:00:00.000Z";

function allocation(day: string, period: string, busId: string, busIdentifier: string) {
  return {
    day,
    period,
    busId,
    busIdentifier,
    status: "active",
    needsOutbound: true,
    needsReturn: true,
  };
}

/** Conta as requisições por caminho, para provar que filtros não vão à rede. */
const requestLog: string[] = [];

function installHandlers() {
  const students = [
    {
      _id: "stu-1",
      name: "Ana",
      email: "ana@x.com",
      telephone: "1",
      degree: "Engenharia",
      shift: "Manhã",
      universityId: "uni-1",
      status: "ACTIVE",
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
    {
      _id: "stu-2",
      name: "Bruno",
      email: "bruno@x.com",
      telephone: "2",
      degree: "Direito",
      shift: "Noite",
      universityId: "uni-2",
      status: "ACTIVE",
      active: true,
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  const requests = [
    {
      _id: "req-1",
      studentId: "stu-1",
      type: "initial",
      changedDocuments: [],
      status: "approved",
      rejectionReason: null,
      rejectedAt: null,
      licenseId: "lic-1",
      enrollmentCycleId: "cycle-1",
      universityId: "uni-1",
      allocationSummary: [
        allocation("SEG", "Manhã", "bus-1", "Ônibus 01"),
        allocation("QUA", "Manhã", "bus-1", "Ônibus 01"),
      ],
      createdAt: NOW,
    },
    {
      _id: "req-2",
      studentId: "stu-2",
      type: "initial",
      changedDocuments: [],
      status: "approved",
      rejectionReason: null,
      rejectedAt: null,
      licenseId: "lic-2",
      enrollmentCycleId: "cycle-1",
      universityId: "uni-2",
      allocationSummary: [allocation("QUA", "Noite", "bus-2", "Ônibus 02")],
      createdAt: NOW,
    },
    // Pedido de um ciclo ANTERIOR: não pode aparecer no ciclo ativo.
    {
      _id: "req-3",
      studentId: "stu-1",
      type: "initial",
      changedDocuments: [],
      status: "approved",
      rejectionReason: null,
      rejectedAt: null,
      licenseId: "lic-0",
      enrollmentCycleId: "cycle-0",
      universityId: "uni-1",
      allocationSummary: [allocation("SEX", "Tarde", "bus-1", "Ônibus 01")],
      createdAt: "2025-01-01T00:00:00.000Z",
    },
  ];

  const paginated = <T,>(data: T[]) => ({
    data,
    total: data.length,
    page: 1,
    limit: 100,
  });

  server.use(
    http.get("/api/v1/license-request", ({ request }) => {
      requestLog.push(new URL(request.url).pathname);
      return HttpResponse.json({
        data: requests,
        total: requests.length,
        page: 1,
        limit: 1000,
      });
    }),
    http.get("/api/v1/student/all", ({ request }) => {
      requestLog.push(new URL(request.url).pathname);
      return HttpResponse.json(students);
    }),
    http.get("/api/v1/student/inactive", () =>
      HttpResponse.json({ data: [], total: 7, page: 1, limit: 1 }),
    ),
    http.get("/api/v1/bus/active", ({ request }) => {
      requestLog.push(new URL(request.url).pathname);
      return HttpResponse.json(
        paginated([
          {
            _id: "bus-1",
            identifier: "Ônibus 01",
            shift: "Manhã",
            capacity: 40,
            active: true,
            universitySlots: [],
            createdAt: NOW,
            updatedAt: NOW,
          },
          {
            _id: "bus-2",
            identifier: "Ônibus 02",
            shift: "Noite",
            capacity: 30,
            active: true,
            universitySlots: [],
            createdAt: NOW,
            updatedAt: NOW,
          },
        ]),
      );
    }),
    http.get("/api/v1/bus/inactive", () =>
      HttpResponse.json({ data: [], total: 1, page: 1, limit: 1 }),
    ),
    http.get("/api/v1/university", ({ request }) => {
      requestLog.push(new URL(request.url).pathname);
      return HttpResponse.json(
        paginated([
          {
            _id: "uni-1",
            name: "Universidade Alpha",
            acronym: "UA",
            address: "Rua A",
            active: true,
            createdAt: NOW,
            updatedAt: NOW,
          },
          {
            _id: "uni-2",
            name: "Universidade Beta",
            acronym: "UB",
            address: "Rua B",
            active: true,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ]),
      );
    }),
    http.get("/api/v1/course", () =>
      HttpResponse.json(
        paginated([
          {
            _id: "c1",
            name: "Engenharia",
            universityId: "uni-1",
            model: "Bacharel",
            active: true,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ]),
      ),
    ),
    http.get("/api/v1/enrollment-period", () =>
      HttpResponse.json(
        paginated([
          {
            _id: "cycle-1",
            status: "active",
            startDate: "2026-02-01T00:00:00.000Z",
            endDate: "2026-06-30T00:00:00.000Z",
            cycleStartDate: "2026-02-01T00:00:00.000Z",
            totalSlots: 100,
            filledSlots: 3,
            licenseValidityMonths: 6,
            active: true,
            createdByAdminId: "a",
            closedByAdminId: null,
            closedAt: null,
            createdAt: NOW,
            updatedAt: NOW,
          },
          {
            _id: "cycle-0",
            status: "closed",
            startDate: null,
            endDate: "2025-06-30T00:00:00.000Z",
            cycleStartDate: "2025-01-01T00:00:00.000Z",
            totalSlots: 100,
            filledSlots: 1,
            licenseValidityMonths: 6,
            active: false,
            createdByAdminId: "a",
            closedByAdminId: "a",
            closedAt: "2025-06-30T00:00:00.000Z",
            createdAt: NOW,
            updatedAt: NOW,
          },
        ]),
      ),
    ),
    http.get("/api/v1/enrollment-period/active", () =>
      HttpResponse.json({ _id: "cycle-1", cycleStartDate: "2026-02-01T00:00:00.000Z" }),
    ),
    http.get("/api/v1/employee", () =>
      HttpResponse.json({ data: [], total: 4, page: 1, limit: 1 }),
    ),
    http.get("/api/v1/employee/inactive", () =>
      HttpResponse.json({ data: [], total: 2, page: 1, limit: 1 }),
    ),
  );
}

/**
 * A faixa de leitura é montada por pedaços (texto + números clicáveis), então
 * a asserção precisa ser sobre o parágrafo, não sobre um nó de texto solto.
 */
async function findReadout(): Promise<HTMLElement> {
  return await screen.findByRole("status", { name: "Situação do recorte" });
}

describe("ControlRoomPage", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    requestLog.length = 0;
    searchParams = new URLSearchParams();
    installHandlers();
  });

  it("carrega e escreve a faixa de leitura com os números do ciclo ativo", async () => {
    render(<ControlRoomPage />);

    // 2 alunos ativos, 2 carteirinhas no ciclo ativo (a do ciclo anterior
    // não entra). O texto é montado por pedaços, então a asserção é sobre o
    // parágrafo inteiro.
    const readout = await findReadout();
    expect(readout).toHaveTextContent("2 alunos ativos");
    expect(readout).toHaveTextContent("2 carteirinhas emitidas");
  });

  it("não conta pedidos de ciclos anteriores no ciclo ativo", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    // A viagem de sexta pertence ao ciclo encerrado.
    const sexta = screen.getByRole("gridcell", { name: /Sexta, tarde/ });
    expect(sexta).toHaveAccessibleName(/0 alunos/);
  });

  it("monta a grade a partir do allocationSummary", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    expect(
      screen.getByRole("gridcell", { name: "Quarta, manhã: 1 aluno em 1 ônibus" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("gridcell", { name: "Quarta, noite: 1 aluno em 1 ônibus" }),
    ).toBeInTheDocument();
  });

  it("aplicar um filtro NÃO dispara nova requisição de rede", async () => {
    const user = userEvent.setup();
    render(<ControlRoomPage />);

    await findReadout();
    const callsAfterLoad = requestLog.length;
    expect(callsAfterLoad).toBeGreaterThan(0);

    await user.click(screen.getByRole("gridcell", { name: /Segunda, manhã/ }));

    // A lente foi para a URL…
    await waitFor(() => expect(replaceMock).toHaveBeenCalled());
    expect(replaceMock.mock.calls[0][0]).toContain("day=SEG");
    expect(replaceMock.mock.calls[0][0]).toContain("period=Manh");

    // …e nenhuma requisição nova saiu: filtros são redução em memória.
    expect(requestLog).toHaveLength(callsAfterLoad);
  });

  it("reproduz o recorte que vem da URL", async () => {
    searchParams = new URLSearchParams({ uni: "uni-2" });
    render(<ControlRoomPage />);

    const readout = await findReadout();
    expect(readout).toHaveTextContent("Em UB");
    expect(readout).toHaveTextContent("1 aluno viaja");

    // O chip do recorte aparece e é removível.
    expect(
      screen.getByRole("button", { name: /Remover filtro UB/ }),
    ).toBeInTheDocument();
  });

  it("mostra a frota com um trilho por ônibus", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    const frota = screen.getByRole("region", { name: /Frota/ }) ?? document.body;
    expect(within(frota).getByText("Ônibus 01")).toBeInTheDocument();
    expect(within(frota).getByText("Ônibus 02")).toBeInTheDocument();
  });

  it("lista as faculdades com a contagem de alunos", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    expect(screen.getByText("Universidade Alpha")).toBeInTheDocument();
    expect(screen.getByText("Universidade Beta")).toBeInTheDocument();
  });

  it("traz o censo de pessoas", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    expect(screen.getByText("2 ativos")).toBeInTheDocument();
    expect(screen.getByText("7 inativos")).toBeInTheDocument();
    expect(screen.getByText("4 ativos")).toBeInTheDocument();
  });

  it("nunca chama /license/all", async () => {
    render(<ControlRoomPage />);

    await findReadout();

    expect(requestLog.some((path) => path.includes("/license/all"))).toBe(false);
  });
});
