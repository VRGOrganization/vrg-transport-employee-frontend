import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { listMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
}));

vi.mock("@/services/priorityRuleService", () => ({
  priorityRuleService: {
    list: listMock,
    create: vi.fn(),
    update: vi.fn(),
    toggle: vi.fn(),
    deactivate: vi.fn(),
  },
}));

import { PriorityRulesPage } from "./PriorityRulesPage";
import type { PriorityRule } from "@/types/priorityRule";

function makeRule(overrides: Partial<PriorityRule> = {}): PriorityRule {
  return {
    _id: "rule-1",
    level: 1,
    name: "Regra",
    description: "",
    criteria: [],
    criteriaLogic: "all",
    active: true,
    sortOrder: 0,
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
