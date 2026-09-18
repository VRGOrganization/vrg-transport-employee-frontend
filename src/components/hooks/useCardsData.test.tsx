import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCardsData } from "./useCardsData";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/services/http", () => ({
  http: {
    get: getMock,
  },
}));

describe("useCardsData", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("filtra pedidos pela universidade selecionada", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/student/all") {
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

      if (path === "/license-request?limit=1000") {
        return Promise.resolve([
          {
            _id: "request-1",
            studentId: "student-1",
            universityId: "uni-1",
            type: "initial",
            changedDocuments: [],
            status: "pending",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: null,
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            accessBusIdentifiers: [],
            createdAt: "2026-04-19T10:00:00.000Z",
          },
          {
            _id: "request-1-approved",
            studentId: "student-1",
            universityId: { _id: "uni-1" },
            type: "initial",
            changedDocuments: [],
            status: "approved",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: "license-1",
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            accessBusIdentifiers: ["BUS-1", "BUS-2"],
            createdAt: "2026-04-19T10:02:00.000Z",
          },
          {
            _id: "request-2",
            studentId: "student-2",
            universityId: "uni-2",
            type: "initial",
            changedDocuments: [],
            status: "pending",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: null,
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            accessBusIdentifiers: [],
            createdAt: "2026-04-19T10:01:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useCardsData({ kind: "university", universityId: "uni-1" }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getMock).toHaveBeenCalledWith("/student/all");
    expect(getMock).toHaveBeenCalledWith("/license/all");
    expect(getMock).toHaveBeenCalledWith("/license-request?limit=1000");
    expect(result.current.students).toHaveLength(1);
    expect(result.current.students[0]._id).toBe("student-1");
    expect(result.current.pendingStudentIds.has("student-1")).toBe(true);
    expect(result.current.pendingStudentIds.has("student-2")).toBe(false);
    expect(result.current.stats.pending).toBe(1);
    expect(result.current.stats.total).toBe(1);
  });

  it("nao mostra aprovacao de outra universidade", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === "/student/all") {
        return Promise.resolve([
          { _id: "student-1", name: "Aluno 1", email: "a@a.com", active: true },
        ]);
      }

      if (path === "/license/all") {
        return Promise.resolve([]);
      }

      if (path === "/license-request?limit=1000") {
        return Promise.resolve([
          {
            _id: "request-approved",
            studentId: "student-1",
            universityId: "uni-2",
            type: "initial",
            changedDocuments: [],
            status: "approved",
            rejectionReason: null,
            rejectedAt: null,
            licenseId: "license-1",
            enrollmentPeriodId: "period-1",
            filaPosition: null,
            accessBusIdentifiers: ["BUS-1", "BUS-2"],
            createdAt: "2026-04-19T10:03:00.000Z",
          },
        ]);
      }

      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useCardsData({ kind: "university", universityId: "uni-1" }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.students).toHaveLength(0);
    expect(result.current.licenseRequests).toHaveLength(0);
  });
  it("na visão por ônibus, mostra só pedidos com algum dia naquele ônibus", async () => {
    const base = {
      type: "initial",
      changedDocuments: [],
      status: "pending",
      rejectionReason: null,
      rejectedAt: null,
      licenseId: null,
      enrollmentPeriodId: "period-1",
      filaPosition: null,
      accessBusIdentifiers: [],
      createdAt: "2026-04-19T10:00:00.000Z",
    };
    const allocation = (day: string, busId: string | null) => ({
      day,
      period: "Manhã",
      busIdentifier: "01",
      busId,
      status: "active",
    });

    getMock.mockImplementation((path: string) => {
      if (path === "/student/all") {
        return Promise.resolve(
          ["s1", "s2", "s3", "s4"].map((id) => ({ _id: id, name: id, email: `${id}@a.com`, active: true })),
        );
      }
      if (path === "/license-request?limit=1000") {
        return Promise.resolve([
          // ida e volta em ônibus diferentes: aparece nos dois
          { ...base, _id: "r1", studentId: "s1", universityId: "uni-1", allocationSummary: [allocation("SEG", "bus-A"), allocation("TER", "bus-B")] },
          { ...base, _id: "r2", studentId: "s2", universityId: "uni-2", allocationSummary: [allocation("SEG", "bus-B")] },
          // sem resumo de alocações: usa o busId do pedido
          { ...base, _id: "r3", studentId: "s3", universityId: "uni-1", busId: { _id: "bus-A" }, allocationSummary: [] },
          { ...base, _id: "r4", studentId: "s4", universityId: "uni-1", allocationSummary: [allocation("QUA", null)] },
        ]);
      }
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useCardsData({ kind: "bus", busId: "bus-A" }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.licenseRequests.map((r) => r._id).sort()).toEqual(["r1", "r3"]);
    expect(result.current.students.map((s) => s._id).sort()).toEqual(["s1", "s3"]);
    expect(result.current.stats.pending).toBe(2);
  });

  it("não recarrega sem parar quando o escopo é recriado a cada render", async () => {
    getMock.mockResolvedValue([]);

    const { result, rerender } = renderHook(() => useCardsData({ kind: "bus", busId: "bus-A" }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    const calls = getMock.mock.calls.length;

    rerender();
    rerender();

    expect(getMock.mock.calls.length).toBe(calls);
  });
});
