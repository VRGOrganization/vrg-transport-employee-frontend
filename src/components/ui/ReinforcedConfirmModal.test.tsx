import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ReinforcedConfirmModal } from "./ReinforcedConfirmModal";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(() => Promise.resolve()),
  title: "Encerrar período",
  description: "5 pedidos pendentes serão cancelados.",
  confirmWord: "ENCERRAR",
  confirmLabel: "Encerrar",
};

describe("ReinforcedConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the confirm button disabled until the confirmation word is typed correctly", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    render(<ReinforcedConfirmModal {...baseProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByRole("button", { name: "Encerrar" });
    expect(confirmButton).toBeDisabled();

    fireEvent.click(confirmButton);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCER" },
    });
    expect(confirmButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCERRAR" },
    });
    await waitFor(() => expect(confirmButton).not.toBeDisabled());

    fireEvent.click(confirmButton);
    await waitFor(() => expect(onConfirm).toHaveBeenCalledOnce());
  });

  it("is case-sensitive: lowercase input does not unlock the button", () => {
    render(<ReinforcedConfirmModal {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "encerrar" },
    });
    expect(screen.getByRole("button", { name: "Encerrar" })).toBeDisabled();
  });

  it("renders the impact description", () => {
    render(<ReinforcedConfirmModal {...baseProps} />);
    expect(
      screen.getByText("5 pedidos pendentes serão cancelados."),
    ).toBeInTheDocument();
  });

  it("shows the server error when present", () => {
    render(<ReinforcedConfirmModal {...baseProps} error="Falha ao encerrar." />);
    expect(screen.getByText("Falha ao encerrar.")).toBeInTheDocument();
  });

  it("resets the typed word when reopened", async () => {
    const { rerender } = render(
      <ReinforcedConfirmModal {...baseProps} open={false} />,
    );
    rerender(<ReinforcedConfirmModal {...baseProps} open={true} />);
    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCERRAR" },
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Encerrar" })).not.toBeDisabled(),
    );

    rerender(<ReinforcedConfirmModal {...baseProps} open={false} />);
    rerender(<ReinforcedConfirmModal {...baseProps} open={true} />);

    expect(screen.getByLabelText(/digite ENCERRAR/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: "Encerrar" })).toBeDisabled();
  });

  it("disables the confirm button while loading, even with the correct word typed", () => {
    render(<ReinforcedConfirmModal {...baseProps} loading />);
    fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
      target: { value: "ENCERRAR" },
    });
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
  });
});
