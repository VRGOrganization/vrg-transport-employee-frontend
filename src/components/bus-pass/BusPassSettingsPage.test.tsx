import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { BusPassSettingsPage } from "./BusPassSettingsPage";

describe("BusPassSettingsPage", () => {
  it("admin edita e salva as configurações", async () => {
    render(<BusPassSettingsPage />);

    const quota = await screen.findByLabelText(/cota mensal/i);
    expect(quota).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /salvar/i })).toBeInTheDocument();
  });

  it("não oferece mais a chave de permissão do funcionário", async () => {
    render(<BusPassSettingsPage />);

    await screen.findByLabelText(/cota mensal/i);
    expect(screen.queryByText(/permitir que funcionários/i)).not.toBeInTheDocument();
  });
});
