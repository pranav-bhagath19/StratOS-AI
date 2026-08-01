"use client"

import React from "react"
import { motion } from "framer-motion"
import { ChevronRight, Loader2, Globe, Sparkles } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

export type AnalysisType = "account_pulse" | "supplier_watch" | "threat_surface"

export type Preset = {
  track: string
  title: string
  analysis: AnalysisType
  target: string
  tagline: string
}

export type AnalysisModule = {
  type: AnalysisType
  track: string
  name: string
  description: string
  tools: string[]
}

export function AnalysisInput({
  selected,
  onSelect,
  target,
  onTargetChange,
  onDeploy,
  onPresetDeploy,
  isDeploying,
  presets,
  modules,
}: {
  selected: AnalysisType
  onSelect: (t: AnalysisType) => void
  target: string
  onTargetChange: (v: string) => void
  onDeploy: () => void
  onPresetDeploy: (target: string, analysisType: AnalysisType) => void
  isDeploying: boolean
  presets: Preset[]
  modules: AnalysisModule[]
}) {
  return (
    <div className="space-y-10 font-sans">
      {/* Console Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="font-mono text-[10px] text-zinc-300 border-white/10 bg-zinc-950">
            COMMAND CONSOLE
          </Badge>
          <span className="font-mono text-[10px] text-zinc-500 tracking-wider">DEPLOY ANALYSIS PIPELINE</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">StratOS AI Workspace</h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-xl">
          Select a one-tap preset target or configure a custom analysis query to run the 5-agent pipeline.
        </p>
      </div>

      {/* Demo Preset Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-xs text-zinc-400 font-semibold tracking-wider">
            DEMO PRESETS — ONE-TAP LIVE TARGETS
          </p>
          <span className="font-mono text-[10px] text-zinc-500">Live Agent Execution</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presets.map((p, i) => (
            <motion.button
              key={p.target}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.05 }}
              onClick={() => !isDeploying && onPresetDeploy(p.target, p.analysis)}
              disabled={isDeploying}
              className="text-left group"
            >
              <Card
                className={`h-full border bg-zinc-950 p-5 transition-all duration-200 ${
                  isDeploying
                    ? "opacity-50 cursor-not-allowed border-white/10"
                    : "hover:border-white/30 border-white/10 cursor-pointer shadow-lg"
                }`}
              >
                <CardHeader className="p-0 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="font-mono text-[9px] text-zinc-400 border-white/10 bg-zinc-900">
                      {p.track}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg font-bold text-white group-hover:text-zinc-300 transition-colors">
                    {p.title}
                  </CardTitle>
                  <p className="font-mono text-[10px] text-zinc-500 tracking-wider">
                    {p.analysis.toUpperCase().replace("_", " ")}
                  </p>
                </CardHeader>

                <CardContent className="p-0 mb-4">
                  <p className="text-xs text-zinc-400 italic leading-relaxed">
                    &ldquo;{p.tagline}&rdquo;
                  </p>
                </CardContent>

                <CardFooter className="p-0 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-400 group-hover:text-white transition-colors flex items-center gap-1">
                    Deploy agents
                    <ChevronRight className="h-3 w-3" />
                  </span>
                  <Sparkles className="h-3.5 w-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                </CardFooter>
              </Card>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-white/10" />
        <span className="font-mono text-xs text-zinc-500 tracking-widest uppercase">
          OR CONFIGURE CUSTOM TARGET
        </span>
        <div className="flex-1 h-px bg-white/10" />
      </div>

      {/* Module Selector */}
      <div className="space-y-3">
        <p className="font-mono text-xs text-zinc-400 font-semibold tracking-wider">SELECT ANALYSIS TYPE</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modules.map((m) => (
            <button key={m.type} onClick={() => onSelect(m.type)} className="text-left">
              <Card
                className={`h-full border p-5 transition-all duration-200 ${
                  selected === m.type
                    ? "border-white/40 bg-zinc-900 shadow-xl"
                    : "border-white/10 bg-zinc-950 hover:border-white/20"
                }`}
              >
                <CardHeader className="p-0 mb-3">
                  <Badge variant="outline" className="font-mono text-[9px] text-zinc-400 border-white/10 bg-zinc-900 mb-2 w-fit">
                    {m.track}
                  </Badge>
                  <CardTitle className="text-base font-bold text-white">{m.name}</CardTitle>
                </CardHeader>
                <CardContent className="p-0 mb-4">
                  <CardDescription className="text-xs text-zinc-400 leading-relaxed">
                    {m.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="p-0 pt-2 border-t border-white/10 flex flex-wrap gap-1.5">
                  {m.tools.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="font-mono text-[9px] text-zinc-400 border-white/10 bg-zinc-900 px-2 py-0.5"
                    >
                      {t}
                    </Badge>
                  ))}
                </CardFooter>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Command Query Input Bar */}
      <Card className="border border-white/10 bg-zinc-950 shadow-2xl">
        <CardHeader className="border-b border-white/10 px-6 py-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-white" />
            <span className="font-mono text-xs font-semibold text-zinc-300 tracking-wider">
              TARGET SPECIFICATION
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onDeploy()}
            placeholder="Company name, domain, or ticker — e.g. OpenAI or Wix.com"
            className="flex-1 bg-black border-white/10 font-mono text-sm text-white placeholder-zinc-600 focus-visible:ring-zinc-400 h-11"
          />
          <button
            onClick={onDeploy}
            disabled={isDeploying}
            className="px-6 h-11 bg-white text-black font-mono font-bold text-xs rounded-lg hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isDeploying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
            {isDeploying ? "DEPLOYING…" : "DEPLOY ANALYSIS"}
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
