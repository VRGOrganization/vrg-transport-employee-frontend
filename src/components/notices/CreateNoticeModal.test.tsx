import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateNoticeModal } from "./CreateNoticeModal";
import { noticeService } from "@/services/noticeService";
import type { Notice } from "@/services/noticeService";

vi.mock("@/services/noticeService", () => ({
  noticeService: {
    createNotice: vi.fn(),
  },
}));

const createNoticeMock = vi.mocked(noticeService.createNotice);

const makeNotice = (): Notice => ({
  id: "notice-1",
  authorName: "Admin",
  authorRole: "admin",
  type: "message",
  title: "Aviso",
  body: "Corpo",
  pollOptions: null,
  allowMultiple: null,
  status: "scheduled",
  publishAt: new Date().toISOString(),
  expiresAt: new Date().toISOString(),
});

describe("CreateNoticeModal", () => {
  beforeEach(() => {
    createNoticeMock.mockReset();
  });

  it("alterna para type=poll esconde o campo body e mostra a lista de opções", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Enquete" }));

    expect(screen.queryByLabelText("Mensagem")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Opção 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Opção 2")).toBeInTheDocument();
  });

  it("submeter enquete com só 1 opção preenchida gera erro client-side e não chama createNotice", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Enquete" }));
    await userEvent.type(screen.getByLabelText("Título"), "Qual seu curso?");
    await userEvent.type(screen.getByLabelText("Opção 1"), "Sim");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText(/pelo menos 2 opções/i)).toBeInTheDocument();
    expect(createNoticeMock).not.toHaveBeenCalled();
  });

  it("submeter com expiresInDays=31 gera erro client-side e não chama createNotice", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Título"), "Aviso importante");
    const expiresInput = screen.getByLabelText("Expira em (dias)");
    await userEvent.clear(expiresInput);
    await userEvent.type(expiresInput, "31");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText(/entre 1 e 30/i)).toBeInTheDocument();
    expect(createNoticeMock).not.toHaveBeenCalled();
  });

  it("clicar Enviar abre modal de confirmação antes de chamar createNotice", async () => {
    const notice = makeNotice();
    createNoticeMock.mockResolvedValueOnce(notice);
    const onCreated = vi.fn();
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={onCreated} />);

    await userEvent.type(screen.getByLabelText("Título"), "Aviso importante");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText(/publicar este aviso/i)).toBeInTheDocument();
    expect(createNoticeMock).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /sim, publicar/i }));

    await waitFor(() => expect(createNoticeMock).toHaveBeenCalledTimes(1));
    expect(onCreated).toHaveBeenCalledWith(notice);
  });
});
