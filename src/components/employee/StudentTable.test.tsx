import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudentTable, type Student } from "./StudentTable";

function buildStudents(count: number): Student[] {
  return Array.from({ length: count }, (_, idx) => ({
    _id: `student-${idx + 1}`,
    name: `Aluno ${idx + 1}`,
    email: `aluno${idx + 1}@teste.com`,
    registrationId: `MAT${1000 + idx}`,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

describe("StudentTable", () => {
  it("deve renderizar estados de loading e vazio", () => {
    const onDeleted = vi.fn();

    const { rerender } = render(
      <StudentTable students={[]} loading onDeleted={onDeleted} />,
    );

    expect(screen.queryByText("Nenhum aluno ativo encontrado.")).not.toBeInTheDocument();

    rerender(<StudentTable students={[]} loading={false} onDeleted={onDeleted} />);

    expect(screen.getByText("Nenhum aluno ativo encontrado.")).toBeInTheDocument();
  });

  it("deve disparar acao critica de desativar aluno", async () => {
    const onDeleted = vi.fn();

    render(<StudentTable students={buildStudents(1)} loading={false} onDeleted={onDeleted} />);

    await userEvent.click(screen.getByTitle("Desativar"));
    expect(onDeleted).toHaveBeenCalledWith("student-1");
  });

  it("deve manter navegacao por teclado basica", async () => {
    render(<StudentTable students={buildStudents(2)} loading={false} onDeleted={vi.fn()} />);

    await userEvent.tab();
    expect(screen.getByRole("link", { name: /novo aluno/i })).toHaveFocus();

    await userEvent.tab();
    expect(document.activeElement?.tagName).toBe("BUTTON");
  });

  it("deve permitir paginacao manual", () => {
    render(<StudentTable students={buildStudents(8)} loading={false} onDeleted={vi.fn()} />);

    expect(screen.getByText("Aluno 1")).toBeInTheDocument();
    expect(screen.queryByText("Aluno 6")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "2" }));

    expect(screen.getByText("Aluno 6")).toBeInTheDocument();
    expect(screen.queryByText("Aluno 1")).not.toBeInTheDocument();
  });
});
