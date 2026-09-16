import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AlertTriangle } from "lucide-react";

import { ConfirmModal } from "./ConfirmModal";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: "Encerrar período",
  description: "5 pedidos pendentes serão cancelados.",
  icon: AlertTriangle,
  variant: "danger" as const,
  confirmLabel: "Encerrar",
};

describe("ConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("confirms directly when no confirmation gate is given", () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...baseProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: baseProps.confirmLabel }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows the server error when given", () => {
    render(<ConfirmModal {...baseProps} error="Falhou no servidor" />);

    expect(screen.getByText("Falhou no servidor")).toBeInTheDocument();
  });

  describe("confirmation: checkbox", () => {
    const acknowledgeLabel = "Entendi que os alunos perderão carteirinha, vaga e passes.";

    it("keeps the confirm button disabled until the checkbox is ticked", () => {
      render(
        <ConfirmModal
          {...baseProps}
          confirmation={{ kind: "checkbox", label: acknowledgeLabel }}
        />,
      );

      const confirm = screen.getByRole("button", { name: baseProps.confirmLabel });
      expect(confirm).toBeDisabled();

      fireEvent.click(screen.getByRole("checkbox"));

      expect(confirm).toBeEnabled();
    });

    it("does not confirm while the checkbox is unticked", () => {
      const onConfirm = vi.fn();
      render(
        <ConfirmModal
          {...baseProps}
          onConfirm={onConfirm}
          confirmation={{ kind: "checkbox", label: acknowledgeLabel }}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: baseProps.confirmLabel }));

      expect(onConfirm).not.toHaveBeenCalled();
    });

    // Reabrir o modal não pode herdar a ciência dada na vez anterior — senão o
    // admin confirma uma ação destrutiva com um clique só.
    it("resets the acknowledgement when reopened", () => {
      const { rerender } = render(
        <ConfirmModal {...baseProps} confirmation={{ kind: "checkbox", label: acknowledgeLabel }} />,
      );

      fireEvent.click(screen.getByRole("checkbox"));
      expect(screen.getByRole("button", { name: baseProps.confirmLabel })).toBeEnabled();

      rerender(
        <ConfirmModal {...baseProps} open={false} confirmation={{ kind: "checkbox", label: acknowledgeLabel }} />,
      );
      rerender(
        <ConfirmModal {...baseProps} open confirmation={{ kind: "checkbox", label: acknowledgeLabel }} />,
      );

      expect(screen.getByRole("checkbox")).not.toBeChecked();
      expect(screen.getByRole("button", { name: baseProps.confirmLabel })).toBeDisabled();
    });
  });

  describe("confirmation: type-word", () => {
    it("keeps the confirm button disabled until the confirmation word is typed correctly", async () => {
      const onConfirm = vi.fn(() => Promise.resolve());
      render(
        <ConfirmModal {...baseProps} onConfirm={onConfirm} confirmation={{ kind: "type-word", word: "ENCERRAR" }} />,
      );

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
      render(<ConfirmModal {...baseProps} confirmation={{ kind: "type-word", word: "ENCERRAR" }} />);
      fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
        target: { value: "encerrar" },
      });
      expect(screen.getByRole("button", { name: "Encerrar" })).toBeDisabled();
    });

    it("resets the typed word when reopened", async () => {
      const { rerender } = render(
        <ConfirmModal {...baseProps} open={false} confirmation={{ kind: "type-word", word: "ENCERRAR" }} />,
      );
      rerender(<ConfirmModal {...baseProps} open confirmation={{ kind: "type-word", word: "ENCERRAR" }} />);
      fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
        target: { value: "ENCERRAR" },
      });
      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Encerrar" })).not.toBeDisabled(),
      );

      rerender(<ConfirmModal {...baseProps} open={false} confirmation={{ kind: "type-word", word: "ENCERRAR" }} />);
      rerender(<ConfirmModal {...baseProps} open confirmation={{ kind: "type-word", word: "ENCERRAR" }} />);

      expect(screen.getByLabelText(/digite ENCERRAR/i)).toHaveValue("");
      expect(screen.getByRole("button", { name: "Encerrar" })).toBeDisabled();
    });

    it("disables the confirm button while loading, even with the correct word typed", () => {
      render(<ConfirmModal {...baseProps} loading confirmation={{ kind: "type-word", word: "ENCERRAR" }} />);
      fireEvent.change(screen.getByLabelText(/digite ENCERRAR/i), {
        target: { value: "ENCERRAR" },
      });
      expect(screen.getByRole("button", { name: "Encerrar" })).toBeDisabled();
    });
  });

  describe("confirmation: type-identifier", () => {
    const confirmation = {
      kind: "type-identifier" as const,
      identifier: "BUS-042",
      label: "Confirme o identificador do ônibus",
    };

    it("keeps the confirm button disabled until the identifier is typed exactly", () => {
      render(<ConfirmModal {...baseProps} confirmLabel="Desativar" confirmation={confirmation} />);

      const confirmButton = screen.getByRole("button", { name: "Desativar" });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText(confirmation.identifier), {
        target: { value: "BUS-04" },
      });
      expect(confirmButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText(confirmation.identifier), {
        target: { value: confirmation.identifier },
      });
      expect(confirmButton).toBeEnabled();
    });

    it("does not confirm on partial match", () => {
      const onConfirm = vi.fn();
      render(<ConfirmModal {...baseProps} onConfirm={onConfirm} confirmLabel="Desativar" confirmation={confirmation} />);

      fireEvent.change(screen.getByPlaceholderText(confirmation.identifier), {
        target: { value: "bus-042" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Desativar" }));

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });
});
