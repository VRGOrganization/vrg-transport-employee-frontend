import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SideNav } from "@/components/shell/SideNav";
import { ADMIN_NAV_ITEMS, ADMIN_BRAND, EMPLOYEE_NAV_ITEMS, EMPLOYEE_BRAND } from "@/components/shell/navConfig";

const pathnameState = vi.hoisted(() => ({ value: "/admin/dashboard" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameState.value,
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/components/hooks/useEmployeeAuth", () => ({
  useEmployeeAuth: () => ({
    user: { name: "Admin Teste", registrationId: "ADM001" },
    loading: false,
    logout: vi.fn(),
  }),
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
    render(<SideNav brand={ADMIN_BRAND} items={ADMIN_NAV_ITEMS} onLogout={onLogout} />);

    expect(screen.getByText("Funcionários")).toBeInTheDocument();
    expect(screen.getByText("Período de Inscrição")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /sair/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("deve ocultar item de gerenciar funcionario para perfil employee", () => {
    pathnameState.value = "/employee/dashboard";
    render(<SideNav brand={EMPLOYEE_BRAND} items={EMPLOYEE_NAV_ITEMS} onLogout={vi.fn()} showUserFooter={false} />);

    expect(screen.queryByText("Gerenciar Funcionário")).not.toBeInTheDocument();
    expect(screen.queryByText("Período de Inscrição")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar estudantes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar carteirinhas/i })).toBeInTheDocument();
  });
});
