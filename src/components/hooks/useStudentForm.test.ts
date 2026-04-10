import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStudentForm } from "./useStudentForm";

describe("useStudentForm", () => {
  it("deve falhar validacao quando dados obrigatorios estao ausentes", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.errors.name).toBeTruthy();
    expect(result.current.errors.email).toBeTruthy();
    expect(result.current.errors.password).toBeTruthy();
  });

  it("deve validar com sucesso quando payload de cadastro e valido", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    act(() => {
      result.current.onChange("name", "Joao Silva");
      result.current.onChange("email", "joao@test.com");
      result.current.onChange("telephone", "22999999999");
      result.current.onChange("institution", "Instituto Federal");
      result.current.onChange("shift", "diurno");
      result.current.onChange("password", "Senha123");
      result.current.onChange("confirmPassword", "Senha123");
    });

    let valid = false;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.errors.general).toBe("");
  });
});
