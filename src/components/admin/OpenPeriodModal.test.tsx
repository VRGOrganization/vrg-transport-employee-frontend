import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OpenPeriodModal } from "./OpenPeriodModal";
import { brDayStartISO, todayCivilBR } from "@/lib/utils/date";

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

  it("trava o calendário em hoje (data civil de Brasília)", () => {
    render(<OpenPeriodModal {...baseProps} />);
    expect(screen.getByLabelText(/data de início/i)).toHaveAttribute(
      "min",
      todayCivilBR(),
    );
  });

  it("recusa data anterior a hoje", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2020-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir período/i }));

    expect(
      await screen.findByText(/não pode ser anterior a hoje/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("avisa que uma data futura deixa o ciclo agendado", async () => {
    render(<OpenPeriodModal {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-01-01" },
    });

    expect(await screen.findByText(/agendado/i)).toBeInTheDocument();
  });

  it("envia a meia-noite de Brasília, não a de UTC (a data não volta um dia)", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<OpenPeriodModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/data de início/i), {
      target: { value: "2030-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /abrir período/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload = onSubmit.mock.calls[0][0];
    expect(payload.startDate).toBe(brDayStartISO("2030-01-01"));
    expect(
      new Date(payload.startDate).toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      }),
    ).toBe("01/01/2030");
  });

});
