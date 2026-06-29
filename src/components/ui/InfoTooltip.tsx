"use client";

import { useEffect, useId, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  ariaLabel?: string;
}

interface TooltipPos {
  top: number;
  left: number;
}

export function InfoTooltip({ content, ariaLabel = "Mais informações" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<TooltipPos | null>(null);
  const tooltipId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const clickedRef = useRef(false);

  const reposition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + window.scrollY - 8,
      left: rect.left + window.scrollX + rect.width / 2,
    });
  }, []);

  const refresh = useCallback(() => {
    const shouldOpen = hoveredRef.current || focusedRef.current || clickedRef.current;
    if (shouldOpen) reposition();
    setOpen(shouldOpen);
  }, [reposition]);

  function closeAll() {
    hoveredRef.current = false;
    focusedRef.current = false;
    clickedRef.current = false;
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }

    function handleClickOutside(e: MouseEvent) {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }

    function handleScroll() {
      reposition();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [open, reposition]);

  const tooltip =
    open && pos
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            style={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              zIndex: 99999,
            }}
            className="w-64 rounded-lg border border-outline-variant bg-white dark:bg-neutral-900 p-2.5 text-xs text-neutral-800 dark:text-neutral-100 shadow-lg pointer-events-none"
          >
            {content}
            {/* seta */}
            <span
              style={{ left: "50%", transform: "translateX(-50%)" }}
              className="absolute top-full border-4 border-transparent border-t-white dark:border-t-neutral-900"
            />
          </div>,
          document.body,
        )
      : null;

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => { hoveredRef.current = true; refresh(); }}
      onMouseLeave={() => { hoveredRef.current = false; refresh(); }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={ariaLabel}
        aria-describedby={open ? tooltipId : undefined}
        className="inline-flex items-center justify-center rounded-full p-0.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
        onClick={() => { clickedRef.current = !clickedRef.current; refresh(); }}
        onFocus={() => { focusedRef.current = true; refresh(); }}
        onBlur={() => { focusedRef.current = false; refresh(); }}
      >
        <Info className="size-3.5" aria-hidden="true" />
      </button>
      {tooltip}
    </span>
  );
}
