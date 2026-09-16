import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Bus } from "@/types/university.types";

vi.mock("@/lib/universityApi", () => ({
  busApi: {
    listWithQueueCounts: vi.fn(),
    listInactive: vi.fn(),
  },
  universityApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/http", () => ({
  http: { get: vi.fn().mockResolvedValue([]) },
}));

import { busApi } from "@/lib/universityApi";
import { BusesPage } from "./BusesPage";

const bus = { _id: "b1", identifier: "01", capacity: 40, universitySlots: [] } as unknown as Bus;

describe("BusesPage", () => {
  beforeEach(() => {
    vi.mocked(busApi.listWithQueueCounts).mockResolvedValue([bus]);
  });

  it("admin pode editar e desativar ônibus", async () => {
    render(<BusesPage />);

    expect(await screen.findByTitle("Editar")).toBeInTheDocument();
    expect(screen.getByTitle("Desativar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /adicionar ônibus/i })).toBeInTheDocument();
  });
});
