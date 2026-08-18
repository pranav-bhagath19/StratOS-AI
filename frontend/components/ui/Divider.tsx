"use client";

import React from "react";

interface DividerProps {
  className?: string;
  label?: string;
}

export function Divider({ className = "", label }: DividerProps) {
  if (label) {
    return (
      <div className={`relative flex items-center py-6 ${className}`}>
        <div className="flex-grow border-t border-white/10" />
        <span className="flex-shrink mx-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
          {label}
        </span>
        <div className="flex-grow border-t border-white/10" />
      </div>
    );
  }

  return <hr className={`border-0 border-t border-white/10 my-8 ${className}`} />;
}

export default Divider;
