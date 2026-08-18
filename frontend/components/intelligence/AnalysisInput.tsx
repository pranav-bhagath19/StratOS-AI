"use client";

import React from "react";
import { ArrowRight, Loader2, Search, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export type AnalysisType = "account_pulse" | "supplier_watch" | "threat_surface";

export type Preset = {
  track: string;
  title: string;
  analysis: AnalysisType;
  target: string;
  tagline: string;
};

export type AnalysisModule = {
  type: AnalysisType;
  track: string;
  name: string;
  description: string;
  tools: string[];
};

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
  selected: AnalysisType;
  onSelect: (t: AnalysisType) => void;
  target: string;
  onTargetChange: (v: string) => void;
  onDeploy: () => void;
  onPresetDeploy: (target: string, analysisType: AnalysisType) => void;
  isDeploying: boolean;
  presets: Preset[];
  modules: AnalysisModule[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 font-sans items-start">
      {/* Left Column (2/3 width) - Target Console & Modules */}
      <div className="lg:col-span-2 space-y-6">
        {/* Command Input Card */}
        <div className="border border-white/15 bg-zinc-950 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider">
                TARGET SPECIFICATION
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">READY TO SCAN</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                value={target}
                onChange={(e) => onTargetChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onDeploy()}
                placeholder="Enter target domain or company (e.g. nvidia.com)..."
                className="w-full bg-black border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-400/50 focus:ring-1 focus:ring-blue-400/30 transition-all font-sans"
              />
            </div>
            <Button
              onClick={onDeploy}
              disabled={isDeploying || !target.trim()}
              variant="primary"
              size="lg"
              className="h-11 px-6 font-bold text-xs uppercase tracking-wider shrink-0"
            >
              {isDeploying ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              {isDeploying ? "INITIALIZING…" : "RUN SCAN"}
            </Button>
          </div>

          {/* Quick Target Presets */}
          <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mr-1">
              PRESET TARGETS:
            </span>
            {presets.map((p) => (
              <button
                key={p.target}
                type="button"
                onClick={() => !isDeploying && onPresetDeploy(p.target, p.analysis)}
                disabled={isDeploying}
                className="text-xs font-semibold text-zinc-300 border border-white/10 bg-black hover:border-white/30 hover:text-white px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 group"
              >
                <span>{p.title}</span>
                <span className="text-[10px] text-blue-400 opacity-70 group-hover:opacity-100 font-bold">→</span>
              </button>
            ))}
          </div>
        </div>

        {/* Intelligence Module Selector */}
        <div className="space-y-3">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            SELECT INTELLIGENCE MODULE
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {modules.map((m) => {
              const isSelected = selected === m.type;
              return (
                <button
                  key={m.type}
                  type="button"
                  onClick={() => onSelect(m.type)}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2.5 relative ${
                    isSelected
                      ? "border-white/40 bg-zinc-900 text-white shadow-xl"
                      : "border-white/10 bg-zinc-950 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-extrabold text-sm text-white">{m.name}</p>
                    {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                  </div>

                  <p className="text-xs text-zinc-400 leading-normal">{m.description}</p>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                    {m.tools.map((tool) => (
                      <span
                        key={tool}
                        className="text-[9px] font-semibold text-zinc-400 border border-white/10 bg-black px-2 py-0.5 rounded"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column (1/3 width) - 5-Agent Status Sidebar */}
      <div className="space-y-6">
        {/* 5-Agent Monitor Widget */}
        <div className="border border-white/15 bg-zinc-950 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              5-AGENT PIPELINE MONITOR
            </span>
            <span className="text-[10px] text-blue-400 font-bold">ONLINE</span>
          </div>

          <div className="space-y-2 text-xs font-sans">
            {[
              { name: "PLANNER", desc: "Deconstruct Goals" },
              { name: "RESEARCHER", desc: "Parallel Queries" },
              { name: "SCOUT", desc: "Live Web Scraper" },
              { name: "VERIFIER", desc: "Evidence Assessor" },
              { name: "COORDINATOR", desc: "Executive Briefs" },
            ].map((agent, i) => (
              <div key={agent.name} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-500 font-mono">0{i + 1}</span>
                  <span className="font-extrabold text-white text-xs">{agent.name}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-medium">{agent.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalysisInput;
