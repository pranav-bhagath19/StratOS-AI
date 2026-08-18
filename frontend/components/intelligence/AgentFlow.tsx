"use client";

import React from "react";
import { AgentName, AgentState, AGENTS } from "./AgentStatus";

interface AgentFlowProps {
  agents: Record<AgentName, AgentState>;
  className?: string;
}

export function AgentFlow({ agents, className = "" }: AgentFlowProps) {
  return (
    <div className={`w-full py-4 font-mono ${className}`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border border-white/10 bg-black p-4 rounded-xl">
        {AGENTS.map((name, index) => {
          const state = agents[name] || { status: "idle", message: "" };
          const isComplete = state.status === "complete";
          const isRunning = state.status === "running";
          const isFailed = state.status === "failed";

          return (
            <React.Fragment key={name}>
              <div className="flex-1 flex flex-col items-start sm:items-center p-3 rounded-lg border border-white/5 bg-zinc-950/60">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold ${
                      isComplete
                        ? "text-emerald-400"
                        : isRunning
                        ? "text-amber-400 animate-pulse"
                        : isFailed
                        ? "text-red-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {isComplete ? "✓" : isRunning ? "●" : isFailed ? "✕" : "○"}
                  </span>
                  <span
                    className={`text-xs font-bold tracking-wider ${
                      isComplete
                        ? "text-white"
                        : isRunning
                        ? "text-amber-300"
                        : isFailed
                        ? "text-red-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {name.toUpperCase()}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 max-w-[120px] truncate text-left sm:text-center">
                  {state.status === "idle"
                    ? "WAITING"
                    : state.status === "complete"
                    ? "COMPLETE"
                    : state.status === "running"
                    ? state.message || "ACTIVE"
                    : "FAILED"}
                </span>
              </div>
              {index < AGENTS.length - 1 && (
                <div className="hidden sm:block text-zinc-700 text-xs px-1">→</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default AgentFlow;
