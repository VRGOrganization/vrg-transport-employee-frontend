import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useStudentForm } from "./useStudentForm";

const fakeFile = (name: string) =>
  new File(["x"], name, { type: "image/png" });

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
    expect(result.current.errors.cpf).toBeTruthy();
  });

  it("deve validar com sucesso quando payload de cadastro e valido", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    act(() => {
      result.current.onChange("name", "Joao Silva");
      result.current.onChange("email", "joao@test.com");
      result.current.onChange("telephone", "22999999999");
      result.current.onChange("institution", "Instituto Federal");
      result.current.onChange("shift", "Manhã");
      result.current.onChange("cpf", "12345678901");
    });

    let valid = false;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.errors.general).toBe("");
  });

  it("passa sem documentos (upload é opcional no cadastro interno)", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    act(() => {
      result.current.onChange("name", "Joao Silva");
      result.current.onChange("email", "joao@test.com");
      result.current.onChange("telephone", "22999999999");
      result.current.onChange("cpf", "12345678901");
    });

    let valid = false;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.errors.documents).toBe("");
  });

  it("exige o par identidade + comprovante quando algum documento é anexado", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    act(() => {
      result.current.onChange("name", "Joao Silva");
      result.current.onChange("email", "joao@test.com");
      result.current.onChange("telephone", "22999999999");
      result.current.onChange("cpf", "12345678901");
      result.current.onChange("governmentIdFile", fakeFile("id.png"));
    });

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.errors.documents).toBeTruthy();
  });

  it("exige laudo quando PCD e carteirinha quando usa transporte", () => {
    const { result } = renderHook(() => useStudentForm({ mode: "create" }));

    act(() => {
      result.current.onChange("name", "Joao Silva");
      result.current.onChange("email", "joao@test.com");
      result.current.onChange("telephone", "22999999999");
      result.current.onChange("cpf", "12345678901");
      result.current.onChange("governmentIdFile", fakeFile("id.png"));
      result.current.onChange("proofOfResidenceFile", fakeFile("res.png"));
      result.current.onChange("hasDisability", true);
    });

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.errors.documents).toBeTruthy();
  });
});
