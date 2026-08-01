"use client"

import React from "react"
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid"
import { Sparkles, TrendingUp, ShieldCheck, Search, BarChart3, Layers } from "lucide-react"

export function IntelligenceBento() {
  return (
    <section id="platform" className="relative z-10 max-w-6xl mx-auto px-6 py-24 font-sans bg-black">
      <div className="text-center mb-16 space-y-3">
        <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
          PLATFORM ARCHITECTURE
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          Strategic Intelligence. One Platform.
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          From multi-agent parallel web research to verified executive recommendations — inspect the core engine.
        </p>
      </div>

      <BentoGrid>
        {/* Card 1: Autonomous Research */}
        <BentoGridItem
          title="Autonomous Multi-Agent Research"
          description="Planner, Researcher, Scout, Verifier, and Coordinator run in parallel, executing web searches and processing live data."
          badge="MULTI-AGENT PIPELINE"
          icon={<Sparkles className="h-5 w-5 text-white" />}
          header={
            <div className="w-full h-36 rounded-lg bg-black p-4 border border-white/10 flex flex-col justify-between font-mono text-xs">
              <div className="flex items-center justify-between text-zinc-500 border-b border-zinc-900 pb-2">
                <span>AGENT ORCHESTRATION</span>
                <span className="text-emerald-400">● 5/5 ACTIVE</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-zinc-300"><span>PLANNER</span> <span className="text-zinc-400">Research steps built</span></div>
                <div className="flex justify-between text-zinc-300"><span>RESEARCHER</span> <span className="text-zinc-400">3 parallel tool calls</span></div>
                <div className="flex justify-between text-zinc-300"><span>SCOUT</span> <span className="text-zinc-400">SERP & Browser scrapers</span></div>
              </div>
            </div>
          }
          className="md:col-span-2"
        />

        {/* Card 2: Competitive Intelligence */}
        <BentoGridItem
          title="Competitive Intelligence Signals"
          description="Detect hiring shifts, executive turnover, funding rounds, and product releases across competitor targets in real time."
          badge="COMPETITOR SIGNALS"
          icon={<TrendingUp className="h-5 w-5 text-white" />}
          header={
            <div className="w-full h-36 rounded-lg bg-black p-4 border border-white/10 flex flex-col justify-center items-center text-center">
              <span className="font-mono text-xs text-zinc-400 font-bold mb-1">ACCOUNT PULSE MODULE</span>
              <span className="text-xl font-bold text-white">Live Competitor Signals</span>
              <span className="font-mono text-[10px] text-zinc-500 mt-1">SERP + Headless Scrapers</span>
            </div>
          }
        />

        {/* Card 3: Market Telemetry */}
        <BentoGridItem
          title="Real-Time Web Telemetry"
          description="DuckDuckGo SERP APIs and Playwright headless browsers collect live public web signals without static datasets."
          badge="TELEMETRY LAYER"
          icon={<Search className="h-5 w-5 text-white" />}
          header={
            <div className="w-full h-36 rounded-lg bg-black p-4 border border-white/10 flex flex-col justify-center items-center font-mono text-xs">
              <div className="grid grid-cols-2 gap-2 w-full text-center">
                <div className="bg-zinc-900 p-2.5 rounded border border-white/10">
                  <p className="text-[10px] text-zinc-500">SERP FETCH</p>
                  <p className="font-bold text-white text-sm mt-0.5">Live SERP</p>
                </div>
                <div className="bg-zinc-900 p-2.5 rounded border border-white/10">
                  <p className="text-[10px] text-zinc-500">HEADLESS</p>
                  <p className="font-bold text-white text-sm mt-0.5">Playwright</p>
                </div>
              </div>
            </div>
          }
        />

        {/* Card 4: Verified Intelligence */}
        <BentoGridItem
          title="Evidence & Source Verification"
          description="The Verifier agent cross-checks every finding against authoritative sources, scoring confidence from 0 to 100."
          badge="VERIFICATION"
          icon={<ShieldCheck className="h-5 w-5 text-white" />}
          header={
            <div className="w-full h-36 rounded-lg bg-black p-4 border border-white/10 flex flex-col justify-center items-center text-center">
              <span className="font-mono text-3xl font-extrabold text-white">92 / 100</span>
              <span className="font-mono text-[10px] text-zinc-400 mt-1">CONFIDENCE VERIFICATION</span>
            </div>
          }
          className="md:col-span-2"
        />
      </BentoGrid>
    </section>
  )
}
