import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ParticipantCombobox } from "./ParticipantCombobox";
import type { AuditParticipant } from "@/types/audit";

const people: AuditParticipant[] = [
  { id: "1", name: "Gustavo", role: "employee", isStaff: true },
  { id: "2", name: "Guilherme", role: "employee", isStaff: true },
  { id: "3", name: "Giovanna", role: "student", isStaff: false },
  { id: "4", name: "Mariana", role: "student", isStaff: false },
];

function open(onChange = vi.fn()) {
  render(
    <ParticipantCombobox
      label="Pessoa"
      value=""
      participants={people}
      onChange={onChange}
      highlightStaff
    />,
  );
  // o primeiro button é o gatilho do combobox (aria-haspopup=listbox)
  fireEvent.click(screen.getByRole("button", { expanded: false }));
  return onChange;
}

describe("ParticipantCombobox", () => {
  it("shows 'Todos' and all participants when opened", () => {
    open();
    const list = screen.getByRole("listbox");
    expect(within(list).getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("Gustavo")).toBeInTheDocument();
    expect(screen.getByText("Giovanna")).toBeInTheDocument();
  });

  it("filters incrementally by typed name", () => {
    open();
    const input = screen.getByPlaceholderText("Digite um nome…");
    fireEvent.change(input, { target: { value: "G" } });
    expect(screen.getByText("Gustavo")).toBeInTheDocument();
    expect(screen.getByText("Guilherme")).toBeInTheDocument();
    expect(screen.getByText("Giovanna")).toBeInTheDocument();
    expect(screen.queryByText("Mariana")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "Gust" } });
    expect(screen.getByText("Gustavo")).toBeInTheDocument();
    expect(screen.queryByText("Guilherme")).not.toBeInTheDocument();
  });

  it("shows 'Não encontrado' when nothing matches", () => {
    open();
    fireEvent.change(screen.getByPlaceholderText("Digite um nome…"), {
      target: { value: "Zzz" },
    });
    expect(screen.getByText("Não encontrado")).toBeInTheDocument();
  });

  it("selects a person and returns its id (never shows id)", () => {
    const onChange = open();
    fireEvent.click(screen.getByText("Gustavo"));
    expect(onChange).toHaveBeenCalledWith("1");
  });

  it("highlights staff members", () => {
    open();
    // dois funcionários → dois selos "Funcionário"
    expect(screen.getAllByText("Funcionário").length).toBe(2);
  });
});
