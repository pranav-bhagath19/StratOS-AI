"use client";

import React from "react";

interface AnalysisStatusProps {
  target: string;
  status: "SETUP" | "RESEARCHING" | "COMPLETE" | "FAILED";
  moduleTrack?: string;
  moduleName?: string;
  onReset?: () => void;
}

export function AnalysisStatus({
  target,
  status,
  moduleTrack,
  moduleName,
  onReset,
}: AnalysisStatusProps) {
  return (
    <div className="border border-white/10 bg-black p-6 rounded-xl flex flex-wrap items-center justify-between gap-4 font-sans">
      <div>
        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
          {moduleTrack || "STRATOS AI"} · {moduleName || "INTELLIGENCE ANALYSIS"}
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">{target}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 border border-white/10 bg-zinc-950 px-4 py-2 rounded-lg font-mono text-xs">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "RESEARCHING"
                ? "bg-amber-400 animate-pulse"
                : status === "COMPLETE"
                ? "bg-emerald-400"
                : status === "FAILED"
                ? "bg-red-400"
                : "bg-zinc-600"
            }`}
          />
          <span className="font-bold tracking-wider text-white">STATUS: {status}</span>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="font-mono text-xs text-zinc-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-2 rounded-lg transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}

export default AnalysisStatus;
