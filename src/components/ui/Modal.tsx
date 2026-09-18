"use client";

import { useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlaySpring } from "@/lib/motion";
import { useModalA11y } from "@/hooks/ui/useModalA11y";
import { ModalOverlayPortal } from "./ModalOverlayPortal";

/**
 * `"free"`: ESC/backdrop/X all close (default, informational content).
 * `"confirm-only"`: closes only via an explicit action button in `footer`
 * (destructive/irreversible actions).
 * `"read-required"`: no ESC/backdrop close, but the X stays — forces a
 * deliberate dismissal without making it a destructive decision.
 */
export type Dismissible = "free" | "confirm-only" | "read-required";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "wide";
  dismissible?: Dismissible;
  /** Override for "free" mode only — the other modes force this to false. */
  closeOnBackdrop?: boolean;
  /** Override for "free" mode only — "confirm-only"/"read-required" force the X regardless. */
  hideClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  /** Full-width content rendered before the padded children area (e.g. gradient headers) */
  header?: ReactNode;
  /** Remove default px-6 pb-6 padding from the children wrapper */
  noPadding?: boolean;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  // ~60% da largura da tela, com um piso mínimo para não espremer em telas estreitas.
  wide: "max-w-[min(60vw,72rem)] min-w-[min(60vw,40rem)]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  size = "md",
  dismissible = "free",
  closeOnBackdrop = false,
  hideClose = false,
  children,
  footer,
  header,
  noPadding = false,
}: ModalProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const closeOnEscape = dismissible === "free";
  const closeOnBackdropEffective = dismissible === "free" && closeOnBackdrop;
  const showClose =
    dismissible === "confirm-only" ? false : dismissible === "read-required" ? true : !hideClose;

  useModalA11y(panelRef, onClose, open, closeOnEscape);

  return (
    <ModalOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-modal)] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={
              closeOnBackdropEffective
                ? (e) => e.target === e.currentTarget && onClose()
                : undefined
            }
          >
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95 }}
              transition={shouldReduceMotion ? { duration: 0 } : overlaySpring}
              className={cn(
                "bg-surface-container-lowest rounded-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto flex flex-col outline-none",
                SIZE_CLASSES[size],
              )}
            >
              {header}
              {(title || showClose) && (
                <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                  {title && (
                    <h2 id={titleId} className="font-headline font-semibold text-lg text-on-surface flex-1">
                      {title}
                    </h2>
                  )}
                  {showClose && (
                    <button
                      onClick={onClose}
                      aria-label="Fechar modal"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors ml-auto cursor-pointer"
                    >
                      <X className="size-5" />
                    </button>
                  )}
                </div>
              )}
              <div className={cn("flex-1", !noPadding && "px-6 pb-6")}>{children}</div>
              {footer && (
                <div className="px-6 pb-6 pt-2 border-t border-outline-variant/30 shrink-0">
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalOverlayPortal>
  );
}
