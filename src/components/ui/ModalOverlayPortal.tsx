"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { useHasMounted } from "@/hooks/useHasMounted";

/**
 * Renders straight into `document.body`. Dashboard pages sit inside an
 * animated `motion.div` during route transitions, which while animating has
 * `transform`/`opacity` set and therefore creates a stacking context — an
 * overlay declared inside it would get trapped there instead of anchoring to
 * the viewport. Escaping to the body removes that window of risk entirely.
 */
export function ModalOverlayPortal({ children }: { children: ReactNode }) {
  const mounted = useHasMounted();

  if (!mounted) return null;

  return createPortal(children, document.body);
}
