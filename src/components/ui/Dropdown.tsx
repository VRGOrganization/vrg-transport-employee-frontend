"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useClickOutside } from "@/hooks/ui/useClickOutside";
import { ModalOverlayPortal } from "./ModalOverlayPortal";

interface DropdownProps {
  /** A function form receives whether the menu is open, for triggers that reflect it (ring highlight, chevron rotation). */
  trigger: ReactNode | ((open: boolean) => ReactNode);
  children: ReactNode;
  align?: "start" | "end";
  className?: string;
  menuClassName?: string;
  /** Menu takes the trigger's exact width instead of its own intrinsic/min width (e.g. a select-like dropdown). */
  matchTriggerWidth?: boolean;
}

interface Position {
  top: number;
  left?: number;
  right?: number;
  width?: number;
}

export function Dropdown({
  trigger,
  children,
  align = "start",
  className,
  menuClassName,
  matchTriggerWidth = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const recomputePosition = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = matchTriggerWidth ? rect.width : undefined;
    setPosition(
      align === "end"
        ? { top: rect.bottom + 4, right: window.innerWidth - rect.right, width }
        : { top: rect.bottom + 4, left: rect.left, width },
    );
  };

  useLayoutEffect(() => {
    if (!open) return;
    recomputePosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("resize", recomputePosition);
    window.addEventListener("scroll", recomputePosition, true);
    return () => {
      window.removeEventListener("resize", recomputePosition);
      window.removeEventListener("scroll", recomputePosition, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  // A trigger click and the outside-click handler fire on the same mousedown
  // → click sequence; closing here with a plain `false` and toggling the
  // trigger with a functional update lets a click back on the trigger reopen
  // the menu instead of leaving it stuck closed.
  useClickOutside(menuRef, () => setOpen(false), open);

  return (
    <>
      <div
        ref={anchorRef}
        onClick={() => setOpen((v) => !v)}
        className={cn("inline-block", className)}
      >
        {typeof trigger === "function" ? trigger(open) : trigger}
      </div>
      <ModalOverlayPortal>
        <AnimatePresence>
          {open && position && (
            <motion.div
              ref={menuRef}
              role="menu"
              style={{
                position: "fixed",
                top: position.top,
                left: position.left,
                right: position.right,
                width: position.width,
              }}
              className={cn(
                "z-[var(--z-dropdown)] min-w-44 rounded-xl bg-surface-container-lowest ring-1 ring-outline/30 shadow-xl p-1",
                menuClassName,
              )}
              initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
              onClick={() => setOpen(false)}
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </ModalOverlayPortal>
    </>
  );
}
