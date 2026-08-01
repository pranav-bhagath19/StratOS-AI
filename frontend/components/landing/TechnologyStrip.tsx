import React from "react"
import { Globe, Database, Cpu, Zap, Sparkles, Terminal, Code2, Layers } from "lucide-react"

const TECHNOLOGIES = [
  { name: "LangGraph Multi-Agent", icon: Sparkles },
  { name: "OpenRouter LLMs", icon: Cpu },
  { name: "DuckDuckGo SERP", icon: Globe },
  { name: "Playwright Headless", icon: Zap },
  { name: "Firebase Cloud", icon: Database },
  { name: "FastAPI Engine", icon: Terminal },
  { name: "Next.js App Router", icon: Layers },
  { name: "Python 3.12 Core", icon: Code2 },
]

export function TechnologyStrip() {
  return (
    <section className="relative z-10 border-y border-white/10 bg-black py-10 px-6 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <p className="font-mono text-[10px] text-zinc-500 tracking-widest text-center uppercase">
          BUILT WITH MODERN INTELLIGENCE INFRASTRUCTURE
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          {TECHNOLOGIES.map(({ name, icon: TechIcon }) => (
            <div
              key={name}
              className="flex items-center gap-2 font-mono text-xs text-zinc-300 bg-zinc-950 border border-white/10 px-4 py-2.5 rounded-xl hover:border-white/20 transition-colors"
            >
              <TechIcon className="h-4 w-4 text-zinc-400" />
              <span>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
