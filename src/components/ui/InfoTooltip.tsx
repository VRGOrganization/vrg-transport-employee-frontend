"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  content: string;
  ariaLabel?: string;
}

export function InfoTooltip({ content, ariaLabel = "Mais informações" }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const containerRef = useRef<HTMLSpanElement>(null);
  const hoveredRef = useRef(false);
  const focusedRef = useRef(false);
  const clickedRef = useRef(false);

  function refresh() {
    setOpen(hoveredRef.current || focusedRef.current || clickedRef.current);
  }

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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeAll();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <span
      ref={containerRef}
      className="relative inline-flex items-center"
      onMouseEnter={() => { hoveredRef.current = true; refresh(); }}
      onMouseLeave={() => { hoveredRef.current = false; refresh(); }}
    >
      <button
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
      {open && (
        <div
          id={tooltipId}
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg border border-outline-variant bg-surface-container p-2.5 text-xs text-on-surface shadow-md pointer-events-none"
        >
          {content}
        </div>
      )}
    </span>
  );
}
