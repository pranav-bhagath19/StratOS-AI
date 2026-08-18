"use client";

import React from "react";

interface IntelligenceSignalProps {
  title: string;
  category?: string;
  timestamp?: string;
  source?: string;
}

export function IntelligenceSignal({
  title,
  category = "Signal",
  timestamp,
  source,
}: IntelligenceSignalProps) {
  return (
    <div className="border-b border-white/10 py-3 flex flex-wrap items-center justify-between gap-3 font-sans hover:bg-zinc-950/40 px-2 transition-colors">
      <div className="space-y-0.5">
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider block">
          {category}
        </span>
        <p className="text-sm font-semibold text-zinc-200">{title}</p>
      </div>

      {(timestamp || source) && (
        <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-3">
          {source && <span>{source}</span>}
          {timestamp && <span>{timestamp}</span>}
        </div>
      )}
    </div>
  );
}

export default IntelligenceSignal;
