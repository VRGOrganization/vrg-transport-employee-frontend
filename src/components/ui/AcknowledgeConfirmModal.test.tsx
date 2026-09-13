import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AcknowledgeConfirmModal } from "./AcknowledgeConfirmModal";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onConfirm: vi.fn(),
  title: "Confirmar encerramento das carteirinhas",
  description: "Os alunos alcançados perderão a carteirinha.",
  acknowledgeLabel: "Entendi que os alunos perderão carteirinha, vaga e passes.",
  confirmLabel: "Abrir janela e encerrar",
};

describe("AcknowledgeConfirmModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps the confirm button disabled until the checkbox is ticked", () => {
    render(<AcknowledgeConfirmModal {...baseProps} />);

    const confirm = screen.getByRole("button", { name: baseProps.confirmLabel });
    expect(confirm).toBeDisabled();

    fireEvent.click(screen.getByRole("checkbox"));

    expect(confirm).toBeEnabled();
  });

  it("does not confirm while the checkbox is unticked", () => {
    const onConfirm = vi.fn();
    render(<AcknowledgeConfirmModal {...baseProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("button", { name: baseProps.confirmLabel }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("confirms once acknowledged", () => {
    const onConfirm = vi.fn();
    render(<AcknowledgeConfirmModal {...baseProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: baseProps.confirmLabel }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  // Reabrir o modal não pode herdar a ciência dada na vez anterior — senão o
  // admin confirma uma ação destrutiva com um clique só.
  it("resets the acknowledgement when reopened", () => {
    const { rerender } = render(<AcknowledgeConfirmModal {...baseProps} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(screen.getByRole("button", { name: baseProps.confirmLabel })).toBeEnabled();

    rerender(<AcknowledgeConfirmModal {...baseProps} open={false} />);
    rerender(<AcknowledgeConfirmModal {...baseProps} open />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: baseProps.confirmLabel })).toBeDisabled();
  });

  it("shows the server error when given", () => {
    render(<AcknowledgeConfirmModal {...baseProps} error="Falhou no servidor" />);

    expect(screen.getByText("Falhou no servidor")).toBeInTheDocument();
  });
});
