"use client";

import React, { useState } from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";

const AGENTS = [
  {
    name: "PLANNER",
    role: "Step Decomposition",
    desc: "Deconstructs intelligence targets into explicit research goals and step execution plans.",
  },
  {
    name: "RESEARCHER",
    role: "Parallel Dispatcher",
    desc: "Orchestrates parallel search queries and web scraping workflows.",
  },
  {
    name: "SCOUT",
    role: "Web Telemetry Scraper",
    desc: "Executes live SERP queries and renders web pages via headless Playwright browser.",
  },
  {
    name: "VERIFIER",
    role: "Evidence Assessor",
    desc: "Cross-checks scraped findings against primary sources to calculate verification scores.",
  },
  {
    name: "COORDINATOR",
    role: "Strategic Synthesizer",
    desc: "Compiles verified intelligence into Market Move Scores and executive action packs.",
  },
];

export function AgentNetwork() {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section id="intelligence" className="relative max-w-5xl mx-auto px-6 py-10 font-sans">
      <div className="text-center mb-8 space-y-2">
        <SectionLabel>MULTI-AGENT PIPELINE</SectionLabel>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          5-Agent Autonomous Flow
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Structured linear multi-agent workflow for verified competitive intelligence.
        </p>
      </div>

      {/* Clean Technical Flow Bar */}
      <div className="border border-white/10 bg-black p-4 rounded-xl mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 font-mono text-xs">
          {AGENTS.map((agent, i) => {
            const isActive = activeIdx === i;
            return (
              <button
                key={agent.name}
                onClick={() => setActiveIdx(i)}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  isActive
                    ? "border-white/30 bg-zinc-900 text-white"
                    : "border-white/5 bg-zinc-950/60 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-1">
                  <span>0{i + 1}</span>
                  <span className={isActive ? "text-blue-400" : "text-zinc-600"}>
                    {isActive ? "ACTIVE" : "READY"}
                  </span>
                </div>
                <span className="font-bold tracking-wider block">{agent.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Agent Detail Panel */}
      <div className="border border-white/10 bg-black p-5 rounded-xl space-y-2 font-mono">
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-500 uppercase tracking-wider">
            AGENT 0{activeIdx + 1}
          </span>
          <span className="text-xs text-white font-bold tracking-widest border-l border-zinc-800 pl-3">
            {AGENTS[activeIdx].name}
          </span>
        </div>
        <h3 className="text-base font-extrabold text-white font-sans">{AGENTS[activeIdx].role}</h3>
        <p className="text-xs text-zinc-400 font-sans leading-relaxed">
          {AGENTS[activeIdx].desc}
        </p>
      </div>
    </section>
  );
}

export default AgentNetwork;
