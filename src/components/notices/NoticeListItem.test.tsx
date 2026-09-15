import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoticeListItem } from "./NoticeListItem";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    getPollResults: vi.fn(),
    exportPollResults: vi.fn(),
    deleteNotice: vi.fn(),
    togglePin: vi.fn(),
  },
}));

const getPollResultsMock = vi.mocked(noticeService.getPollResults);
const deleteMock = vi.mocked(noticeService.deleteNotice);
const togglePinMock = vi.mocked(noticeService.togglePin);

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
  publishAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  pinned: false,
  ...overrides,
});

describe("NoticeListItem", () => {
  beforeEach(() => {
    getPollResultsMock.mockReset();
    deleteMock.mockReset();
    togglePinMock.mockReset();
  });

  it("mostra título, badges de tipo e status, autor", () => {
    render(<NoticeListItem notice={makeNotice()} onDeleted={vi.fn()} onUpdated={vi.fn()} />);

    expect(screen.getByText("Aviso importante")).toBeInTheDocument();
    expect(screen.getByText("Mensagem")).toBeInTheDocument();
    expect(screen.getByText("Publicado")).toBeInTheDocument();
    expect(screen.getByText(/Admin/)).toBeInTheDocument();
  });

  it("não mostra botão 'Ver resultados' para type=message", () => {
    render(
      <NoticeListItem
        notice={makeNotice({ type: "message" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /ver resultados/i })).not.toBeInTheDocument();
  });

  it("mostra botão 'Ver resultados' para type=poll e abre PollResultsPanel", async () => {
    getPollResultsMock.mockResolvedValueOnce({ aggregate: [], nominal: null });
    render(
      <NoticeListItem
        notice={makeNotice({ type: "poll" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /ver resultados/i }));

    await waitFor(() => expect(getPollResultsMock).toHaveBeenCalledWith("notice-1"));
    expect(screen.getByText("Resultados da enquete")).toBeInTheDocument();
  });

  // O backend permite o soft-delete de um aviso já cancelado, então o botão
  // continua disponível nesse status (regressão de a755069).
  it("mantém botão de apagar quando status=cancelled", () => {
    render(
      <NoticeListItem
        notice={makeNotice({ status: "cancelled" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /apagar aviso/i })).toBeInTheDocument();
  });

  it("mostra botão de apagar mesmo para aviso de sistema (admin pode apagar mensagem automática)", () => {
    render(
      <NoticeListItem
        notice={makeNotice({ authorRole: "system", status: "published" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /apagar aviso/i })).toBeInTheDocument();
  });

  it("mostra botão de apagar quando status !== cancelled e ele chama onDeleted ao confirmar", async () => {
    deleteMock.mockResolvedValueOnce(undefined);
    const onDeleted = vi.fn();
    render(
      <NoticeListItem
        notice={makeNotice({ status: "published" })}
        onDeleted={onDeleted}
        onUpdated={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /apagar aviso/i }));
    await userEvent.click(screen.getByRole("button", { name: /^apagar$/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("notice-1"));
    expect(onDeleted).toHaveBeenCalledWith("notice-1");
  });

  it("mostra botão de fixar/desafixar só quando status=published", () => {
    const { rerender } = render(
      <NoticeListItem
        notice={makeNotice({ status: "published" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /fixar aviso/i })).toBeInTheDocument();

    rerender(
      <NoticeListItem
        notice={makeNotice({ status: "expired" })}
        onDeleted={vi.fn()}
        onUpdated={vi.fn()}
      />,
    );
    expect(screen.queryByRole("button", { name: /fixar aviso/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /desafixar aviso/i })).not.toBeInTheDocument();
  });

  it("chama togglePin e onUpdated ao clicar em fixar", async () => {
    const updatedNotice = makeNotice({ status: "published", pinned: true });
    togglePinMock.mockResolvedValueOnce(updatedNotice);
    const onUpdated = vi.fn();
    render(
      <NoticeListItem
        notice={makeNotice({ status: "published", pinned: false })}
        onDeleted={vi.fn()}
        onUpdated={onUpdated}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /fixar aviso/i }));

    await waitFor(() => expect(togglePinMock).toHaveBeenCalledWith("notice-1", true));
    expect(onUpdated).toHaveBeenCalledWith(updatedNotice);
  });
});
