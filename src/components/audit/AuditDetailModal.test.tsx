import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditDetailModal } from "./AuditDetailModal";
import type { AuditEvent } from "@/types/audit";

const event: AuditEvent = {
  id: "evt-1",
  action: "license.reject",
  outcome: "failure",
  actor: { id: "emp-1", role: "employee" },
  target: { licenseId: "lic-1" },
  metadata: { reason: "documento ilegível" },
  createdAt: "2026-01-01T10:00:00Z",
  actorName: "Maria Funcionária",
};

describe("AuditDetailModal", () => {
  it("renders nothing when no event", () => {
    const { container } = render(
      <AuditDetailModal event={null} onClose={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows the resolved names and PT-BR label (no raw code, no metadata)", () => {
    render(<AuditDetailModal event={event} onClose={vi.fn()} />);
    expect(screen.getAllByText("Recusa de carteirinha").length).toBeGreaterThan(
      0,
    );
    expect(screen.getByText("Maria Funcionária")).toBeInTheDocument();
    // código cru da ação NÃO deve aparecer
    expect(screen.queryByText(/license\.reject/)).not.toBeInTheDocument();
    // metadata crua (ip/userAgent/reason) NÃO deve aparecer
    expect(screen.queryByText(/documento ilegível/)).not.toBeInTheDocument();
    // papel exibido em PT-BR
    expect(screen.getByText(/Funcionário/)).toBeInTheDocument();
  });

  it("closes when the X button is clicked", () => {
    const onClose = vi.fn();
    render(<AuditDetailModal event={event} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText("Fechar"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does NOT close on Escape (X-only requirement)", () => {
    const onClose = vi.fn();
    render(<AuditDetailModal event={event} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("does NOT close when clicking the backdrop", () => {
    const onClose = vi.fn();
    render(<AuditDetailModal event={event} onClose={onClose} />);
    const dialog = screen.getByRole("dialog");
    // backdrop is the dialog's parent overlay
    fireEvent.click(dialog.parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });
});
