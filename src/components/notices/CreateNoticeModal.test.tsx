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
  pinned: false,
});

describe("CreateNoticeModal", () => {
  beforeEach(() => {
    createNoticeMock.mockReset();
  });

  it("alterna para type=poll esconde o campo body e mostra a lista de opções", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Enquete" }));

    expect(screen.queryByLabelText("Mensagem")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Opção 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Opção 2")).toBeInTheDocument();
  });

  it("submeter enquete com só 1 opção preenchida gera erro client-side e não chama createNotice", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Enquete" }));
    await userEvent.type(screen.getByLabelText("Título"), "Qual seu curso?");
    await userEvent.type(screen.getByLabelText("Opção 1"), "Sim");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(screen.getByText(/pelo menos 2 opções/i)).toBeInTheDocument();
    expect(createNoticeMock).not.toHaveBeenCalled();
  });

  it("prazo de expiração é escolhido entre opções fixas (1, 3, 7, 15, 30 dias), padrão 7", async () => {
    const notice = makeNotice();
    createNoticeMock.mockResolvedValueOnce(notice);
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    expect(screen.getByRole("button", { name: "7 dias" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await userEvent.click(screen.getByRole("button", { name: "15 dias" }));
    await userEvent.type(screen.getByLabelText("Título"), "Aviso importante");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await userEvent.click(screen.getByRole("button", { name: /sim, publicar/i }));

    await waitFor(() =>
      expect(createNoticeMock).toHaveBeenCalledWith(
        expect.objectContaining({ expiresInDays: 15 }),
      ),
    );
  });

  it("switch 'Permitir múltiplas escolhas' é acessível e alterna allowMultiple", async () => {
    const notice = makeNotice();
    createNoticeMock.mockResolvedValueOnce(notice);
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Enquete" }));

    const toggle = screen.getByRole("switch", { name: /permitir múltiplas escolhas/i });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");

    await userEvent.type(screen.getByLabelText("Título"), "Qual seu curso?");
    await userEvent.type(screen.getByLabelText("Opção 1"), "Sim");
    await userEvent.type(screen.getByLabelText("Opção 2"), "Não");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await userEvent.click(screen.getByRole("button", { name: /sim, publicar/i }));

    await waitFor(() =>
      expect(createNoticeMock).toHaveBeenCalledWith(
        expect.objectContaining({ allowMultiple: true }),
      ),
    );
  });

  it("checkbox 'Fixar no painel do aluno' está presente para mensagem e enquete, e vai no payload", async () => {
    const notice = makeNotice();
    createNoticeMock.mockResolvedValueOnce(notice);
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    const pinnedToggle = screen.getByRole("switch", { name: /fixar no painel do aluno/i });
    expect(pinnedToggle).toHaveAttribute("aria-checked", "false");

    await userEvent.click(pinnedToggle);
    expect(pinnedToggle).toHaveAttribute("aria-checked", "true");

    await userEvent.type(screen.getByLabelText("Título"), "Aviso importante");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));
    await userEvent.click(screen.getByRole("button", { name: /sim, publicar/i }));

    await waitFor(() =>
      expect(createNoticeMock).toHaveBeenCalledWith(
        expect.objectContaining({ pinned: true }),
      ),
    );
  });

  it("checkbox 'Fixar' também aparece no formulário de enquete", async () => {
    render(<CreateNoticeModal open onClose={vi.fn()} onCreated={vi.fn()} />);

    await userEvent.click(screen.getByRole("radio", { name: "Enquete" }));

    expect(screen.getByRole("switch", { name: /fixar no painel do aluno/i })).toBeInTheDocument();
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
