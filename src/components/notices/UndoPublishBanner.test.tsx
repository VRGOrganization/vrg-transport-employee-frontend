import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UndoPublishBanner } from "./UndoPublishBanner";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    cancelScheduledNotice: vi.fn(),
    deleteNotice: vi.fn(),
  },
}));

const cancelMock = vi.mocked(noticeService.cancelScheduledNotice);
const deleteMock = vi.mocked(noticeService.deleteNotice);

const makeNotice = (publishAt: string): Notice => ({
  id: "notice-1",
  authorName: "Admin",
  authorRole: "admin",
  type: "message",
  title: "Aviso",
  body: "Corpo",
  pollOptions: null,
  allowMultiple: null,
  status: "scheduled",
  publishAt,
  expiresAt: new Date(Date.now() + 86400000).toISOString(),
  pinned: false,
});

describe("UndoPublishBanner", () => {
  beforeEach(() => {
    cancelMock.mockReset();
    deleteMock.mockReset();
  });

  it("não renderiza nada quando publishAt está no passado", () => {
    const notice = makeNotice(new Date(Date.now() - 5000).toISOString());
    const { container } = render(<UndoPublishBanner notice={notice} onUndo={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("clicar Desfazer chama cancelScheduledNotice direto, não deleteNotice", async () => {
    cancelMock.mockResolvedValueOnce(undefined);
    const notice = makeNotice(new Date(Date.now() + 25000).toISOString());
    const onUndo = vi.fn();
    render(<UndoPublishBanner notice={notice} onUndo={onUndo} />);

    // Ação de baixo risco (cancela um agendamento, não algo irreversível) —
    // um único clique chama a API direto, sem segundo modal de confirmação
    // dentro da janela curta de desfazer.
    await userEvent.click(screen.getByRole("button", { name: /desfazer/i }));

    await waitFor(() => expect(cancelMock).toHaveBeenCalledWith("notice-1"));
    expect(deleteMock).not.toHaveBeenCalled();
    expect(onUndo).toHaveBeenCalled();
  });

  it("chama onExpire quando publishAt já passou, pra quem escuta refazer o fetch", async () => {
    const onExpire = vi.fn();
    const notice = makeNotice(new Date(Date.now() - 5000).toISOString());
    render(<UndoPublishBanner notice={notice} onUndo={vi.fn()} onExpire={onExpire} />);

    await waitFor(() => expect(onExpire).toHaveBeenCalledTimes(1));
  });
});
