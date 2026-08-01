"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Activity, ChevronRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[85vh] pt-32 sm:pt-40 pb-20 px-6 flex flex-col items-center justify-center text-center overflow-hidden font-sans bg-black">
      {/* Background Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Agent Status Badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-block mb-6 relative z-10"
      >
        <div className="font-mono text-[11px] text-zinc-300 border border-white/10 bg-zinc-950 px-4 py-1.5 rounded-full tracking-wider inline-flex items-center gap-2 shadow-sm">
          <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
          5 AUTONOMOUS AGENTS STANDING BY
        </div>
      </motion.div>

      {/* Main Display Headline — SOLID WHITE, NO GRADIENT TEXT */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative z-10 text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08] mb-6 max-w-4xl"
      >
        Strategic Intelligence. <br className="hidden sm:block" />
        Powered by Autonomous AI.
      </motion.h1>

      {/* Supporting Subhead */}
      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative z-10 text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
      >
        Research competitors, track market signals, verify intelligence, and turn real-time public information into actionable strategy.
      </motion.p>

      {/* Action CTAs — Reference Image 2 Button System */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="relative z-10 flex flex-wrap justify-center items-center gap-4 mb-16"
      >
        <Button asChild variant="primary" size="lg">
          <Link href="/dashboard" className="flex items-center gap-2">
            Start Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button asChild variant="secondary" size="lg">
          <Link href="#platform" className="flex items-center gap-2">
            Explore Platform
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </Link>
        </Button>
      </motion.div>

      {/* Real Product Visual Preview Composition */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="relative z-10 w-full max-w-5xl mx-auto rounded-2xl border border-white/10 bg-zinc-950 p-4 sm:p-6 shadow-2xl overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-5 px-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="w-3 h-3 rounded-full bg-zinc-800" />
            <span className="font-mono text-xs text-zinc-500 ml-2">stratos-console // target: anthropic.com</span>
          </div>
          <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded">
            ✓ COMPLETED · CONFIDENCE 92/100
          </span>
        </div>

        {/* Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left font-sans">
          <div className="border border-white/10 bg-black p-5 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-zinc-500 tracking-wider">RECOMMENDED MOVE</span>
              <span className="bg-red-500/10 border border-red-500/40 text-red-400 font-mono text-xs font-bold px-2 py-0.5 rounded">
                ATTACK
              </span>
            </div>
            <div className="space-y-1">
              <span className="font-mono text-xs text-zinc-300 font-bold">Market Score: 85/100</span>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Enterprise AI competitor introduced specialized Claude 3.5 Sonnet tier. Immediate displacement positioning recommended.
              </p>
            </div>
          </div>

          <div className="border border-white/10 bg-black p-5 rounded-xl space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] text-zinc-500 tracking-wider">5-AGENT TELEMETRY</span>
              <span className="font-mono text-[9px] text-zinc-400">LANGGRAPH</span>
            </div>
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-emerald-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> PLANNER</span><span className="text-[10px] text-zinc-500">2 tool steps</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> RESEARCHER</span><span className="text-[10px] text-zinc-500">3 parallel calls</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> SCOUT</span><span className="text-[10px] text-zinc-500">SERP & Browser</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> VERIFIER</span><span className="text-[10px] text-zinc-500">Cross-checked</span></div>
              <div className="flex items-center justify-between text-emerald-400"><span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> COORDINATOR</span><span className="text-[10px] text-zinc-500">Brief ready</span></div>
            </div>
          </div>

          <div className="border border-white/10 bg-black p-5 rounded-xl space-y-3">
            <span className="font-mono text-[10px] text-zinc-500 tracking-wider block">ACTION PACK</span>
            <ul className="space-y-2 text-xs text-zinc-300 font-sans">
              <li className="flex items-start gap-2">
                <span className="font-mono text-red-400 font-bold">→</span>
                <span>Deploy targeted enterprise pricing deck</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-amber-400 font-bold">→</span>
                <span>Alert GTM team on security compliance gap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-mono text-sky-400 font-bold">→</span>
                <span>Track developer portal updates weekly</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
