import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QUEUE_VIEW_STORAGE_KEY, useQueueViewMode } from "./useQueueViewMode";

// O jsdom deste projeto não expõe localStorage; mesmo mock de useEmployeeAuth.test.
function installLocalStorageMock(): Storage {
  const data = new Map<string, string>();
  const storage = {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    removeItem: vi.fn((key: string) => void data.delete(key)),
    clear: vi.fn(() => data.clear()),
    key: vi.fn(() => null),
    get length() {
      return data.size;
    },
  } as Storage;
  Object.defineProperty(window, "localStorage", { configurable: true, value: storage });
  return storage;
}

describe("useQueueViewMode", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = installLocalStorageMock();
  });

  it("começa na visão por ônibus quando não há preferência salva", () => {
    const { result } = renderHook(() => useQueueViewMode());

    expect(result.current[0]).toBe("bus");
  });

  it("restaura a visão por faculdade salva neste navegador", async () => {
    window.localStorage.setItem(QUEUE_VIEW_STORAGE_KEY, "university");

    const { result } = renderHook(() => useQueueViewMode());

    await waitFor(() => expect(result.current[0]).toBe("university"));
  });

  it("ignora valor salvo desconhecido", async () => {
    window.localStorage.setItem(QUEUE_VIEW_STORAGE_KEY, "curso");

    const { result } = renderHook(() => useQueueViewMode());

    await waitFor(() => expect(result.current[0]).toBe("bus"));
  });

  it("grava a troca de visão", () => {
    const { result } = renderHook(() => useQueueViewMode());

    act(() => result.current[1]("university"));

    expect(result.current[0]).toBe("university");
    expect(window.localStorage.getItem(QUEUE_VIEW_STORAGE_KEY)).toBe("university");
  });

  it("continua funcionando quando o navegador bloqueia o armazenamento", () => {
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.mocked(storage.setItem).mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = renderHook(() => useQueueViewMode());
    act(() => result.current[1]("university"));

    expect(result.current[0]).toBe("university");
  });
});
