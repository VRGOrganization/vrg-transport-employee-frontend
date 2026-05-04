"use client";

import React from "react";

type TransportRingProps = {
  totalUsing: number;
  totalStudents: number;
};

export function TransportRing({ totalUsing, totalStudents }: TransportRingProps) {
  const pct = totalStudents > 0 ? Math.round((totalUsing / totalStudents) * 100) : 0;
  const notUsing = totalStudents - totalUsing;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-5 mb-5">
      <div className="relative w-22 h-22 shrink-0">
        <svg
          width="88"
          height="88"
          viewBox="0 0 88 88"
          style={{ transform: "rotate(-90deg)" }}
          aria-hidden="true"
        >
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="9" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke="#378ADD" strokeWidth="9"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-tight">
          <span className="text-base font-medium text-on-surface">{pct}%</span>
          <span className="text-[10px] text-on-surface-muted">usam</span>
        </div>
      </div>
      <div>
        <p className="text-on-surface">
          <span className="text-xl font-medium">{totalUsing}</span>
          <span className="text-sm text-on-surface-muted ml-1">alunos</span>
        </p>
        <p className="text-xs text-on-surface-muted mt-0.5">utilizam o transporte</p>
        <p className="text-xs text-on-surface-muted mt-1">{notUsing} não utilizam</p>
      </div>
    </div>
  );
}
