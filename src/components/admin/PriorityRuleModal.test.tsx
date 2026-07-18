import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createMock, updateMock, deactivateMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
  updateMock: vi.fn(),
  deactivateMock: vi.fn(),
}));

vi.mock("@/services/priorityRuleService", () => ({
  priorityRuleService: {
    create: createMock,
    update: updateMock,
    deactivate: deactivateMock,
  },
}));

import { PriorityRuleModal } from "./PriorityRuleModal";
import type { PriorityRule } from "@/types/priorityRule";

function makeRule(overrides: Partial<PriorityRule> = {}): PriorityRule {
  return {
    _id: "rule-1",
    level: 1,
    name: "PCD",
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

const baseProps = {
  open: true,
  initial: null as PriorityRule | null,
  onClose: vi.fn(),
  onSaved: vi.fn(),
  onDeleted: vi.fn(),
};

describe("PriorityRuleModal — condições amigáveis (transporte + PCD)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue(makeRule());
    updateMock.mockResolvedValue(makeRule());
  });

  it("shows the two friendly condition checkboxes and no generic type/operator pickers", () => {
    render(<PriorityRuleModal {...baseProps} />);

    expect(
      screen.getByLabelText("Já usa o sistema de transporte"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("É pessoa com deficiência (PCD)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Adicionar condição")).not.toBeInTheDocument();
  });

  it("does not show the E/OU selector when no condition or only one condition is checked", async () => {
    render(<PriorityRuleModal {...baseProps} />);
    expect(
      screen.queryByText(/TODAS as condições/i),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("É pessoa com deficiência (PCD)"));
    expect(
      screen.queryByText(/TODAS as condições/i),
    ).not.toBeInTheDocument();
  });

  it("shows the E/OU selector only when both conditions are checked", () => {
    render(<PriorityRuleModal {...baseProps} />);

    fireEvent.click(screen.getByLabelText("É pessoa com deficiência (PCD)"));
    fireEvent.click(screen.getByLabelText("Já usa o sistema de transporte"));

    expect(screen.getByText(/TODAS as condições/i)).toBeInTheDocument();
    expect(screen.getByText(/UMA das condições/i)).toBeInTheDocument();
  });

  it("submits with a single criterion when only PCD is checked", async () => {
    render(<PriorityRuleModal {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText(/Ex: Alunos/i), {
      target: { value: "Regra PCD" },
    });
    fireEvent.click(screen.getByLabelText("É pessoa com deficiência (PCD)"));
    fireEvent.click(screen.getByRole("button", { name: "Criar regra" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledOnce());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        criteria: [{ type: "has_disability" }],
      }),
    );
  });

  it("submits with a single criterion when only transport is checked", async () => {
    render(<PriorityRuleModal {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText(/Ex: Alunos/i), {
      target: { value: "Regra transporte" },
    });
    fireEvent.click(screen.getByLabelText("Já usa o sistema de transporte"));
    fireEvent.click(screen.getByRole("button", { name: "Criar regra" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledOnce());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        criteria: [{ type: "already_uses_transport" }],
      }),
    );
  });

  it("submits with both criteria and criteriaLogic=any when OU is chosen", async () => {
    render(<PriorityRuleModal {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText(/Ex: Alunos/i), {
      target: { value: "Regra combinada" },
    });
    fireEvent.click(screen.getByLabelText("É pessoa com deficiência (PCD)"));
    fireEvent.click(screen.getByLabelText("Já usa o sistema de transporte"));
    fireEvent.click(screen.getByText(/UMA das condições/i));
    fireEvent.click(screen.getByRole("button", { name: "Criar regra" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledOnce());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        criteriaLogic: "any",
        criteria: expect.arrayContaining([
          { type: "has_disability" },
          { type: "already_uses_transport" },
        ]),
      }),
    );
  });

  it("submits with an empty criteria list when nothing is checked", async () => {
    render(<PriorityRuleModal {...baseProps} />);

    fireEvent.change(screen.getByPlaceholderText(/Ex: Alunos/i), {
      target: { value: "Regra geral" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Criar regra" }));

    await waitFor(() => expect(createMock).toHaveBeenCalledOnce());
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ criteria: [] }),
    );
  });

  it("pre-checks only PCD when editing a rule with a single has_disability criterion, and hides the E/OU selector", () => {
    render(
      <PriorityRuleModal
        {...baseProps}
        initial={makeRule({ criteria: [{ type: "has_disability" }] })}
      />,
    );

    expect(
      screen.getByLabelText("É pessoa com deficiência (PCD)"),
    ).toBeChecked();
    expect(
      screen.getByLabelText("Já usa o sistema de transporte"),
    ).not.toBeChecked();
    expect(screen.queryByText(/TODAS as condições/i)).not.toBeInTheDocument();
  });

  it("pre-checks both and shows the ANY logic when editing a rule with both criteria and criteriaLogic=any", () => {
    render(
      <PriorityRuleModal
        {...baseProps}
        initial={makeRule({
          criteriaLogic: "any",
          criteria: [
            { type: "has_disability" },
            { type: "already_uses_transport" },
          ],
        })}
      />,
    );

    expect(
      screen.getByLabelText("É pessoa com deficiência (PCD)"),
    ).toBeChecked();
    expect(
      screen.getByLabelText("Já usa o sistema de transporte"),
    ).toBeChecked();
    expect(screen.getByText(/UMA das condições/i)).toBeInTheDocument();
  });
});
