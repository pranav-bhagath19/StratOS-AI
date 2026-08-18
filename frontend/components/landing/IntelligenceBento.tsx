"use client";

import React from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Divider } from "@/components/ui/Divider";

export function IntelligenceBento() {
  return (
    <section id="platform" className="relative max-w-5xl mx-auto px-6 py-10 font-sans">
      {/* Section Header */}
      <div className="text-center mb-8 space-y-2">
        <SectionLabel>PLATFORM ARCHITECTURE</SectionLabel>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Strategic Intelligence Engine.
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          From multi-agent parallel web research to verified executive recommendations.
        </p>
      </div>

      {/* Hero Feature 1: Multi-Agent Pipeline (Asymmetric Hero Block) */}
      <div className="border border-white/10 bg-black p-6 sm:p-8 rounded-2xl space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              01 // ORCHESTRATION PIPELINE
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              Autonomous Multi-Agent Engine
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Planner, Researcher, Scout, Verifier, and Coordinator execute in parallel to formulate research goals, mine public web telemetry, and synthesize briefs.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 border border-white/20 bg-white/5 px-3.5 py-1.5 rounded-full text-zinc-200 text-xs font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            5/5 AGENTS ACTIVE
          </div>
        </div>

        {/* Clean Agent Pipeline Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 font-sans text-xs">
          {[
            { step: "01", name: "PLANNER", action: "Deconstructs Goals" },
            { step: "02", name: "RESEARCHER", action: "Dispatches Queries" },
            { step: "03", name: "SCOUT", action: "Renders Web DOM" },
            { step: "04", name: "VERIFIER", action: "Cross-Checks Evidence" },
            { step: "05", name: "COORDINATOR", action: "Synthesizes Brief" },
          ].map((agent) => (
            <div
              key={agent.name}
              className="border border-white/10 bg-zinc-950 p-3 rounded-xl space-y-1 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold">
                <span>{agent.step}</span>
                <span className="text-blue-400">●</span>
              </div>
              <p className="font-extrabold text-white text-xs">{agent.name}</p>
              <p className="text-[10px] text-zinc-400">{agent.action}</p>
            </div>
          ))}
        </div>
      </div>

      <Divider className="my-8" />

      {/* 3-Column Editorial Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start text-left">
        {/* Column 1: Signal Mining */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              02 // COMPETITOR PULSE
            </span>
            <h4 className="text-lg font-bold text-white">Signal Mining & Detection</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Detect hiring shifts, executive turnover, funding events, and product releases across competitor targets.
          </p>

          <div className="border-t border-white/10 pt-2.5 space-y-1.5 text-xs font-sans">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-300 font-medium">Pricing page delta</span>
              <span className="text-blue-400 text-[10px] font-bold">DETECTED</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-t border-white/5">
              <span className="text-zinc-300 font-medium">Executive hire update</span>
              <span className="text-blue-400 text-[10px] font-bold">VERIFIED</span>
            </div>
          </div>
        </div>

        {/* Column 2: Web Telemetry Layer */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              03 // TELEMETRY LAYER
            </span>
            <h4 className="text-lg font-bold text-white">Live Web Scrapers & SERP</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            DuckDuckGo SERP APIs and Playwright headless browsers collect live public web signals without static mock datasets.
          </p>

          <div className="border-t border-white/10 pt-2.5 space-y-1.5 text-xs font-sans">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-zinc-300 font-medium">SERP Query Engine</span>
              <span className="text-zinc-400 text-[10px]">DuckDuckGo</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-t border-white/5">
              <span className="text-zinc-300 font-medium">Headless Renderer</span>
              <span className="text-zinc-400 text-[10px]">Playwright DOM</span>
            </div>
          </div>
        </div>

        {/* Column 3: Verification & Confidence */}
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              04 // VERIFICATION
            </span>
            <h4 className="text-lg font-bold text-white">Zero-Speculation Evidence</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            The Verifier agent cross-checks scraped evidence against primary domain sources, scoring confidence from 0 to 100.
          </p>

          <div className="border-t border-white/10 pt-2.5 flex items-baseline justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase">CONFIDENCE VERIFICATION</span>
            <span className="text-3xl font-extrabold text-white">94 / 100</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default IntelligenceBento;
