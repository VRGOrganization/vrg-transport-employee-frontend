import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStudentSelection } from "./useStudentSelection";
import type { StudentRecord } from "@/types/cards.types";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@/services/http", () => ({
  http: {
    get: getMock,
  },
}));

const student: StudentRecord = {
  _id: "student-1",
  name: "Aluno 1",
  email: "a@a.com",
  active: true,
};

describe("useStudentSelection — declaração de uso do sistema antigo", () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it("expõe alreadyUsesTransport=true quando o backend confirma a declaração", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === `/transport-usage/student/${student._id}`) {
        return Promise.resolve({ studentId: student._id, alreadyUsesTransport: true });
      }
      if (path === `/image/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license-request/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license/searchByStudent/${student._id}`) return Promise.reject(new Error("not found"));
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useStudentSelection([], []));

    await act(async () => {
      await result.current.selectStudent(student);
    });

    await waitFor(() => expect(result.current.loadingSelected).toBe(false));
    expect(result.current.alreadyUsesTransport).toBe(true);
  });

  it("expõe alreadyUsesTransport=false quando o backend não tem declaração para o aluno", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === `/transport-usage/student/${student._id}`) {
        return Promise.resolve({ studentId: student._id, alreadyUsesTransport: false });
      }
      if (path === `/image/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license-request/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license/searchByStudent/${student._id}`) return Promise.reject(new Error("not found"));
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useStudentSelection([], []));

    await act(async () => {
      await result.current.selectStudent(student);
    });

    await waitFor(() => expect(result.current.loadingSelected).toBe(false));
    expect(result.current.alreadyUsesTransport).toBe(false);
  });

  it("expõe alreadyUsesTransport=false quando a chamada falha", async () => {
    getMock.mockImplementation((path: string) => {
      if (path === `/transport-usage/student/${student._id}`) {
        return Promise.reject(new Error("network error"));
      }
      if (path === `/image/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license-request/student/${student._id}`) return Promise.resolve([]);
      if (path === `/license/searchByStudent/${student._id}`) return Promise.reject(new Error("not found"));
      return Promise.resolve([]);
    });

    const { result } = renderHook(() => useStudentSelection([], []));

    await act(async () => {
      await result.current.selectStudent(student);
    });

    await waitFor(() => expect(result.current.loadingSelected).toBe(false));
    expect(result.current.alreadyUsesTransport).toBe(false);
  });
});
