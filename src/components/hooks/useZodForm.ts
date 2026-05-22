import { useState, useCallback } from "react";
import { z } from "zod";

export function useZodForm<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    <K extends keyof T & string>(field: K, value: T[K]) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      setErrors((prev) => ({ ...prev, [field]: "" }));
    },
    []
  );

  const validate = useCallback((): T | null => {
    const result = schema.safeParse(values);
    if (result.success) {
      setErrors({});
      return result.data;
    }
    const flat = result.error.flatten().fieldErrors as Record<
      string,
      string[] | undefined
    >;
    const fieldErrors = Object.entries(flat).reduce<Record<string, string>>(
      (acc, [field, issues]) => {
        if (Array.isArray(issues) && issues.length > 0)
          acc[field] = issues[0] ?? "Campo inválido";
        return acc;
      },
      {}
    );
    setErrors(fieldErrors);
    return null;
  }, [schema, values]);

  const setFieldError = useCallback((field: string, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    handleChange,
    validate,
    setFieldError,
    clearErrors,
    reset,
  };
}
