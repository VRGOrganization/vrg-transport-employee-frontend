import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RejectModal } from "./RejectModal";
import type { LicenseRequestRecord } from "@/types/cards.types";

const mocks = vi.hoisted(() => ({
  getMock: vi.fn(),
  patchMock: vi.fn(),
}));

vi.mock("@/lib/employeeApi", () => ({
  employeeApi: {
    get: (...args: unknown[]) => mocks.getMock(...args),
    patch: (...args: unknown[]) => mocks.patchMock(...args),
  },
}));

const makeRequest = (): LicenseRequestRecord => ({
  _id: "req-1",
  studentId: "student-1",
  type: "initial",
  changedDocuments: [],
  status: "pending",
  rejectionReason: null,
  rejectedAt: null,
  licenseId: null,
  createdAt: new Date().toISOString(),
});

const REASONS_FROM_API = [
  { id: "photo_inadequate", label: "Foto inadequada ou ilegível" },
  { id: "invalid_enrollment_proof", label: "Comprovante de matrícula inválido" },
  { id: "missing_personal_documents", label: "Documentos pessoais faltando" },
];

describe("RejectModal", () => {
  const onCloseMock = vi.fn();
  const onSuccessMock = vi.fn();
  const onReloadMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getMock.mockResolvedValue(REASONS_FROM_API);
    mocks.patchMock.mockResolvedValue({});
    onReloadMock.mockResolvedValue(undefined);
  });

  it("busca motivos de recusa da API ao montar", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(mocks.getMock).toHaveBeenCalledWith("/license-request/rejection-reasons"),
    );
  });

  it("renderiza os motivos buscados como checkboxes", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    expect(screen.getByLabelText(/comprovante de matrícula inválido/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/documentos pessoais faltando/i)).toBeInTheDocument();
  });

  it("permite selecionar múltiplos motivos", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/foto inadequada/i));
    fireEvent.click(screen.getByLabelText(/documentos pessoais faltando/i));

    expect(screen.getByLabelText(/foto inadequada/i)).toBeChecked();
    expect(screen.getByLabelText(/documentos pessoais faltando/i)).toBeChecked();
  });

  it("botão de confirmar recusa está desabilitado sem motivo selecionado", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    expect(
      screen.getByRole("button", { name: /confirmar recusa/i }),
    ).toBeDisabled();
  });

  it("botão fica habilitado após selecionar pelo menos um motivo", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/foto inadequada/i));

    expect(
      screen.getByRole("button", { name: /confirmar recusa/i }),
    ).toBeEnabled();
  });

  it("exibe campo de mensagem customizada", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    expect(
      screen.getByPlaceholderText(/observação adicional/i),
    ).toBeInTheDocument();
  });

  it("envia reasons[] e customRejectionMessage ao confirmar", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/foto inadequada/i));
    fireEvent.click(screen.getByLabelText(/documentos pessoais faltando/i));

    const messageInput = screen.getByPlaceholderText(/observação adicional/i);
    fireEvent.change(messageInput, { target: { value: "Foto borrada" } });

    fireEvent.click(screen.getByRole("button", { name: /confirmar recusa/i }));

    await waitFor(() =>
      expect(mocks.patchMock).toHaveBeenCalledWith(
        "/license-request/reject/req-1",
        expect.objectContaining({
          reasons: expect.arrayContaining(["photo_inadequate", "missing_personal_documents"]),
          customRejectionMessage: "Foto borrada",
        }),
      ),
    );
  });

  it("chama onSuccess e fecha modal após recusa bem-sucedida", async () => {
    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/foto inadequada/i));
    fireEvent.click(screen.getByRole("button", { name: /confirmar recusa/i }));

    await waitFor(() => expect(onSuccessMock).toHaveBeenCalled());
    expect(onCloseMock).toHaveBeenCalled();
  });

  it("exibe erro quando API falha", async () => {
    mocks.patchMock.mockRejectedValueOnce({ message: "Erro interno do servidor" });

    render(
      <RejectModal
        currentLicenseRequest={makeRequest()}
        onClose={onCloseMock}
        onSuccess={onSuccessMock}
        onReload={onReloadMock}
      />,
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/foto inadequada/i)).toBeInTheDocument(),
    );

    fireEvent.click(screen.getByLabelText(/foto inadequada/i));
    fireEvent.click(screen.getByRole("button", { name: /confirmar recusa/i }));

    await waitFor(() =>
      expect(screen.getByText("Erro interno do servidor")).toBeInTheDocument(),
    );
  });
});
