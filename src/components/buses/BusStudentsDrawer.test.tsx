import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Bus } from "@/types/university.types";

vi.mock("@/lib/universityApi", () => ({
  busApi: { releaseSlots: vi.fn() },
  universityApi: { list: vi.fn().mockResolvedValue([]) },
}));

vi.mock("@/services/http", () => ({
  http: { get: vi.fn().mockResolvedValue([]) },
}));

import { BusStudentsDrawer } from "./BusStudentsDrawer";

const bus = { _id: "b1", identifier: "01", capacity: 40, universitySlots: [] } as unknown as Bus;

describe("BusStudentsDrawer", () => {
  it("mostra liberar vagas quando permitido", async () => {
    render(<BusStudentsDrawer bus={bus} onClose={() => {}} canReleaseSlots />);

    expect(await screen.findByRole("button", { name: /liberar vagas/i })).toBeInTheDocument();
  });

  it("esconde liberar vagas para quem não pode", async () => {
    render(<BusStudentsDrawer bus={bus} onClose={() => {}} canReleaseSlots={false} />);

    expect(await screen.findByText("01")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /liberar vagas/i })).not.toBeInTheDocument();
  });
});
