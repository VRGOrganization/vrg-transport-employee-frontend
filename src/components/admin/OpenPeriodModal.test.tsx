import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpenPeriodModal } from "./OpenPeriodModal";

const baseProps = {
  open: true,
  loading: false,
  serverError: "",
  onClose: vi.fn(),
  onSubmit: vi.fn(() => Promise.resolve()),
};

describe("OpenPeriodModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("only asks for start date and license validity — no window/end date field", () => {
    render(<OpenPeriodModal {...baseProps} />);
    expect(screen.getByLabelText(/data de início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/validade da carteirinha/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/data de fim/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/data de término/i)).not.toBeInTheDocument();
  });

  it("requires a start date", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /abrir período/i }));

    expect(await screen.findByText(/data de início é obrigatória/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits only startDate and licenseValidityMonths, no endDate", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: "6" },
    });

    fireEvent.click(screen.getByRole("button", { name: /abrir período/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect("endDate" in payload).toBe(false);
    expect(payload.startDate).toContain("2030-01-01");
    expect(payload.licenseValidityMonths).toBe(6);
  });

  it("validates licenseValidityMonths >= 1", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir período/i }));

    expect(await screen.findByText(/validade deve ser maior ou igual a 1/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("previews 'válida até' from start date + months (UTC, aligned to backend)", async () => {
    render(<OpenPeriodModal {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-02-01" },
    });
    fireEvent.change(screen.getByLabelText(/validade da carteirinha/i), {
      target: { value: "6" },
    });

    // 2030-02-01 + 6 meses (UTC) = 01/08/2030
    expect(await screen.findByText("01/08/2030")).toBeInTheDocument();
  });

  it("shows backend error as general error in modal", () => {
    const errorMsg = "Não há ônibus com vagas para abrir um ciclo de inscrição.";
    render(<OpenPeriodModal {...baseProps} serverError={errorMsg} />);
    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });
});
