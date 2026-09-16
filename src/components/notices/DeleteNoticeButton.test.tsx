import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteNoticeButton } from "./DeleteNoticeButton";
import { noticeService } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    deleteNotice: vi.fn(),
  },
}));

const deleteMock = vi.mocked(noticeService.deleteNotice);

describe("DeleteNoticeButton", () => {
  beforeEach(() => {
    deleteMock.mockReset();
  });

  it("não chama deleteNotice antes de confirmar no modal", async () => {
    render(<DeleteNoticeButton noticeId="notice-1" onDeleted={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: /apagar aviso/i }));

    expect(screen.getByText(/apagar este aviso/i)).toBeInTheDocument();
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("chama deleteNotice e onDeleted ao confirmar", async () => {
    deleteMock.mockResolvedValueOnce(undefined);
    const onDeleted = vi.fn();
    render(<DeleteNoticeButton noticeId="notice-1" onDeleted={onDeleted} />);

    await userEvent.click(screen.getByRole("button", { name: /apagar aviso/i }));
    await userEvent.click(screen.getByRole("button", { name: /^apagar$/i }));

    await waitFor(() => expect(deleteMock).toHaveBeenCalledWith("notice-1"));
    expect(onDeleted).toHaveBeenCalledWith("notice-1");
  });
});
