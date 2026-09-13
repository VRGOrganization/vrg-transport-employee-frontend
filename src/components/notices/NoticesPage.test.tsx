import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoticesPage } from "./NoticesPage";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    listNotices: vi.fn(),
    createNotice: vi.fn(),
    cancelScheduledNotice: vi.fn(),
    deleteNotice: vi.fn(),
    getPollResults: vi.fn(),
    exportPollResults: vi.fn(),
  },
}));

const listNoticesMock = vi.mocked(noticeService.listNotices);

const makeNotice = (overrides: Partial<Notice> = {}): Notice => ({
  id: "notice-1",
  authorName: "Admin",
  authorRole: "admin",
  type: "message",
  title: "Aviso importante",
  body: "Corpo",
  pollOptions: null,
  allowMultiple: null,
  status: "published",
  publishAt: "2026-01-01T00:00:25.000Z",
  expiresAt: "2026-01-06T00:00:25.000Z",
  pinned: false,
  ...overrides,
});

describe("NoticesPage", () => {
  beforeEach(() => {
    listNoticesMock.mockReset();
    listNoticesMock.mockResolvedValue([makeNotice()]);
  });

  it("renderiza para admin com botão de criação e lista", async () => {
    render(<NoticesPage role="admin" />);

    expect(screen.getByRole("button", { name: /adicionar aviso/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Aviso importante")).toBeInTheDocument());
    expect(listNoticesMock).toHaveBeenCalledWith();
  });

  it("renderiza para employee com o mesmo comportamento", async () => {
    render(<NoticesPage role="employee" />);

    expect(screen.getByRole("button", { name: /adicionar aviso/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Aviso importante")).toBeInTheDocument());
    expect(listNoticesMock).toHaveBeenCalledWith();
  });

  it("aba 'Sistema'/'funcionários' filtra a mesma lista client-side por authorRole", async () => {
    listNoticesMock.mockResolvedValue([
      makeNotice({ id: "n1", authorRole: "admin", title: "Aviso do admin" }),
      makeNotice({ id: "n2", authorRole: "employee", title: "Aviso do funcionário" }),
      makeNotice({ id: "n3", authorRole: "system", title: "Aviso automático" }),
    ]);

    render(<NoticesPage role="admin" />);

    await waitFor(() => expect(screen.getByText("Aviso do admin")).toBeInTheDocument());
    expect(screen.getByText("Aviso do funcionário")).toBeInTheDocument();
    expect(screen.queryByText("Aviso automático")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sistema/i }));

    expect(screen.getByText("Aviso automático")).toBeInTheDocument();
    expect(screen.queryByText("Aviso do admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Aviso do funcionário")).not.toBeInTheDocument();
    expect(listNoticesMock).toHaveBeenCalledTimes(1);
  });
});
