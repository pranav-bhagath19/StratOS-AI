import React from "react"
import { Target, Cpu, ShieldCheck, BarChart3 } from "lucide-react"

const STEPS = [
  {
    num: "01",
    title: "Define Objective",
    desc: "User specifies target company name, domain, or custom competitive strategy question.",
    icon: Target,
  },
  {
    num: "02",
    title: "Deploy Agents",
    desc: "Specialized AI agents execute parallel live web queries via SERP and headless browser scrapers.",
    icon: Cpu,
  },
  {
    num: "03",
    title: "Verify Intelligence",
    desc: "Web evidence is cross-checked against domain sources to compute confidence scores.",
    icon: ShieldCheck,
  },
  {
    num: "04",
    title: "Generate Strategy",
    desc: "StratOS AI compiles Market Move Scores and immediate 3-column Action Packs for executives.",
    icon: BarChart3,
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24 font-sans border-t border-white/10 bg-black">
      <div className="text-center mb-16 space-y-3">
        <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
          WORKFLOW
        </span>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How StratOS AI Operates
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          From query entry to executive report delivery in four autonomous steps.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.num} className="rounded-xl border border-white/10 bg-zinc-950 p-6 relative overflow-hidden group hover:border-white/20 transition-colors">
              <span className="font-mono text-3xl font-extrabold text-zinc-800 group-hover:text-zinc-500 transition-colors block mb-4">
                {s.num}
              </span>
              <Icon className="h-6 w-6 text-white mb-3" />
              <h3 className="text-lg font-bold text-white mb-2">{s.title}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
