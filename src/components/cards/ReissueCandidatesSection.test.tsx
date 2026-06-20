import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReissueCandidatesSection } from "./ReissueCandidatesSection";
import { enrollmentPeriodService } from "@/services/enrollmentPeriodService";
import { licenseRequestService, type ReissueCandidate } from "@/services/licenseRequestService";

vi.mock("@/services/enrollmentPeriodService", () => ({
  enrollmentPeriodService: {
    getActive: vi.fn(),
  },
}));

vi.mock("@/services/licenseRequestService", () => ({
  licenseRequestService: {
    listReissueCandidates: vi.fn(),
    approveReissue: vi.fn(),
  },
}));

const getActiveMock = vi.mocked(enrollmentPeriodService.getActive);
const listReissueCandidatesMock = vi.mocked(licenseRequestService.listReissueCandidates);
const approveReissueMock = vi.mocked(licenseRequestService.approveReissue);

function makeCandidate(overrides: Partial<ReissueCandidate>): ReissueCandidate {
  return {
    allocationId: "alloc-1",
    licenseRequestId: "req-1",
    requestStatus: "waitlisted",
    studentId: "student-1",
    studentName: "Aluno",
    studentEmail: "aluno@test.dev",
    universityId: "uni-1",
    busId: "bus-1",
    busIdentifier: "BUS-1",
    day: "SEG",
    period: "Manhã",
    filaPosition: 1,
    hasLicense: false,
    capacity: 2,
    activeCount: 1,
    availableSlots: 1,
    ...overrides,
  };
}

describe("ReissueCandidatesSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getActiveMock.mockResolvedValue({ _id: "period-1" } as Awaited<ReturnType<typeof enrollmentPeriodService.getActive>>);
    approveReissueMock.mockResolvedValue({});
  });

  it("renderiza candidatos parcial e total ordenados por filaPosition", async () => {
    listReissueCandidatesMock.mockResolvedValue([
      makeCandidate({
        allocationId: "alloc-partial",
        licenseRequestId: "req-partial",
        studentName: "Parcial",
        filaPosition: 2,
        hasLicense: true,
      }),
      makeCandidate({
        allocationId: "alloc-total",
        licenseRequestId: "req-total",
        studentName: "Total",
        day: "TER",
        filaPosition: 1,
        hasLicense: false,
      }),
    ]);

    render(<ReissueCandidatesSection universityId="uni-1" />);

    const articles = await screen.findAllByRole("article");

    expect(within(articles[0]).getByText("Total", { selector: "h3" })).toBeInTheDocument();
    expect(within(articles[0]).getByText("Total", { selector: "span" })).toBeInTheDocument();
    expect(within(articles[1]).getByText("Parcial", { selector: "h3" })).toBeInTheDocument();
    expect(within(articles[1]).getByText("Parcial", { selector: "span" })).toBeInTheDocument();
    expect(listReissueCandidatesMock).toHaveBeenCalledWith("period-1");
  });

  it("aprova reemissão com request id, allocation id, dia e período", async () => {
    listReissueCandidatesMock.mockResolvedValue([
      makeCandidate({
        allocationId: "alloc-total",
        licenseRequestId: "req-total",
        day: "TER",
        period: "Tarde",
      }),
    ]);

    render(<ReissueCandidatesSection universityId="uni-1" />);

    await userEvent.click(await screen.findByRole("button", { name: /aprovar reemissão/i }));

    expect(approveReissueMock).toHaveBeenCalledWith("req-total", {
      allocationId: "alloc-total",
      day: "TER",
      period: "Tarde",
    });
  });

  it("exibe recusa do backend e recarrega lista quando a vaga sumiu", async () => {
    listReissueCandidatesMock
      .mockResolvedValueOnce([
        makeCandidate({
          allocationId: "alloc-total",
          licenseRequestId: "req-total",
          studentName: "Total",
        }),
      ])
      .mockResolvedValueOnce([]);
    approveReissueMock.mockRejectedValueOnce({ message: "Vaga não está mais disponível." });

    render(<ReissueCandidatesSection universityId="uni-1" />);

    await userEvent.click(await screen.findByRole("button", { name: /aprovar reemissão/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Vaga não está mais disponível.");
    await waitFor(() => expect(listReissueCandidatesMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Nenhum candidato com vaga liberada.")).toBeInTheDocument();
  });
});
