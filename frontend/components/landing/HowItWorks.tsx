"use client";

import React from "react";
import { SectionLabel } from "@/components/ui/SectionLabel";

const STEPS = [
  {
    num: "01",
    title: "Define Objective",
    desc: "Specify target company name or domain.",
  },
  {
    num: "02",
    title: "Deploy Agents",
    desc: "5 AI agents execute parallel live web queries.",
  },
  {
    num: "03",
    title: "Verify Intelligence",
    desc: "Cross-check web findings against primary sources.",
  },
  {
    num: "04",
    title: "Generate Strategy",
    desc: "Receive Market Move Scores and Executive Action Packs.",
  },
];

export function HowItWorks() {
  return (
    <section id="about" className="relative max-w-5xl mx-auto px-6 py-10 font-sans">
      <div className="text-center mb-8 space-y-2">
        <SectionLabel>WORKFLOW</SectionLabel>
        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
          How StratOS AI Operates
        </h2>
        <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
          From query entry to executive report delivery in four autonomous steps.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS.map((s) => (
          <div key={s.num} className="border border-white/10 bg-black p-5 rounded-xl space-y-2">
            <span className="font-mono text-xl font-extrabold text-zinc-500 block">
              {s.num}
            </span>
            <h3 className="text-base font-bold text-white">{s.title}</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default HowItWorks;
