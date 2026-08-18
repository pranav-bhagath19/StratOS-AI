"use client";

import React from "react";
import Link from "next/link";

interface StratosBrandProps {
  className?: string;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StratosBrand({ className = "", showTagline = false, size = "md" }: StratosBrandProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-7 h-7",
    lg: "w-9 h-9",
  };

  const textSizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 group cursor-pointer ${className}`}>
      {/* Radar Target Mark SVG (Matching provided logo image) */}
      <svg
        viewBox="0 0 100 100"
        className={`${iconSizes[size]} text-white shrink-0 transition-transform duration-200 group-hover:scale-105`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Crosshair Ticks */}
        <line x1="50" y1="10" x2="50" y2="20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="50" y1="80" x2="50" y2="90" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="10" y1="50" x2="20" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        <line x1="80" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />

        {/* Outer Concentric Circle (with gaps at ticks) */}
        <path
          d="M 50 18 A 32 32 0 1 1 18 50"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <path
          d="M 18 50 A 32 32 0 0 1 50 18"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
        />
        <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="4" fill="none" />

        {/* Middle Concentric Circle */}
        <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="3.5" fill="none" />

        {/* Center Target Dot & Circle */}
        <circle cx="50" cy="50" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <circle cx="50" cy="50" r="4" fill="currentColor" />

        {/* Top-Right Radar Sweep Wedge Slice */}
        <path
          d="M 50 50 L 52 18 A 32 32 0 0 1 82 32 Z"
          fill="#3b82f6"
          opacity="0.9"
        />

        {/* Radar Signal Dot */}
        <circle cx="70" cy="40" r="3.5" fill="#3b82f6" />
      </svg>

      {/* Brand Text */}
      <div className="flex items-baseline font-sans font-bold tracking-tight">
        <span className={`${textSizes[size]} text-white font-extrabold`}>
          StratOS
        </span>
        <span className={`${textSizes[size]} text-blue-400 font-extrabold ml-1.5`}>
          AI
        </span>
      </div>

      {showTagline && (
        <span className="hidden sm:inline-block font-mono text-[10px] text-zinc-500 tracking-widest uppercase border-l border-zinc-800 pl-3">
          STRATEGIC INTELLIGENCE
        </span>
      )}
    </Link>
  );
}

export default StratosBrand;
