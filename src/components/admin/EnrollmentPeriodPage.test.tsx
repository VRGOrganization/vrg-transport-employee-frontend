import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { activePeriodStub } = vi.hoisted(() => ({
  activePeriodStub: {
    _id: "p1",
    // Instantes na convenção do app: meia-noite e fim de dia de Brasília.
    startDate: "2030-06-01T03:00:00.000Z",
    endDate: "2030-06-16T02:59:59.999Z",
    // Distinta de startDate/endDate de propósito — simula uma repescagem
    // aberta meses depois do início real do ciclo.
    cycleStartDate: "2030-01-01T03:00:00.000Z",
    resetScheduledFor: "2030-07-01T03:00:00.000Z",
    totalSlots: 350,
    filledSlots: 70,
    licenseValidityMonths: 6,
    active: true,
    createdByAdminId: "a1",
    closedByAdminId: null,
    closedAt: null,
    createdAt: "2030-01-01T00:00:00.000Z",
    updatedAt: "2030-01-01T00:00:00.000Z",
  },
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("react-day-picker", () => ({
  DayPicker: () => null,
}));

vi.mock("@/lib/toast", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/services/enrollmentPeriodService", () => ({
  enrollmentPeriodService: {
    getActive: vi.fn().mockResolvedValue(activePeriodStub),
    list: vi.fn().mockResolvedValue([activePeriodStub]),
    create: vi.fn().mockResolvedValue(activePeriodStub),
    update: vi.fn().mockResolvedValue(activePeriodStub),
    close: vi.fn().mockResolvedValue({ ...activePeriodStub, active: false }),
    scheduleReset: vi.fn().mockResolvedValue(activePeriodStub),
    openWindow: vi.fn(),
    closeWindow: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("@/services/http", () => ({
  http: {
    get: vi.fn().mockImplementation((path: string) => {
      if (path === "/student") return Promise.resolve([]);
      if (path.includes("/waitlisted")) return Promise.resolve({ data: [], total: 0 });
      return Promise.resolve([]);
    }),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import { EnrollmentPeriodPage } from "./EnrollmentPeriodPage";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";

describe("EnrollmentPeriodPage — vaga-dia labels", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders "Ocupação (vaga-dia)" label in the progress card', async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("Ocupação (vaga-dia)")).toBeInTheDocument();
    });
  });

  it('renders InfoTooltip button next to the occupancy label', async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(
        screen.getAllByRole("button", { name: "O que é vaga-dia?" }).length
      ).toBeGreaterThan(0);
    });
  });

  it('table header shows "Total (vaga-dia)"', async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("Total (vaga-dia)")).toBeInTheDocument();
    });
  });

  it('table header shows "Ocupadas (vaga-dia)"', async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("Ocupadas (vaga-dia)")).toBeInTheDocument();
    });
  });

  it("does not alter the slot numbers from the backend", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("70 / 350")).toBeInTheDocument();
    });
  });
});

describe("EnrollmentPeriodPage — prévia de validade usa cycleStartDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("computes 'carteirinha válida até' from cycleStartDate, not endDate (regression)", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      // cycleStartDate (2030-01-01) + 6 meses = 01/07/2030
      expect(screen.getByText("01/07/2030")).toBeInTheDocument();
    });
    // endDate (2030-06-15) + 6 meses seria 15/12/2030 — não deve aparecer.
    expect(screen.queryByText("15/12/2030")).not.toBeInTheDocument();
  });
});

describe("EnrollmentPeriodPage — ações condicionadas ao estado da janela (Núcleo 11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);
  });

  it("with an open window: shows 'Editar' and 'Fechar janela', hides 'Abrir janela de inscrição'", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /fechar janela/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /abrir janela de inscrição/i }),
    ).not.toBeInTheDocument();
  });

  it("with no window open: shows 'Abrir janela de inscrição', hides 'Editar' and 'Fechar janela'", async () => {
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue({
      ...activePeriodStub,
      startDate: null,
      endDate: null,
    } as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /abrir janela de inscrição/i }),
      ).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /^editar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /fechar janela/i })).not.toBeInTheDocument();
  });

  it("with no live cycle: shows only 'Abrir novo período', which opens the cycle-only modal", async () => {
    vi.mocked(enrollmentPeriodService.getActive).mockRejectedValue({ status: 404 });
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("Abrir novo período")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Abrir novo período" }));

    await waitFor(() => {
      expect(screen.getByText("Abrir novo período de inscrição")).toBeInTheDocument();
    });
    expect(screen.queryByLabelText(/data de fim/i)).not.toBeInTheDocument();
  });

  it("clicking 'Fechar janela' and confirming calls closeWindow with the cycle id", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /fechar janela/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /fechar janela/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/deseja fechar a janela de inscrição atual/i),
      ).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole("button", { name: "Fechar janela" });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(enrollmentPeriodService.closeWindow).toHaveBeenCalledWith(activePeriodStub._id);
    });
  });
});

