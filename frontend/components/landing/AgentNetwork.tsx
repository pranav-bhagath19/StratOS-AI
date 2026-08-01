"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle2, Cpu, Globe, Search, ShieldCheck, Sparkles } from "lucide-react"

const AGENTS = [
  {
    name: "PLANNER",
    role: "Step Decomposition",
    desc: "Deconstructs intelligence target into research goals and tool query execution plan.",
    icon: Sparkles,
  },
  {
    name: "RESEARCHER",
    role: "Parallel Dispatcher",
    desc: "Orchestrates swappable web search and scraping tools in parallel.",
    icon: Search,
  },
  {
    name: "SCOUT",
    role: "Web Signal Scraper",
    desc: "Executes DuckDuckGo queries and renders web pages via headless Playwright browser.",
    icon: Globe,
  },
  {
    name: "VERIFIER",
    role: "Evidence Assessor",
    desc: "Cross-checks scraped web findings against domain sources to compute confidence scores.",
    icon: ShieldCheck,
  },
  {
    name: "COORDINATOR",
    role: "Strategic Synthesizer",
    desc: "Compiles verified findings into Market Move Scores and 3-column Action Packs.",
    icon: Cpu,
  },
]

export function AgentNetwork() {
  const [activeAgent, setActiveAgent] = useState<number>(0)

  return (
    <section id="intelligence" className="relative z-10 max-w-6xl mx-auto px-6 py-24 font-sans bg-black">
      <div className="text-center mb-16 space-y-3">
        <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
          MULTI-AGENT NETWORK
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          5-Agent Execution Pipeline
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          Hover over any agent node to inspect its specific role in the autonomous synthesis pipeline.
        </p>
      </div>

      {/* Pipeline Diagram Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-8">
        {AGENTS.map((agent, i) => {
          const Icon = agent.icon
          const isActive = activeAgent === i
          return (
            <div
              key={agent.name}
              onMouseEnter={() => setActiveAgent(i)}
              className="cursor-pointer"
            >
              <div
                className={`h-full rounded-xl border p-4 transition-all duration-200 bg-zinc-950 ${
                  isActive
                    ? "border-white/40 bg-zinc-900 shadow-xl"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-zinc-500"}`} />
                  <span className="font-mono text-[10px] text-zinc-600">0{i + 1}</span>
                </div>

                <p className="font-mono text-xs font-bold text-white mb-1">{agent.name}</p>
                <p className="font-mono text-[10px] text-zinc-500 truncate mb-2">{agent.role}</p>

                <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>READY</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Agent Detail Focus Box */}
      <div className="rounded-xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <span className="font-mono text-xs font-bold text-white border border-white/20 bg-zinc-900 px-3 py-1 rounded">
            AGENT 0{activeAgent + 1} // {AGENTS[activeAgent].name}
          </span>
          <div>
            <h3 className="text-base font-bold text-white mb-1">{AGENTS[activeAgent].role}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">
              {AGENTS[activeAgent].desc}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
