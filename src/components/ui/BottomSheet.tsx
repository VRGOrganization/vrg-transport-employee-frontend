"use client";

import { useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/ui/useTheme";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { overlaySpring } from "@/lib/motion";
import { useModalA11y } from "@/hooks/ui/useModalA11y";
import { ModalOverlayPortal } from "./ModalOverlayPortal";
import type { Dismissible } from "./Modal";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: LucideIcon;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  dismissible?: Dismissible;
  closeOnOverlay?: boolean;
  hideClose?: boolean;
  maxWidth?: string;
  className?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  icon: Icon,
  description,
  children,
  actions,
  dismissible = "free",
  closeOnOverlay = false,
  hideClose = false,
  maxWidth = "max-w-md",
  className,
}: BottomSheetProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  const closeOnEscape = dismissible === "free";
  const closeOnBackdropEffective = dismissible === "free" && closeOnOverlay;
  const showClose =
    dismissible === "confirm-only" ? false : dismissible === "read-required" ? true : !hideClose;

  useModalA11y(panelRef, onClose, open, closeOnEscape);

  return (
    <ModalOverlayPortal>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[var(--z-drawer)] flex items-end justify-center p-0 sm:p-4"
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
              initial={{ y: shouldReduceMotion ? 0 : "100%" }}
              animate={{ y: 0 }}
              exit={{ y: shouldReduceMotion ? 0 : "100%" }}
              transition={shouldReduceMotion ? { duration: 0 } : overlaySpring}
              className={cn(
                "relative bg-surface-container-lowest rounded-t-2xl shadow-xl w-full max-h-[90vh] overflow-y-auto outline-none",
                maxWidth,
                className,
              )}
            >
              {showClose && (
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors z-10"
                  aria-label="Fechar modal"
                >
                  <X className="size-5" />
                </button>
              )}

              {(title || Icon) && (
                <div className="flex items-center gap-3 px-6 pt-6 pb-4 pr-12">
                  {Icon && (
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="size-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2 id={titleId} className="font-headline font-semibold text-lg text-on-surface leading-tight">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p className="text-sm text-on-surface-variant mt-0.5">{description}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="px-6 pb-6">{children}</div>

              {actions && <div className="px-6 pb-6 pt-0">{actions}</div>}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalOverlayPortal>
  );
}
