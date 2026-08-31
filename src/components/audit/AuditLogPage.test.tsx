import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMock, participantsMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  participantsMock: vi.fn(),
}));

vi.mock("@/services/auditService", () => ({
  auditService: {
    list: listMock,
    participants: participantsMock,
  },
}));

import { AuditLogPage } from "./AuditLogPage";

describe("AuditLogPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMock.mockResolvedValue({ data: [], total: 0, page: 1, limit: 20 });
    participantsMock.mockResolvedValue([]);
  });

  it("loads events and participants on mount, without a student filter", async () => {
    render(<AuditLogPage />);

    await waitFor(() => expect(listMock).toHaveBeenCalled());
    expect(participantsMock).toHaveBeenCalledWith();

    // Só "Pessoa" existe — não há mais combobox "Aluno".
    expect(screen.getByText("Pessoa")).toBeInTheDocument();
    expect(screen.queryByText("Aluno")).not.toBeInTheDocument();
  });

  it("does not list 'Estudante' as a filterable action category", async () => {
    render(<AuditLogPage />);

    await waitFor(() => expect(listMock).toHaveBeenCalled());

    expect(screen.queryByText("Estudante")).not.toBeInTheDocument();
  });

  it("never sends targetId in the list filters", async () => {
    render(<AuditLogPage />);

    await waitFor(() => expect(listMock).toHaveBeenCalled());
    const filters = listMock.mock.calls[0][0];
    expect(filters).not.toHaveProperty("targetId");
  });

  it("shows an empty state when there are no events", async () => {
    render(<AuditLogPage />);

    await waitFor(() =>
      expect(screen.getByText("Nenhum registro encontrado")).toBeInTheDocument(),
    );
  });

  it("shows an error state when loading fails", async () => {
    listMock.mockRejectedValue(new Error("network down"));

    render(<AuditLogPage />);

    await waitFor(() =>
      expect(
        screen.getByText("Não foi possível carregar os registros de auditoria."),
      ).toBeInTheDocument(),
    );
  });
});
