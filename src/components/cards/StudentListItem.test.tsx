import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudentListItem } from "./StudentListItem";
import type { LicenseRequestRecord, StudentRecord } from "@/types/cards.types";

const student: StudentRecord = {
  _id: "student-1",
  name: "Aluno Parcial",
  email: "aluno@example.com",
  active: true,
  institution: "Universidade C1",
};

function makeRequest(
  overrides: Partial<LicenseRequestRecord> = {},
): LicenseRequestRecord {
  return {
    _id: "request-1",
    studentId: "student-1",
    type: "initial",
    changedDocuments: [],
    status: "approved",
    rejectionReason: null,
    rejectedAt: null,
    licenseId: "license-1",
    createdAt: "2026-04-19T10:00:00.000Z",
    allocationSummary: [],
    ...overrides,
  };
}

describe("StudentListItem", () => {
  it("deriva status parcial de carteirinha existente com alocacao waitlisted", () => {
    render(
      <StudentListItem
        student={student}
        isSelected={false}
        hasCard={true}
        latestRequest={makeRequest({
          allocationSummary: [
            {
              day: "SEG",
              period: "Manhã",
              busIdentifier: "BUS-01",
              busId: "bus-1",
              status: "active",
              needsOutbound: true,
              needsReturn: true,
            },
            {
              day: "TER",
              period: "Tarde",
              busIdentifier: "BUS-02",
              busId: "bus-2",
              status: "waitlisted",
              needsOutbound: true,
              needsReturn: true,
            },
          ],
        })}
        isInBatch={false}
        onSelect={vi.fn()}
        onToggleBatch={vi.fn()}
      />,
    );

    expect(screen.getByText("Parcial")).toBeTruthy();
  });
});
