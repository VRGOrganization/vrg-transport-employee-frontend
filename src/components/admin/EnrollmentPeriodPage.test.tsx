import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { activePeriodStub } = vi.hoisted(() => ({
  activePeriodStub: {
    _id: "p1",
    startDate: "2030-06-01T00:00:00.000Z",
    endDate: "2030-06-15T23:59:59.999Z",
    // Distinta de startDate/endDate de propósito — simula uma repescagem
    // aberta meses depois do início real do ciclo.
    cycleStartDate: "2030-01-01T00:00:00.000Z",
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
    scheduleReset: vi.fn(),
    openWindow: vi.fn(),
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

describe("EnrollmentPeriodPage — botão de repescagem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue(activePeriodStub as never);
    vi.mocked(enrollmentPeriodService.list).mockResolvedValue([activePeriodStub] as never);
  });

  it("hides 'Abrir repescagem' when a window is already open (startDate present)", async () => {
    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /editar/i })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /abrir repescagem/i })).not.toBeInTheDocument();
  });

  it("shows 'Abrir repescagem' when the cycle is alive but no window is open (startDate null)", async () => {
    vi.mocked(enrollmentPeriodService.getActive).mockResolvedValue({
      ...activePeriodStub,
      startDate: null,
      endDate: null,
    } as never);

    render(<EnrollmentPeriodPage role="admin" />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /abrir repescagem/i })).toBeInTheDocument();
    });
  });
});
