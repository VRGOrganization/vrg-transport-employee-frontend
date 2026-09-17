"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Como a fila de carteirinhas é recortada: por faculdade ou por ônibus. */
export type QueueViewMode = "university" | "bus";

export const QUEUE_VIEW_STORAGE_KEY = "cards:queueView";

// Por ônibus é o padrão; por faculdade é opcional.
const DEFAULT_MODE: QueueViewMode = "bus";

const listeners = new Set<() => void>();
// Usado só quando o navegador bloqueia o armazenamento: a escolha vale na aba.
let memoryMode: QueueViewMode = DEFAULT_MODE;

function isQueueViewMode(value: unknown): value is QueueViewMode {
  return value === "university" || value === "bus";
}

function readMode(): QueueViewMode {
  try {
    const saved = window.localStorage.getItem(QUEUE_VIEW_STORAGE_KEY);
    return isQueueViewMode(saved) ? saved : DEFAULT_MODE;
  } catch {
    return memoryMode;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/**
 * Preferência de visão da fila, guardada só no navegador de quem usa.
 * No servidor vale a visão padrão, para não divergir do HTML hidratado.
 */
export function useQueueViewMode(): [QueueViewMode, (mode: QueueViewMode) => void] {
  const mode = useSyncExternalStore(subscribe, readMode, () => DEFAULT_MODE);

  const changeMode = useCallback((next: QueueViewMode) => {
    memoryMode = next;
    try {
      window.localStorage.setItem(QUEUE_VIEW_STORAGE_KEY, next);
    } catch {
      // armazenamento indisponível: fica em memória nesta aba
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [mode, changeMode];
}
