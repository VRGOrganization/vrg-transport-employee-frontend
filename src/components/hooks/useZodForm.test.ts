import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { useZodForm } from "./useZodForm";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
});

describe("useZodForm", () => {
  it("validate() populates field errors and returns false without submitting", () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema,
        initialValues: { name: "", email: "" },
        onSubmit: async () => ({ success: true }),
      }),
    );

    let valid = true;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(false);
    expect(result.current.errors.name).toBeTruthy();
    expect(result.current.errors.email).toBeTruthy();
  });

  it("validate() clears errors and returns true when data is valid", () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema,
        initialValues: { name: "", email: "" },
        onSubmit: async () => ({ success: true }),
      }),
    );

    act(() => {
      result.current.setValue("name", "Joao");
      result.current.setValue("email", "joao@test.com");
    });

    let valid = false;
    act(() => {
      valid = result.current.validate();
    });

    expect(valid).toBe(true);
    expect(result.current.errors.name).toBeUndefined();
    expect(result.current.errors.email).toBeUndefined();
  });

  it("handleSubmit still validates and calls onSubmit only when valid", async () => {
    let submitted = false;
    const { result } = renderHook(() =>
      useZodForm({
        schema,
        initialValues: { name: "Joao", email: "joao@test.com" },
        onSubmit: async () => {
          submitted = true;
          return { success: true };
        },
      }),
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(submitted).toBe(true);
  });
  it("handleSubmit shows field errors returned by onSubmit next to the field", async () => {
    const { result } = renderHook(() =>
      useZodForm({
        schema,
        initialValues: { name: "Joao", email: "joao@test.com" },
        onSubmit: async () => ({
          success: false,
          error: "",
          fieldErrors: { email: "Este e-mail já está em uso" },
        }),
      }),
    );

    await act(async () => {
      await result.current.handleSubmit({ preventDefault: () => {} } as React.FormEvent);
    });

    expect(result.current.errors.email).toBe("Este e-mail já está em uso");
    expect(result.current.generalError).toBe("");
  });
});
