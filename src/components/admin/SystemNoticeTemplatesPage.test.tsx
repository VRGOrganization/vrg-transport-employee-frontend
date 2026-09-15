import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemNoticeTemplatesPage } from "./SystemNoticeTemplatesPage";
import { systemNoticeTemplateService } from "@/services/systemNoticeTemplateService";
import type { SystemNoticeTemplate } from "@/services/systemNoticeTemplateService";
import { sectorContactInfoService } from "@/services/sectorContactInfoService";

vi.mock("@/services/systemNoticeTemplateService", () => ({
  systemNoticeTemplateService: {
    list: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/services/sectorContactInfoService", () => ({
  sectorContactInfoService: {
    get: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const listMock = vi.mocked(systemNoticeTemplateService.list);
const updateMock = vi.mocked(systemNoticeTemplateService.update);
const getAddressMock = vi.mocked(sectorContactInfoService.get);
const updateAddressMock = vi.mocked(sectorContactInfoService.update);

const makeTemplates = (): SystemNoticeTemplate[] => [
  { key: "WINDOW_OPEN", title: "Inscrição aberta", body: "Corpo abertura", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "WINDOW_CLOSE_7", title: "Fecha em 7 dias", body: "Corpo 7", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "WINDOW_CLOSE_3", title: "Fecha em 3 dias", body: "Corpo 3", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "WINDOW_CLOSE_1", title: "Fecha amanhã", body: "Corpo 1", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "CYCLE_RESET_7", title: "Reset em 7 dias", body: "Corpo reset 7", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "CYCLE_RESET_3", title: "Reset em 3 dias", body: "Corpo reset 3", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
  { key: "CYCLE_RESET_1", title: "Reset amanhã", body: "Corpo reset 1", updatedAt: "2026-01-01T00:00:00.000Z", updatedByAdminId: null },
];

describe("SystemNoticeTemplatesPage", () => {
  beforeEach(() => {
    listMock.mockReset();
    updateMock.mockReset();
    getAddressMock.mockReset();
    updateAddressMock.mockReset();
    listMock.mockResolvedValue(makeTemplates());
    getAddressMock.mockResolvedValue({ address: "" });
  });

  it("lista os 7 templates agrupados por evento", async () => {
    render(<SystemNoticeTemplatesPage role="admin" />);

    await waitFor(() => expect(screen.getByLabelText("Título de WINDOW_OPEN")).toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Abertura de janela" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fechamento de janela" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Reset do ciclo" })).toBeInTheDocument();
    expect(screen.getByLabelText("Título de CYCLE_RESET_1")).toBeInTheDocument();
  });

  it("cada item mostra rótulo próprio distinguindo os templates do mesmo grupo", async () => {
    render(<SystemNoticeTemplatesPage role="admin" />);

    await waitFor(() => expect(screen.getByLabelText("Título de WINDOW_OPEN")).toBeInTheDocument());
    expect(screen.getByText("Fechamento de janela: 7 dias antes")).toBeInTheDocument();
    expect(screen.getByText("Fechamento de janela: 3 dias antes")).toBeInTheDocument();
    expect(screen.getByText("Fechamento de janela: 1 dia antes")).toBeInTheDocument();
    expect(screen.getByText("Reset do ciclo: 7 dias antes")).toBeInTheDocument();
  });

  it("mostra estado vazio explícito quando a API não retorna templates", async () => {
    listMock.mockReset();
    listMock.mockResolvedValue([]);
    render(<SystemNoticeTemplatesPage role="admin" />);

    await waitFor(() =>
      expect(screen.getByText("Nenhum template de sistema encontrado")).toBeInTheDocument(),
    );
    expect(screen.queryByLabelText("Título de WINDOW_OPEN")).not.toBeInTheDocument();
  });

  it("botão salvar fica desabilitado até o item ser alterado, e chama a API correta", async () => {
    const updated = { ...makeTemplates()[0], title: "Novo título" };
    updateMock.mockResolvedValueOnce(updated);
    render(<SystemNoticeTemplatesPage role="admin" />);

    await waitFor(() => expect(screen.getByLabelText("Título de WINDOW_OPEN")).toBeInTheDocument());

    const titleInput = screen.getByLabelText("Título de WINDOW_OPEN");
    const saveButtons = screen.getAllByRole("button", { name: /salvar/i });
    expect(saveButtons[0]).toBeDisabled();

    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Novo título");
    expect(saveButtons[0]).not.toBeDisabled();

    await userEvent.click(saveButtons[0]);

    await waitFor(() =>
      expect(updateMock).toHaveBeenCalledWith("WINDOW_OPEN", {
        title: "Novo título",
        body: "Corpo abertura",
      }),
    );
  });

  describe("Endereço do setor", () => {
    it("exibe o endereço já configurado", async () => {
      getAddressMock.mockResolvedValue({ address: "Rua das Flores, 123" });
      render(<SystemNoticeTemplatesPage role="admin" />);

      await waitFor(() =>
        expect(screen.getByLabelText("Endereço do setor")).toHaveValue(
          "Rua das Flores, 123",
        ),
      );
    });

    it("botão salvar do endereço fica desabilitado até o campo ser alterado, e chama a API correta", async () => {
      getAddressMock.mockResolvedValue({ address: "Rua Antiga, 1" });
      updateAddressMock.mockResolvedValueOnce({ address: "Rua Nova, 2" });
      render(<SystemNoticeTemplatesPage role="admin" />);

      const addressInput = await screen.findByLabelText("Endereço do setor");
      const saveButton = screen.getByRole("button", {
        name: /salvar endereço/i,
      });
      expect(saveButton).toBeDisabled();

      await userEvent.clear(addressInput);
      await userEvent.type(addressInput, "Rua Nova, 2");
      expect(saveButton).not.toBeDisabled();

      await userEvent.click(saveButton);

      await waitFor(() =>
        expect(updateAddressMock).toHaveBeenCalledWith("Rua Nova, 2"),
      );
    });
  });

  describe("funcionário", () => {
    it("edita e salva templates", async () => {
      updateMock.mockResolvedValue({ ...makeTemplates()[0], title: "Novo título" });
      render(<SystemNoticeTemplatesPage role="employee" />);

      const title = await screen.findByLabelText("Título de WINDOW_OPEN");
      expect(title).not.toBeDisabled();
      await userEvent.clear(title);
      await userEvent.type(title, "Novo título");

      const saveButtons = screen.getAllByRole("button", { name: /^salvar$/i });
      await userEvent.click(saveButtons[0]);

      await waitFor(() =>
        expect(updateMock).toHaveBeenCalledWith("WINDOW_OPEN", expect.objectContaining({ title: "Novo título" })),
      );
    });

    it("vê o endereço do setor sem poder alterar", async () => {
      getAddressMock.mockResolvedValue({ address: "Rua do Setor, 10" });
      render(<SystemNoticeTemplatesPage role="employee" />);

      const address = await screen.findByLabelText("Endereço do setor");
      await waitFor(() => expect(address).toHaveValue("Rua do Setor, 10"));
      expect(address).toBeDisabled();
      expect(screen.queryByRole("button", { name: /salvar endereço/i })).not.toBeInTheDocument();
    });
  });
});
