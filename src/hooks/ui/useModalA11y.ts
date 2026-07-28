"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared a11y behavior for hand-rolled `fixed inset-0` overlay modals that
 * don't go through the shared <Modal>: Escape-to-close, a focus trap while
 * open, initial focus on the panel, and focus restoration on close.
 *
 * Pass `open` explicitly for components the parent keeps mounted and toggles
 * via a nullable prop instead of conditionally rendering (e.g. `bus={x}`
 * rather than `{x && <Modal .../>}`), so the effect re-arms every time the
 * modal actually opens rather than only once at first mount.
 */
export function useModalA11y(
  panelRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  open: boolean = true,
) {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  // Kept fresh every render so the listener (armed only on `open` edges)
  // never calls a stale closure over onClose/loading/etc.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    // Respect an element that already grabbed focus on mount (e.g. autoFocus).
    if (!panelRef.current?.contains(document.activeElement)) {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panelRef.current)?.focus();
    }

    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
      previouslyFocusedRef.current?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
