import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PollResultsPanel } from "./PollResultsPanel";
import { noticeService } from "@/services/noticeService";
import type { PollResults } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    getPollResults: vi.fn(),
    exportPollResults: vi.fn(),
  },
}));

const getPollResultsMock = vi.mocked(noticeService.getPollResults);
const exportPollResultsMock = vi.mocked(noticeService.exportPollResults);

const AGGREGATE_ONLY: PollResults = {
  aggregate: [
    { optionId: "opt-1", label: "Sim", voteCount: 3 },
    { optionId: "opt-2", label: "Não", voteCount: 1 },
  ],
  nominal: null,
};

const WITH_NOMINAL: PollResults = {
  aggregate: [
    { optionId: "opt-1", label: "Sim", voteCount: 3 },
    { optionId: "opt-2", label: "Não", voteCount: 1 },
  ],
  nominal: [
    {
      studentName: "Maria",
      studentEmail: "maria@example.com",
      optionIds: ["opt-1"],
      votedAt: new Date().toISOString(),
    },
  ],
};

describe("PollResultsPanel", () => {
  beforeEach(() => {
    getPollResultsMock.mockReset();
    exportPollResultsMock.mockReset();
  });

  it("com status='published' não renderiza lista nominal nem botão de export, mesmo que a API traga nominal preenchido", async () => {
    getPollResultsMock.mockResolvedValueOnce(WITH_NOMINAL);

    render(<PollResultsPanel noticeId="notice-1" status="published" />);

    await waitFor(() => expect(screen.getByText("Sim")).toBeInTheDocument());

    expect(screen.getByText(/disponível após o encerramento/i)).toBeInTheDocument();
    expect(screen.queryByText("Maria")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /exportar csv/i })).not.toBeInTheDocument();
  });

  it("com status='expired' renderiza a lista nominal e o botão de export", async () => {
    getPollResultsMock.mockResolvedValueOnce(WITH_NOMINAL);

    render(<PollResultsPanel noticeId="notice-1" status="expired" />);

    await waitFor(() => expect(screen.getByText("Maria")).toBeInTheDocument());

    expect(screen.getByText("maria@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /exportar csv/i })).toBeInTheDocument();
  });

  it("aggregate sempre aparece independente do status", async () => {
    getPollResultsMock.mockResolvedValueOnce(AGGREGATE_ONLY);

    render(<PollResultsPanel noticeId="notice-1" status="published" />);

    await waitFor(() => expect(screen.getByText("Sim")).toBeInTheDocument());
    expect(screen.getByText(/3 \(75%\)/)).toBeInTheDocument();
    expect(screen.getByText(/1 \(25%\)/)).toBeInTheDocument();
  });
});
