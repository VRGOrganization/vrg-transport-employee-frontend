import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EmployeeDeleteForm } from "./EmployeeDeleteForm";
import type { Employee } from "@/types/employee";

const remove = vi.fn(() => Promise.resolve({ message: "ok" }));

vi.mock("@/services/employeeService", () => ({
  employeeService: {
    remove: (...args: unknown[]) => remove(...args),
  },
}));

const employee: Employee = {
  _id: "emp-1",
  name: "joão da silva",
  email: "joao@example.com",
  registrationId: "MAT-001",
  active: false,
  createdAt: "2026-01-10T12:00:00.000Z",
  updatedAt: "2026-01-10T12:00:00.000Z",
};

function setup() {
  const onCancel = vi.fn();
  const onDeleted = vi.fn();
  render(
    <EmployeeDeleteForm employee={employee} onCancel={onCancel} onDeleted={onDeleted} />,
  );
  return { onCancel, onDeleted };
}

const submitButton = () =>
  screen.getByRole("button", { name: /Excluir Permanentemente/i });

const fillReasonAndName = () => {
  fireEvent.change(screen.getByPlaceholderText(/Descreva detalhadamente/i), {
    target: { value: "Desligamento definitivo do quadro." },
  });
  fireEvent.change(screen.getByPlaceholderText("Nome completo do funcionário"), {
    target: { value: "João Da Silva" },
  });
};

describe("EmployeeDeleteForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("states that the action is irreversible", () => {
    setup();
    expect(screen.getByText("Ação irreversível e imediata")).toBeInTheDocument();
  });

  it("keeps the agreement locked until the terms are opened", () => {
    setup();
    const agreement = screen.getByText(
      "Li e concordo com os termos e consequências",
    ).closest("button")!;
    expect(agreement).toBeDisabled();
    expect(screen.getByText(/Abra e leia os termos para habilitar/i)).toBeInTheDocument();

    fireEvent.click(
      screen.getByText(/Termos e consequências da exclusão permanente/i),
    );
    expect(agreement).toBeEnabled();
  });

  it("keeps submit disabled until reason, exact name and agreement are all provided", () => {
    setup();
    expect(submitButton()).toBeDisabled();

    fillReasonAndName();
    // Termos ainda não lidos/aceitos.
    expect(submitButton()).toBeDisabled();

    fireEvent.click(
      screen.getByText(/Termos e consequências da exclusão permanente/i),
    );
    fireEvent.click(
      screen.getByText("Li e concordo com os termos e consequências"),
    );
    expect(submitButton()).toBeEnabled();
  });

  it("keeps submit disabled when the typed name does not match", () => {
    setup();
    fireEvent.change(screen.getByPlaceholderText(/Descreva detalhadamente/i), {
      target: { value: "Desligamento definitivo do quadro." },
    });
    fireEvent.change(screen.getByPlaceholderText("Nome completo do funcionário"), {
      target: { value: "Joao Silva" },
    });
    fireEvent.click(
      screen.getByText(/Termos e consequências da exclusão permanente/i),
    );
    fireEvent.click(
      screen.getByText("Li e concordo com os termos e consequências"),
    );

    expect(submitButton()).toBeDisabled();
  });

  it("sends the reason to the service and shows the success state", async () => {
    setup();
    fillReasonAndName();
    fireEvent.click(
      screen.getByText(/Termos e consequências da exclusão permanente/i),
    );
    fireEvent.click(
      screen.getByText("Li e concordo com os termos e consequências"),
    );
    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(remove).toHaveBeenCalledWith("emp-1", [
        "Desligamento definitivo do quadro.",
      ]),
    );
    expect(await screen.findByText("Funcionário excluído")).toBeInTheDocument();
  });

  it("surfaces the backend error message and stays on the form", async () => {
    remove.mockRejectedValueOnce({
      message: "Apenas funcionários desativados podem ser excluídos.",
    });
    const { onDeleted } = setup();
    fillReasonAndName();
    fireEvent.click(
      screen.getByText(/Termos e consequências da exclusão permanente/i),
    );
    fireEvent.click(
      screen.getByText("Li e concordo com os termos e consequências"),
    );
    fireEvent.click(submitButton());

    expect(
      await screen.findByText(
        "Apenas funcionários desativados podem ser excluídos.",
      ),
    ).toBeInTheDocument();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
