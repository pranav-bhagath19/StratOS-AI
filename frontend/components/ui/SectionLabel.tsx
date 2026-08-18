"use client";

import React from "react";

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  showDot?: boolean;
}

export function SectionLabel({ children, className = "", showDot = true }: SectionLabelProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 font-sans text-[11px] font-semibold text-zinc-300 bg-zinc-900/80 border border-white/15 px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm ${className}`}
    >
      {showDot && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
      <span>{children}</span>
    </span>
  );
}

export default SectionLabel;
