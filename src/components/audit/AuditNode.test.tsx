import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditNode } from "./AuditNode";
import type { AuditEvent } from "@/types/audit";

const event: AuditEvent = {
  id: "evt-1",
  action: "employee.deactivate",
  outcome: "success",
  actor: { id: "admin-1", role: "admin" },
  target: { employeeId: "emp-1" },
  metadata: null,
  createdAt: "2026-01-01T10:00:00Z",
  actorName: "Fulano Admin",
};

function renderNode(props: Partial<React.ComponentProps<typeof AuditNode>> = {}) {
  const onToggleSelect = vi.fn();
  const onOpen = vi.fn();
  render(
    <AuditNode
      event={event}
      selected={false}
      isFirst
      isLast
      onToggleSelect={onToggleSelect}
      onOpen={onOpen}
      {...props}
    />,
  );
  return { onToggleSelect, onOpen };
}

describe("AuditNode", () => {
  it("shows the PT-BR action label and actor", () => {
    renderNode();
    expect(screen.getByText("Desativação de funcionário")).toBeInTheDocument();
    expect(screen.getByText("Fulano Admin")).toBeInTheDocument();
  });

  it("opens the detail when the card is clicked", () => {
    const { onOpen } = renderNode();
    fireEvent.click(screen.getByText("Desativação de funcionário"));
    expect(onOpen).toHaveBeenCalledWith(event);
  });

  it("toggles selection via the Selecionar control without opening", () => {
    const { onToggleSelect, onOpen } = renderNode();
    fireEvent.click(screen.getByText("Selecionar"));
    expect(onToggleSelect).toHaveBeenCalledWith("evt-1");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("marks the card as pressed and shows 'Selecionado' when selected", () => {
    renderNode({ selected: true });
    const card = screen.getByRole("button", { pressed: true });
    expect(card).toBeInTheDocument();
    expect(screen.getByText("Selecionado")).toBeInTheDocument();
  });
});
