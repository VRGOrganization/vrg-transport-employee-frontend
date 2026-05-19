"use client";

import { useState } from "react";
import type { ZodSchema } from "zod";

function extractFieldErrors(error: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } }): Record<string, string> {
  const flat = error.flatten().fieldErrors;
  return Object.entries(flat).reduce<Record<string, string>>((acc, [field, issues]) => {
    if (Array.isArray(issues) && issues.length > 0) {
      acc[field] = issues[0] ?? "Campo inválido";
    }
    return acc;
  }, {});
}

interface UseZodFormOptions<T> {
  schema: ZodSchema<T>;
  initialValues: T;
  onSubmit: (values: T) => Promise<{ success: true } | { success: false; error: string }>;
}

interface UseZodFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T & string, string>>;
  generalError: string;
  loading: boolean;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (next: Partial<T>) => void;
  resetGeneralError: () => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useZodForm<T extends Record<string, unknown>>({
  schema,
  initialValues,
  onSubmit,
}: UseZodFormOptions<T>): UseZodFormReturn<T> {
  const [values, setAllValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T & string, string>>>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const setValue = <K extends keyof T>(key: K, value: T[K]) => {
    setAllValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key as string]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const setValues = (next: Partial<T>) => {
    setAllValues((prev) => ({ ...prev, ...next }));
  };

  const resetGeneralError = () => setGeneralError("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    const result = schema.safeParse(values);
    if (!result.success) {
      setErrors(extractFieldErrors(result.error) as Partial<Record<keyof T & string, string>>);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const outcome = await onSubmit(result.data);
      if (!outcome.success) {
        setGeneralError(outcome.error);
      }
    } finally {
      setLoading(false);
    }
  };

  return { values, errors, generalError, loading, setValue, setValues, resetGeneralError, handleSubmit };
}
