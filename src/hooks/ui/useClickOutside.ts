"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Calls `onOutside` when a mousedown/touchstart lands outside `ref`'s
 * element. Listens for both events (not just click) so it also catches a
 * press-and-drag that starts outside and ends inside, and fires before the
 * browser's own click/focus handling on the target — closing a menu before
 * whatever was clicked reacts to it.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  enabled: boolean = true,
) {
  const onOutsideRef = useRef(onOutside);
  onOutsideRef.current = onOutside;

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onOutsideRef.current();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
    // `ref` is a stable object across renders — omitted on purpose, same as
    // the callback ref pattern above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
