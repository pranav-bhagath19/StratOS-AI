"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hyperspeedPresets } from "@/components/hyperspeed/HyperSpeedPresets";

const Hyperspeed = dynamic(() => import("@/components/hyperspeed/Hyperspeed"), {
  ssr: false,
});

export function CTA() {
  return (
    <section className="relative max-w-5xl mx-auto px-6 pt-4 pb-12 font-sans">
      <div className="relative border border-white/10 bg-black p-8 sm:p-12 text-center rounded-2xl overflow-hidden">
        {/* Hyperspeed Visual Accent */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <Hyperspeed effectOptions={hyperspeedPresets.six} />
        </div>

        <div className="relative z-10 space-y-3">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
            STRATOS AI INTEL
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Automate Strategic Intelligence.
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
            Deploy live multi-agent analyses on any competitor or market target right now.
          </p>
          <div className="pt-3 flex justify-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/dashboard" className="flex items-center gap-2">
                Start Analysis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
