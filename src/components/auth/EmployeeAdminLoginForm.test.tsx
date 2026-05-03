import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeAdminLoginForm } from "./EmployeeAdminLoginForm";

const loginMock = vi.fn();

vi.mock("@/components/hooks/useEmployeeAuth", () => ({
  useEmployeeAuth: () => ({
    login: loginMock,
    loading: false,
  }),
}));

describe("EmployeeAdminLoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loginMock.mockResolvedValue({ success: true });
  });

  it("deve validar dados antes de enviar quando login esta vazio", async () => {
    render(<EmployeeAdminLoginForm />);

    await userEvent.type(screen.getByPlaceholderText("••••••••"), "Senha123");
    await userEvent.click(screen.getByRole("button", { name: "Acessar Sistema" }));

    expect(await screen.findByText("Login deve ter no minimo 3 caracteres")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("deve exibir erro geral quando autenticacao falha", async () => {
    loginMock.mockResolvedValue({ success: false, error: "Credenciais invalidas" });
    render(<EmployeeAdminLoginForm />);

    await userEvent.type(screen.getByPlaceholderText("email@dominio.com ou MAT123456"), "MAT123456");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "Senha123");
    await userEvent.selectOptions(screen.getByRole("combobox"), "admin");
    await userEvent.click(screen.getByRole("button", { name: "Acessar Sistema" }));

    expect(await screen.findByText("Credenciais invalidas")).toBeInTheDocument();
    expect(loginMock).toHaveBeenCalledTimes(1);
  });

  it("deve validar senha curta e mostrar erro por campo", async () => {
    render(<EmployeeAdminLoginForm />);

    await userEvent.type(screen.getByPlaceholderText("email@dominio.com ou MAT123456"), "MAT123456");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "123");
    await userEvent.click(screen.getByRole("button", { name: "Acessar Sistema" }));

    expect(await screen.findByText("Senha deve ter no minimo 6 caracteres")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("deve permitir navegacao basica por teclado no formulario", async () => {
    render(<EmployeeAdminLoginForm />);

    await userEvent.tab();
    expect(screen.getByRole("combobox")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByPlaceholderText("email@dominio.com ou MAT123456")).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByPlaceholderText("••••••••")).toHaveFocus();
  });
});