describe("EnrollmentPeriodPage — funcionalidade de reabrir removida (Núcleo 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("não mostra nenhum botão/texto de reabertura com ciclo vivo", async () => {
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    });
    expect(screen.queryByText(/reabrir/i)).not.toBeInTheDocument();
  });

  it("não mostra nenhum botão/texto de reabertura sem ciclo vivo, mesmo com histórico de ciclo encerrado", async () => {
    const closedPeriod = {
      ...activePeriodStub,
      _id: "p0",
      active: false,
      startDate: null,
      endDate: null,
      closedAt: "2030-02-01T00:00:00.000Z",
    };
    vi.mocked(enrollmentPeriodService.getActive).mockRejectedValue({ status: 404 });
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([closedPeriod] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("Histórico de ciclos")).toBeInTheDocument();
    });
    expect(screen.getByText("Abrir novo período")).toBeInTheDocument();
    expect(screen.queryByText(/reabrir/i)).not.toBeInTheDocument();
  });
});

describe("EnrollmentPeriodPage — computeLicenseExpiry em UTC, alinhado ao addMonthsBR do backend", () => {
  const originalTZ = process.env.TZ;

  afterEach(() => {
    process.env.TZ = originalTZ;
    vi.clearAllMocks();
  });

  it("usa o dia UTC de cycleStartDate + meses, independente do fuso do runtime", async () => {
    // Europe/Paris = UTC+1 no inverno. O backend computa a validade com
    // setUTCMonth sobre cycleStartDate e a UI espelha isso formatando em UTC
    // (timeZone: "UTC"). 2030-01-15T23:30Z + 6 meses (UTC) = 2030-07-15T23:30Z,
    // exibido como 15/07/2030 — o MESMO dia que o backend persistiu, não o dia
    // local (16) do runtime.
    process.env.TZ = "Europe/Paris";
    const period = {
      ...activePeriodStub,
      cycleStartDate: "2030-01-15T23:30:00.000Z",
      startDate: null,
      endDate: null,
      licenseValidityMonths: 6,
    };
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(period as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([period] as never);

    render(<EnrollmentPeriodPage role="admin" />);

    await waitFor(() => {
      expect(screen.getByText("15/07/2030")).toBeInTheDocument();
    });
    expect(screen.queryByText("16/07/2030")).not.toBeInTheDocument();
  });
});

describe("EnrollmentPeriodPage — selo de status com três estados (Núcleo 10)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra INSCRIÇÃO ABERTA quando o ciclo está vivo com janela aberta", async () => {
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("INSCRIÇÃO ABERTA")).toBeInTheDocument();
    });
  });

  it("mostra CICLO ATIVO — SEM INSCRIÇÃO ABERTA quando o ciclo está vivo sem janela aberta", async () => {
    const noWindow = { ...activePeriodStub, startDate: null, endDate: null };
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(noWindow as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([noWindow] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(
        screen.getByText("CICLO ATIVO — SEM INSCRIÇÃO ABERTA"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/equipe pode continuar/i)).toBeInTheDocument();
  });

  it("mostra ENCERRADO na tabela de histórico quando não há ciclo vivo", async () => {
    const closedPeriod = {
      ...activePeriodStub,
      _id: "p0",
      active: false,
      startDate: null,
      endDate: null,
    };
    vi.mocked(enrollmentPeriodService.getActive).mockRejectedValue({ status: 404 });
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([closedPeriod] as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByText("ENCERRADO")).toBeInTheDocument();
    });
  });
});

describe("EnrollmentPeriodPage — confirmação reforçada de 'Encerrar período' (Núcleo 11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);
  });

  it("keeps the confirm button disabled until 'ENCERRAR' is typed, and only then calls close()", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Encerrar período" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Encerrar período" }));

    const confirmButton = await screen.findByRole("button", { name: "Encerrar" });
    expect(confirmButton).toBeDisabled();
    expect(enrollmentPeriodService.close).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCERRAR" },
    });
    await waitFor(() => expect(confirmButton).not.toBeDisabled());

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(enrollmentPeriodService.close).toHaveBeenCalledWith(activePeriodStub._id);
    });
  });

  it("shows the waitlist count and occupancy as part of the impact summary", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Encerrar período" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Encerrar período" }));

    await waitFor(() => {
      expect(
        screen.getByText(new RegExp(`${activePeriodStub.filledSlots} de ${activePeriodStub.totalSlots} vagas-dia`)),
      ).toBeInTheDocument();
    });
  });
});

describe("EnrollmentPeriodPage — confirmação reforçada em duas etapas de 'Antecipar encerramento' (Núcleo 11)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);
  });

  it("step 1 collects the days, step 2 requires the confirmation word before scheduling", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Antecipar encerramento" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Antecipar encerramento" }));
    fireEvent.change(await screen.findByLabelText(/quantos dias/i), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    const scheduleButton = await screen.findByRole("button", { name: "Agendar" });
    expect(scheduleButton).toBeDisabled();
    expect(enrollmentPeriodService.scheduleReset).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCERRAR" },
    });
    await waitFor(() => expect(scheduleButton).not.toBeDisabled());
    fireEvent.click(scheduleButton);

    await waitFor(() => {
      expect(enrollmentPeriodService.scheduleReset).toHaveBeenCalledWith(
        activePeriodStub._id,
        5,
      );
    });
  });
});
