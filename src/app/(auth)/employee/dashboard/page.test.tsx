import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, vi } from "vitest";

import EmployeeDashboardPage from "./page";
import { http } from "@/services/http";
import { licenseRequestService } from "@/services/licenseRequestService";
import { studentService } from "@/services/studentService";

vi.mock("@/services/studentService", () => ({
  studentService: {
    list: vi.fn(),
  },
}));

vi.mock("@/services/licenseRequestService", () => ({
  licenseRequestService: {
    getReviewCounts: vi.fn(),
  },
}));

vi.mock("@/services/http", () => ({
  http: {
    get: vi.fn(),
  },
}));

vi.mock("@/components/employee/StudentTable", () => ({
  StudentTable: () => <div data-testid="student-table" />,
}));

vi.mock("@/components/layout/Footer", () => ({
  Footer: () => <footer />,
}));

const listStudentsMock = vi.mocked(studentService.list);
const getReviewCountsMock = vi.mocked(licenseRequestService.getReviewCounts);
const httpGetMock = vi.mocked(http.get);

describe("EmployeeDashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listStudentsMock.mockResolvedValue([
      { _id: "student-1", active: true },
      { _id: "student-2", active: true },
    ] as never);
    httpGetMock.mockResolvedValue([{ _id: "license-1", studentId: "student-1" }] as never);
  });

  it("calls getReviewCounts and renders document resend and reissue counts", async () => {
    getReviewCountsMock.mockResolvedValue({
      enrollmentPeriodId: "period-1",
      documentResendCount: 4,
      reissueCount: 7,
    });

    render(<EmployeeDashboardPage />);

    await waitFor(() => {
      expect(getReviewCountsMock).toHaveBeenCalled();
    });
    expect(screen.getByText("Reenvio de documentos")).toBeInTheDocument();
    expect(screen.getByText("Reemissão por dia")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("renders zero explicitly for empty review counts", async () => {
    getReviewCountsMock.mockResolvedValue({
      enrollmentPeriodId: "period-1",
      documentResendCount: 0,
      reissueCount: 0,
    });

    render(<EmployeeDashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Reenvio de documentos")).toBeInTheDocument();
    });
    expect(screen.getAllByText("0")).toHaveLength(2);
  });
});
