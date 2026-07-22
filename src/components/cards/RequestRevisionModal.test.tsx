import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestRevisionModal } from "./RequestRevisionModal";
import type { LicenseRequestRecord } from "@/types/cards.types";

function makeRequest(over: Partial<LicenseRequestRecord> = {}): LicenseRequestRecord {
  return {
    _id: "req-1",
    studentId: "student-1",
    type: "initial",
    changedDocuments: [],
    status: "pending",
    rejectionReason: null,
    rejectedAt: null,
    licenseId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...over,
  };
}

describe("RequestRevisionModal — declaração de uso do sistema antigo", () => {
  it("inclui 'Carteirinha de Transporte Atual' entre os documentos revisáveis quando alreadyUsesTransport=true", () => {
    render(
      <RequestRevisionModal
        currentLicenseRequest={makeRequest()}
        alreadyUsesTransport={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Carteirinha de Transporte Atual")).toBeInTheDocument();
  });

  it("não inclui 'Carteirinha de Transporte Atual' quando alreadyUsesTransport=false", () => {
    render(
      <RequestRevisionModal
        currentLicenseRequest={makeRequest()}
        alreadyUsesTransport={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.queryByText("Carteirinha de Transporte Atual")).not.toBeInTheDocument();
  });
});

describe("RequestRevisionModal — declaração de PCD", () => {
  it("inclui 'Laudo Médico (PCD)' entre os documentos revisáveis quando hasDisability=true", () => {
    render(
      <RequestRevisionModal
        currentLicenseRequest={makeRequest()}
        alreadyUsesTransport={false}
        hasDisability={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.getByText("Laudo Médico (PCD)")).toBeInTheDocument();
  });

  it("não inclui 'Laudo Médico (PCD)' quando hasDisability=false", () => {
    render(
      <RequestRevisionModal
        currentLicenseRequest={makeRequest()}
        alreadyUsesTransport={false}
        hasDisability={false}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
        onReload={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    expect(screen.queryByText("Laudo Médico (PCD)")).not.toBeInTheDocument();
  });
});
