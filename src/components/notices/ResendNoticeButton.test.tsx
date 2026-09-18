import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResendNoticeButton } from "./ResendNoticeButton";
import { noticeService } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    resendNotice: vi.fn(),
  },
}));

const resendMock = vi.mocked(noticeService.resendNotice);

describe("ResendNoticeButton", () => {
  beforeEach(() => {
    resendMock.mockReset();
  });

  it("não chama resendNotice antes de confirmar no modal", async () => {
    render(<ResendNoticeButton noticeId="notice-1" />);

    await userEvent.click(screen.getByRole("button", { name: /reenviar notificação/i }));

    expect(screen.getByText(/reenviar notificação\?/i)).toBeInTheDocument();
    expect(screen.getByText(/já foi enviado automaticamente/i)).toBeInTheDocument();
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("chama resendNotice ao confirmar", async () => {
    resendMock.mockResolvedValueOnce(undefined);
    render(<ResendNoticeButton noticeId="notice-1" />);

    await userEvent.click(screen.getByRole("button", { name: /reenviar notificação/i }));
    await userEvent.click(screen.getByRole("button", { name: /^reenviar$/i }));

    await waitFor(() => expect(resendMock).toHaveBeenCalledWith("notice-1"));
  });

  it("mostra erro quando o reenvio falha", async () => {
    resendMock.mockRejectedValueOnce({ message: "Falha ao reenviar" });
    render(<ResendNoticeButton noticeId="notice-1" />);

    await userEvent.click(screen.getByRole("button", { name: /reenviar notificação/i }));
    await userEvent.click(screen.getByRole("button", { name: /^reenviar$/i }));

    await waitFor(() => expect(screen.getByText("Falha ao reenviar")).toBeInTheDocument());
  });
});
