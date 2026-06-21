import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UniversitySelectorPanel from "./UniversitySelectorPanel";
import { universityService } from "@/services/universityService";

vi.mock("@/services/universityService", () => ({
  universityService: {
    listWithQueueCounts: vi.fn(),
  },
}));

const listWithQueueCountsMock = vi.mocked(universityService.listWithQueueCounts);

describe("UniversitySelectorPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o badge de pendentes incluindo zero", async () => {
    listWithQueueCountsMock.mockResolvedValue([
      {
        _id: "uni-1",
        name: "Universidade A",
        acronym: "UA",
        address: "Rua A",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        pendingCount: 4,
        waitlistedCount: 1,
      },
      {
        _id: "uni-2",
        name: "Universidade B",
        acronym: "UB",
        address: "Rua B",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        pendingCount: 0,
        waitlistedCount: 0,
      },
    ]);

    render(<UniversitySelectorPanel />);

    expect(await screen.findByText("4 pendentes")).toBeInTheDocument();
    expect(screen.getByText("0 pendentes")).toBeInTheDocument();
    expect(listWithQueueCountsMock).toHaveBeenCalled();
  });

  it("mantem a selecao de universidade funcionando", async () => {
    const onChange = vi.fn();
    listWithQueueCountsMock.mockResolvedValue([
      {
        _id: "uni-1",
        name: "Universidade A",
        acronym: "UA",
        address: "Rua A",
        active: true,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
        pendingCount: 0,
        waitlistedCount: 0,
      },
    ]);

    render(<UniversitySelectorPanel onChange={onChange} />);

    await userEvent.click(await screen.findByRole("button", { name: /UA/i }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith("uni-1");
    });
  });
});
