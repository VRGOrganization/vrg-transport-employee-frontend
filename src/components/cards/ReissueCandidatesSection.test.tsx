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
    approveReissueBatch: vi.fn(),
  },
}));

const getActiveMock = vi.mocked(enrollmentPeriodService.getActive);
const listReissueCandidatesMock = vi.mocked(licenseRequestService.listReissueCandidates);
const approveReissueBatchMock = vi.mocked(licenseRequestService.approveReissueBatch);

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
    approveReissueBatchMock.mockResolvedValue({
      requestId: "req-1",
      licenseId: "license-1",
      approved: [],
      refused: [],
    });
  });

  it("agrupa candidatos por aluno e ordena por filaPosition", async () => {
    listReissueCandidatesMock.mockResolvedValue([
      makeCandidate({
        allocationId: "alloc-partial",
        licenseRequestId: "req-partial",
        studentId: "student-partial",
        studentName: "Parcial",
        filaPosition: 2,
        hasLicense: true,
      }),
      makeCandidate({
        allocationId: "alloc-total",
        licenseRequestId: "req-total",
        studentId: "student-total",
        studentName: "Total",
        day: "TER",
        filaPosition: 1,
        hasLicense: false,
      }),
      makeCandidate({
        allocationId: "alloc-total-2",
        licenseRequestId: "req-total",
        studentId: "student-total",
        studentName: "Total",
        day: "QUA",
        filaPosition: 1,
        hasLicense: false,
      }),
    ]);

    render(<ReissueCandidatesSection universityId="uni-1" />);

    const articles = await screen.findAllByRole("article");

    expect(articles).toHaveLength(2);
    expect(within(articles[0]).getByText("Total", { selector: "h3" })).toBeInTheDocument();
    expect(within(articles[0]).getByText("Total", { selector: "span" })).toBeInTheDocument();
    expect(within(articles[1]).getByText("Parcial", { selector: "h3" })).toBeInTheDocument();
    expect(within(articles[1]).getByText("Parcial", { selector: "span" })).toBeInTheDocument();
    expect(listReissueCandidatesMock).toHaveBeenCalledWith("period-1");
  });

  it("aprova reemissão em lote com apenas os dias selecionados", async () => {
    listReissueCandidatesMock.mockResolvedValue([
      makeCandidate({
        allocationId: "alloc-total",
        licenseRequestId: "req-total",
        day: "TER",
        period: "Tarde",
      }),
      makeCandidate({
        allocationId: "alloc-total-2",
        licenseRequestId: "req-total",
        day: "QUA",
        period: "Tarde",
      }),
    ]);

    render(<ReissueCandidatesSection universityId="uni-1" />);

    await userEvent.click(await screen.findByRole("button", { name: /ver dias/i }));
    await userEvent.click(screen.getByRole("checkbox", { name: /quarta · tarde/i }));
    await userEvent.click(screen.getByRole("button", { name: /aprovar reemissão/i }));

    expect(approveReissueBatchMock).toHaveBeenCalledWith("req-total", {
      targets: [
        {
          allocationId: "alloc-total",
          day: "TER",
          period: "Tarde",
        },
      ],
    });
    expect(licenseRequestService.approveReissue).not.toHaveBeenCalled();
  });

  it("exibe recusas por dia retornadas pelo batch e recarrega lista", async () => {
    listReissueCandidatesMock
      .mockResolvedValueOnce([
        makeCandidate({
          allocationId: "alloc-total",
          licenseRequestId: "req-total",
          studentName: "Total",
          day: "TER",
          period: "Tarde",
        }),
      ])
      .mockResolvedValueOnce([]);
    approveReissueBatchMock.mockResolvedValueOnce({
      requestId: "req-total",
      licenseId: "license-1",
      approved: [],
      refused: [
        {
          allocationId: "alloc-total",
          day: "TER",
          period: "Tarde",
          reason: "Vaga indisponível para o dia selecionado.",
        },
      ],
    });

    render(<ReissueCandidatesSection universityId="uni-1" />);

    await userEvent.click(await screen.findByRole("button", { name: /ver dias/i }));
    await userEvent.click(screen.getByRole("button", { name: /aprovar reemissão/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Terça · Tarde: Vaga indisponível para o dia selecionado.",
    );
    await waitFor(() => expect(listReissueCandidatesMock).toHaveBeenCalledTimes(2));
    expect(screen.getByText("Nenhum candidato com vaga liberada.")).toBeInTheDocument();
  });
});
