"use client";

import { useSyncExternalStore } from "react";

// ── Tema (classe .dark no <html>) ───────────────────────────────────────────

function subscribeToDarkMode(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  return () => observer.disconnect();
}

function getIsDarkSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getIsDarkServerSnapshot() {
  return false;
}

/**
 * Observa a troca de tema. Necessário para cores calculadas em JS (a rampa de
 * ônibus, os gráficos): CSS vars sozinhas não reagem quando o valor precisa
 * ser lido em JavaScript.
 */
export function useIsDark(): boolean {
  return useSyncExternalStore(
    subscribeToDarkMode,
    getIsDarkSnapshot,
    getIsDarkServerSnapshot,
  );
}

// ── Movimento reduzido ──────────────────────────────────────────────────────

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

// `matchMedia` não existe em jsdom nem em browsers muito antigos. Sem a
// guarda, a ausência derruba a árvore inteira em vez de só perder a
// preferência de movimento.
function mediaQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(REDUCED_MOTION_QUERY)
    : null;
}

function subscribeToReducedMotion(callback: () => void) {
  const mql = mediaQuery();
  if (!mql) return () => {};
  mql.addEventListener("change", callback);
  return () => mql.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  return mediaQuery()?.matches ?? false;
}

function getReducedMotionServerSnapshot() {
  return false;
}

/** `true` quando o usuário pediu menos movimento no sistema. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );
}
