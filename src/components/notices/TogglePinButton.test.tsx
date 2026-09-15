import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TogglePinButton } from "./TogglePinButton";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    togglePin: vi.fn(),
  },
}));

const togglePinMock = vi.mocked(noticeService.togglePin);

const makeNotice = (overrides: Partial<Notice> = {}): Notice => ({
  id: "notice-1",
  authorName: "Admin",
  authorRole: "admin",
  type: "message",
  title: "Aviso",
  body: "Corpo",
  pollOptions: null,
  allowMultiple: null,
  status: "published",
  publishAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
  pinned: true,
  ...overrides,
});

describe("TogglePinButton", () => {
  beforeEach(() => {
    togglePinMock.mockReset();
  });

  it("mostra 'Fixar aviso' quando pinned=false e chama togglePin(id, true)", async () => {
    const updated = makeNotice({ pinned: true });
    togglePinMock.mockResolvedValueOnce(updated);
    const onToggled = vi.fn();
    render(<TogglePinButton noticeId="notice-1" pinned={false} onToggled={onToggled} />);

    const button = screen.getByRole("button", { name: /fixar aviso/i });
    await userEvent.click(button);

    await waitFor(() => expect(togglePinMock).toHaveBeenCalledWith("notice-1", true));
    expect(onToggled).toHaveBeenCalledWith(updated);
  });

  it("mostra 'Desafixar aviso' quando pinned=true e chama togglePin(id, false)", async () => {
    const updated = makeNotice({ pinned: false });
    togglePinMock.mockResolvedValueOnce(updated);
    const onToggled = vi.fn();
    render(<TogglePinButton noticeId="notice-1" pinned={true} onToggled={onToggled} />);

    const button = screen.getByRole("button", { name: /desafixar aviso/i });
    await userEvent.click(button);

    await waitFor(() => expect(togglePinMock).toHaveBeenCalledWith("notice-1", false));
    expect(onToggled).toHaveBeenCalledWith(updated);
  });
});
