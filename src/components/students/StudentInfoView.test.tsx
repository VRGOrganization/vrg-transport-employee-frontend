import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getHistoryMock, transportUsageMock, imagesMock } = vi.hoisted(() => ({
  getHistoryMock: vi.fn(),
  transportUsageMock: vi.fn(),
  imagesMock: vi.fn(),
}));

vi.mock("@/services/banlistService", () => ({
  banlistService: { getHistory: getHistoryMock },
}));

vi.mock("@/services/transportUsageService", () => ({
  transportUsageService: { getByStudent: transportUsageMock },
}));

vi.mock("@/services/imageService", () => ({
  imageService: { getByStudent: imagesMock },
}));

import { StudentInfoView } from "./StudentInfoView";
import type { Student } from "@/types/student";
import type { BanHistoryEntry } from "@/types/banlist";

const student = {
  _id: "stu1",
  name: "Ana Beatriz Rocha",
  email: "ana@example.com",
  telephone: "22999999999",
  active: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
} as Student;

const historyEntry: BanHistoryEntry = {
  banId: "ban1",
  active: false,
  bannedAt: "2026-01-10T12:00:00.000Z",
  bannedByName: "Admin Um",
  bannedByAdminId: "admin1",
  reasons: ["Uso indevido"],
  unbannedAt: "2026-02-01T09:30:00.000Z",
  unbannedByName: "Admin Dois",
  unbannedByAdminId: "admin2",
  unbanReasons: ["Recurso aceito"],
  events: [
    {
      type: "ban",
      at: "2026-01-10T12:00:00.000Z",
      byName: "Admin Um",
      byId: "admin1",
      reasons: ["Uso indevido"],
    },
    {
      type: "unban",
      at: "2026-02-01T09:30:00.000Z",
      byName: "Admin Dois",
      byId: "admin2",
      reasons: ["Recurso aceito"],
    },
  ],
};

const banHistoryButton = () =>
  screen.queryByRole("button", { name: /Histórico de banimentos/i });

describe("StudentInfoView — botão de histórico de banimentos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    transportUsageMock.mockResolvedValue({ alreadyUsesTransport: false });
    imagesMock.mockResolvedValue([]);
  });

  it("não mostra o botão para aluno que nunca foi banido", async () => {
    getHistoryMock.mockResolvedValue([]);

    render(<StudentInfoView student={student} onClose={vi.fn()} />);

    await waitFor(() => expect(getHistoryMock).toHaveBeenCalledWith("stu1"));
    expect(banHistoryButton()).not.toBeInTheDocument();
  });

  it("mostra o botão para aluno que já foi banido", async () => {
    getHistoryMock.mockResolvedValue([historyEntry]);

    render(<StudentInfoView student={student} onClose={vi.fn()} />);

    await waitFor(() => expect(banHistoryButton()).toBeInTheDocument());
  });

  it("abre o modal com a linha do tempo ao clicar no botão", async () => {
    getHistoryMock.mockResolvedValue([historyEntry]);

    render(<StudentInfoView student={student} onClose={vi.fn()} />);
    const button = await waitFor(() => {
      const el = banHistoryButton();
      expect(el).toBeInTheDocument();
      return el!;
    });

    // fechado até o clique
    expect(screen.queryByText("Reativado")).not.toBeInTheDocument();

    fireEvent.click(button);

    expect(await screen.findByText("Banido")).toBeInTheDocument();
    expect(screen.getByText("Reativado")).toBeInTheDocument();
    expect(screen.getByText("Admin Um")).toBeInTheDocument();
    expect(screen.getByText("Recurso aceito")).toBeInTheDocument();
  });

  it("não mostra o botão quando a carga do histórico falha", async () => {
    getHistoryMock.mockRejectedValue(new Error("500"));

    render(<StudentInfoView student={student} onClose={vi.fn()} />);

    await waitFor(() => expect(getHistoryMock).toHaveBeenCalled());
    expect(banHistoryButton()).not.toBeInTheDocument();
  });
});
