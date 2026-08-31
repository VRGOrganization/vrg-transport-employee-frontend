import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMock, reactivateMock, deactivateMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  reactivateMock: vi.fn(),
  deactivateMock: vi.fn(),
}));

vi.mock("@/services/priorityRuleService", () => ({
  priorityRuleService: {
    list: listMock,
    create: vi.fn(),
    update: vi.fn(),
    deactivate: deactivateMock,
    reactivate: reactivateMock,
    vacantLevels: vi.fn().mockResolvedValue([1, 2, 3, 4, 5]),
  },
}));

import { PriorityRulesPage } from "./PriorityRulesPage";
import type { PriorityRule } from "@/types/priorityRule";

function makeRule(overrides: Partial<PriorityRule> = {}): PriorityRule {
  return {
    _id: "rule-1",
    level: 1,
    originalLevel: 1,
    name: "Regra",
    description: "",
    criteria: [],
    criteriaLogic: "all",
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PriorityRulesPage — rótulos das condições na lista", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the 'PCD' chip for a has_disability criterion", async () => {
    listMock.mockResolvedValue([
      makeRule({ name: "Regra PCD", criteria: [{ type: "has_disability" }] }),
    ]);

    render(<PriorityRulesPage role="admin" />);

    await waitFor(() => expect(screen.getByText("Regra PCD")).toBeInTheDocument());
    expect(screen.getByText("PCD")).toBeInTheDocument();
  });

  it("shows the transport chip for an already_uses_transport criterion", async () => {
    listMock.mockResolvedValue([
      makeRule({
        name: "Regra transporte",
        criteria: [{ type: "already_uses_transport" }],
      }),
    ]);

    render(<PriorityRulesPage role="admin" />);

    await waitFor(() =>
      expect(screen.getByText("Regra transporte")).toBeInTheDocument(),
    );
    expect(screen.getByText("Já usa o sistema de transporte")).toBeInTheDocument();
  });

  it("shows both chips for a rule combining both criteria", async () => {
    listMock.mockResolvedValue([
      makeRule({
        name: "Regra combinada",
        criteria: [{ type: "has_disability" }, { type: "already_uses_transport" }],
      }),
    ]);

    render(<PriorityRulesPage role="admin" />);

    await waitFor(() =>
      expect(screen.getByText("Regra combinada")).toBeInTheDocument(),
    );
    expect(screen.getByText("PCD")).toBeInTheDocument();
    expect(screen.getByText("Já usa o sistema de transporte")).toBeInTheDocument();
  });
});

describe("PriorityRulesPage — reativação", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reactivates immediately with no confirmation modal when no cascade overflow", async () => {
    const inactiveRule = makeRule({ active: false });
    listMock.mockResolvedValue([inactiveRule]);
    reactivateMock.mockResolvedValue({
      reactivated: { ...inactiveRule, active: true },
      cascaded: [],
      deactivated: null,
    });

    render(<PriorityRulesPage role="admin" />);

    fireEvent.click(await screen.findByText(/inativas/i));
    const reactivateBtn = await screen.findByTitle("Reativar");
    fireEvent.click(reactivateBtn);

    await waitFor(() => expect(reactivateMock).toHaveBeenCalledWith("rule-1", false));
    expect(screen.queryByText("Confirmar reativação")).not.toBeInTheDocument();
  });

  it("opens a confirmation modal with the preview when the API returns 409", async () => {
    const inactiveRule = makeRule({ active: false, name: "Aluno antigo e PCD" });
    listMock.mockResolvedValue([inactiveRule]);
    reactivateMock.mockRejectedValueOnce({
      status: 409,
      message: "conflito",
      details: {
        preview: {
          ruleId: "rule-1",
          ruleName: "Aluno antigo e PCD",
          targetLevel: 1,
          cascadedRuleIds: [],
          willDeactivate: { ruleId: "rule-5", ruleName: "Padrão", level: 5 },
        },
      },
    });

    render(<PriorityRulesPage role="admin" />);

    fireEvent.click(await screen.findByText(/inativas/i));
    fireEvent.click(await screen.findByTitle("Reativar"));

    await screen.findByRole("heading", { name: "Confirmar reativação" });
    expect(screen.getByText(/Padrão/)).toBeInTheDocument();
  });

  it("confirms the cascading reactivation and applies the full result", async () => {
    const inactiveRule = makeRule({ active: false, name: "Aluno antigo e PCD" });
    listMock.mockResolvedValue([inactiveRule]);
    reactivateMock.mockRejectedValueOnce({
      status: 409,
      message: "conflito",
      details: {
        preview: {
          ruleId: "rule-1",
          ruleName: "Aluno antigo e PCD",
          targetLevel: 1,
          cascadedRuleIds: ["rule-2"],
          willDeactivate: { ruleId: "rule-5", ruleName: "Padrão", level: 5 },
        },
      },
    });
    reactivateMock.mockResolvedValueOnce({
      reactivated: { ...inactiveRule, active: true, level: 1 },
      cascaded: [makeRule({ _id: "rule-2", level: 2, originalLevel: 2 })],
      deactivated: makeRule({ _id: "rule-5", active: false, level: 5, originalLevel: 5 }),
    });

    render(<PriorityRulesPage role="admin" />);

    fireEvent.click(await screen.findByText(/inativas/i));
    fireEvent.click(await screen.findByTitle("Reativar"));

    await screen.findByRole("heading", { name: "Confirmar reativação" });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar reativação" }));

    await waitFor(() => expect(reactivateMock).toHaveBeenLastCalledWith("rule-1", true));
  });
});
