import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ScheduleResetModal } from "./ScheduleResetModal";

const baseProps = {
  open: true,
  loading: false,
  serverError: "",
  onClose: vi.fn(),
  onSubmit: vi.fn(() => Promise.resolve()),
};

describe("ScheduleResetModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a validation error and does not call onSubmit when days is empty", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<ScheduleResetModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(await screen.findByText(/no mínimo 1/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows a validation error for days < 1", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<ScheduleResetModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/quantos dias/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    expect(await screen.findByText(/no mínimo 1/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the parsed number of days on valid input", async () => {
    const onSubmit = vi.fn(() => Promise.resolve());
    render(<ScheduleResetModal {...baseProps} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/quantos dias/i), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: /confirmar/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(3));
  });

  it("shows the API error message when the server rejects (e.g. tentativa de adiar)", () => {
    const errorMsg = "Não é possível adiar o reset, apenas antecipar.";
    render(<ScheduleResetModal {...baseProps} serverError={errorMsg} />);

    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });
});
