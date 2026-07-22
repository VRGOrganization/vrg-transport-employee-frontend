import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const { createMock } = vi.hoisted(() => ({
  createMock: vi.fn(),
}));

vi.mock("@/services/studentService", () => ({
  studentService: { create: createMock },
}));

vi.mock("@/lib/toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { StudentCreateModal } from "./StudentCreateModal";

const baseProps = {
  open: true,
  onClose: vi.fn(),
  onCreated: vi.fn(),
};

function fillBasicStep() {
  fireEvent.change(screen.getByPlaceholderText("Maria da Silva"), {
    target: { value: "Joao Silva" },
  });
  fireEvent.change(screen.getByPlaceholderText("aluno@email.com"), {
    target: { value: "joao@email.com" },
  });
  fireEvent.change(screen.getByPlaceholderText("(22)999999999"), {
    target: { value: "22997112261" },
  });
  fireEvent.change(screen.getByPlaceholderText("12345678909"), {
    target: { value: "12345678909" },
  });
}

describe("StudentCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createMock.mockResolvedValue({ _id: "s1" });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("has only 2 steps (no Instituição step)", () => {
    render(<StudentCreateModal {...baseProps} />);
    expect(screen.getByText("Dados básicos")).toBeInTheDocument();
    expect(screen.getByText("Transporte e documentos")).toBeInTheDocument();
    expect(screen.queryByText(/institui/i)).not.toBeInTheDocument();
  });

  it("formats the telephone field as (DD)999999999", () => {
    render(<StudentCreateModal {...baseProps} />);
    const phoneInput = screen.getByPlaceholderText("(22)999999999") as HTMLInputElement;
    fireEvent.change(phoneInput, { target: { value: "22997112261111111111" } });
    expect(phoneInput.value).toBe("(22)997112261");
  });

  it("does not advance and shows errors when clicking Próximo with invalid data", () => {
    render(<StudentCreateModal {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    // ainda no passo 1 — campo de documentos pessoais (passo 2) não deve existir
    expect(screen.queryByText("Documentos pessoais (opcional)")).not.toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("never creates the student from a submit while still on the first step (Enter/implicit submission guard)", () => {
    const { container } = render(<StudentCreateModal {...baseProps} />);
    fillBasicStep();

    const form = container.querySelector("form")!;
    fireEvent.submit(form);

    expect(createMock).not.toHaveBeenCalled();
  });

  it("advances to the last step only after Próximo, without calling create", () => {
    render(<StudentCreateModal {...baseProps} />);
    fillBasicStep();
    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    expect(screen.getByText("Documentos pessoais (opcional)")).toBeInTheDocument();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("ignores an accidental second click landing on the submit button right after advancing (double-click guard)", async () => {
    vi.useFakeTimers();
    render(<StudentCreateModal {...baseProps} />);
    fillBasicStep();

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    // clique imediato (dentro da janela de cooldown) no botão que assumiu a
    // posição do "Próximo" — deve ser ignorado.
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar Estudante/i }));

    expect(createMock).not.toHaveBeenCalled();

    // após o cooldown, um clique real deve funcionar
    act(() => {
      vi.advanceTimersByTime(500);
    });
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar Estudante/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
  });

  it("submits with only the basic fields and transport/PCD flags — no institution/degree/shift/bloodType", async () => {
    vi.useFakeTimers();
    render(<StudentCreateModal {...baseProps} />);
    fillBasicStep();
    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    act(() => {
      vi.advanceTimersByTime(500);
    });
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: /Cadastrar Estudante/i }));

    await waitFor(() => expect(createMock).toHaveBeenCalledTimes(1));
    const payload = createMock.mock.calls[0][0];
    expect(payload).toEqual(
      expect.objectContaining({
        name: "Joao Silva",
        email: "joao@email.com",
        telephone: "22997112261",
        cpf: "12345678909",
        alreadyUsesTransport: false,
        hasDisability: false,
      }),
    );
    expect(payload).not.toHaveProperty("institution");
    expect(payload).not.toHaveProperty("degree");
    expect(payload).not.toHaveProperty("shift");
    expect(payload).not.toHaveProperty("bloodType");
  });
});
