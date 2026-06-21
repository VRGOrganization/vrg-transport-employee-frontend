"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";

export function createHookContext<TValue>(
  useHook: () => TValue,
  errorMessage: string,
) {
  const Context = createContext<TValue | null>(null);

  function Provider({ children }: { children: ReactNode }) {
    return createElement(Context.Provider, { value: useHook() }, children);
  }

  function useContextValue(): TValue {
    const ctx = useContext(Context);
    if (ctx === null) throw new Error(errorMessage);
    return ctx;
  }

  return { Provider, useContextValue, Context };
}
