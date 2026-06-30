import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

const { activePeriodStub } = vi.hoisted(() => ({
  activePeriodStub: {
    _id: "p1",
    startDate: "2030-01-01T00:00:00.000Z",
    endDate: "2030-12-31T23:59:59.999Z",
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
