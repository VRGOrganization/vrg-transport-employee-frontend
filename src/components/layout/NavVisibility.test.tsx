import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EmployeeSideNav } from "./EmployeeSideNav";
import { SideNav } from "./SideNav";

const pathnameState = vi.hoisted(() => ({ value: "/admin/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("Side navigation por perfil", () => {
  beforeEach(() => {
    pathnameState.value = "/admin/dashboard";
  });

  it("deve exibir item de gerenciar funcionario para perfil admin", async () => {
    const onLogout = vi.fn();
    render(<SideNav onLogout={onLogout} />);

    expect(screen.getByText("Gerenciar Funcionário")).toBeInTheDocument();
    expect(screen.getByText("Período de Inscrição")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("deve ocultar item de gerenciar funcionario para perfil employee", () => {
    pathnameState.value = "/employee/dashboard";
    render(<EmployeeSideNav onLogout={vi.fn()} />);

    expect(screen.queryByText("Gerenciar Funcionário")).not.toBeInTheDocument();
    expect(screen.queryByText("Período de Inscrição")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar estudantes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar carteirinhas/i })).toBeInTheDocument();
  });
});
