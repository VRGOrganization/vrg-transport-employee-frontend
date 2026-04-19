import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCardsData } from "./useCardsData";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/lib/employeeApi", () => ({
  employeeApi: {
    get: getMock,
  },
}));

describe("useCardsData", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("filtra pedidos pelo busId quando um ônibus é selecionado", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/student") {
        return Promise.resolve([
          { _id: "student-1", name: "Aluno 1", email: "a@a.com", active: true },
          { _id: "student-2", name: "Aluno 2", email: "b@b.com", active: true },
        ]);
      }

      if (path === "/license/all") {
        return Promise.resolve([
          { _id: "license-1", studentId: "student-1", imageLicense: "img", status: "active" },
        ]);
      }

      if (path === "/license-request/all") {
        return Promise.resolve([
          {
            _id: "request-1",
            studentId: "student-1",
            type: "initial",
            changedDocuments: [],
            status: "pending",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: null,
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            busId: "bus-1",
            createdAt: "2026-04-19T10:00:00.000Z",
          },
          {
            _id: "request-2",
            studentId: "student-2",
            type: "initial",
            changedDocuments: [],
            status: "pending",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: null,
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            busId: "bus-2",
            createdAt: "2026-04-19T10:01:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useCardsData("bus-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getMock).toHaveBeenCalledWith("/student");
    expect(getMock).toHaveBeenCalledWith("/license/all");
    expect(getMock).toHaveBeenCalledWith("/license-request/all");
    expect(result.current.students).toHaveLength(1);
    expect(result.current.students[0]._id).toBe("student-1");
    expect(result.current.pendingStudentIds.has("student-1")).toBe(true);
    expect(result.current.pendingStudentIds.has("student-2")).toBe(false);
    expect(result.current.stats.pending).toBe(1);
    expect(result.current.stats.total).toBe(1);
  });
});
