"use client";

import { useId, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlaySpring } from "@/lib/motion";
import { useModalA11y } from "@/hooks/ui/useModalA11y";
import { ModalOverlayPortal } from "./ModalOverlayPortal";
import type { Dismissible } from "./Modal";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  side?: "left" | "right";
  dismissible?: Dismissible;
  closeOnBackdrop?: boolean;
  hideClose?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Full-width content rendered before the padded children area (e.g. gradient headers) — same escape hatch as Modal's `header`. */
  header?: ReactNode;
  /** Remove default px-6 pb-6 padding from the children wrapper — same as Modal's `noPadding`. */
  noPadding?: boolean;
}

export function Drawer({
  open,
  onClose,
  title,
  side = "right",
  dismissible = "free",
  closeOnBackdrop = false,
  hideClose = false,
  children,
  footer,
  className,
  header,
  noPadding = false,
}: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const closeOnEscape = dismissible === "free";
  const closeOnBackdropEffective = dismissible === "free" && closeOnBackdrop;
  const showClose =
    dismissible === "confirm-only" ? false : dismissible === "read-required" ? true : !hideClose;

  useModalA11y(panelRef, onClose, open, closeOnEscape);

  const offscreenX = side === "right" ? "100%" : "-100%";

  return (
    <ModalOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-drawer)] flex"
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
              initial={{ x: shouldReduceMotion ? 0 : offscreenX }}
              animate={{ x: 0 }}
              exit={{ x: shouldReduceMotion ? 0 : offscreenX }}
              transition={shouldReduceMotion ? { duration: 0 } : overlaySpring}
              className={cn(
                "h-full w-full max-w-md bg-surface-container-lowest shadow-xl flex flex-col outline-none",
                side === "right" ? "ml-auto" : "mr-auto",
                className,
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
                      aria-label="Fechar"
                      className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors ml-auto cursor-pointer"
                    >
                      <X className="size-5" />
                    </button>
                  )}
                </div>
              )}
              <div className={cn("flex-1 overflow-y-auto", !noPadding && "px-6 pb-6")}>{children}</div>
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
