"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/SectionLabel";

// Dynamic import for Lightspeed canvas background component
const Lightspeed = dynamic(() => import("@/components/lightspeed/Lightspeed"), {
  ssr: false,
});

export function Hero() {
  return (
    <section className="relative min-h-[85vh] pt-32 pb-16 px-6 flex flex-col items-center justify-center text-center font-sans overflow-hidden bg-black">
      {/* Interactive Hyperspeed & Ambient Video Background Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Lightspeed Radial Warp Particles Canvas */}
        <div className="absolute inset-0 opacity-40">
          <Lightspeed
            width="100%"
            height="100%"
            speed={1.1}
            streakCount={380}
            stretchFactor={0.07}
            primaryColor="#489dff"
            secondaryColor="#d2d2d2"
            tertiaryColor="#4a48f0"
            intensity={1.3}
            interactionEnabled={true}
            fadePower={1.8}
            opacity={0.85}
          />
        </div>

        {/* Video Overlay Layer */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        >
          <source
            src="https://assets.mixkit.co/videos/preview/mixkit-abstract-technology-network-lines-loop-31804-large.mp4"
            type="video/mp4"
          />
        </video>

        {/* Dark Vignette Overlay — Ensures Text Legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/50 to-black pointer-events-none" />
      </div>

      {/* Section Indicator Badge */}
      <div className="mb-5 relative z-10">
        <SectionLabel>COMPETITOR TELEMETRY & MARKET SIGNALS</SectionLabel>
      </div>

      {/* Main Display Headline */}
      <h1 className="relative z-10 text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.08] mb-5 max-w-3xl">
        Autonomous Competitive Intelligence for Executive Teams.
      </h1>

      {/* Supporting Subhead */}
      <p className="relative z-10 text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto mb-8 leading-relaxed font-normal">
        Track target accounts, monitor web signals, and generate verified strategic recommendations directly from live public web data.
      </p>

      {/* Action CTAs */}
      <div className="relative z-10 flex flex-wrap justify-center items-center gap-4">
        <Button asChild variant="primary" size="lg" className="font-sans font-bold text-xs uppercase tracking-wider">
          <Link href="/dashboard" className="flex items-center gap-2">
            Start Analysis
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button asChild variant="secondary" size="lg" className="font-sans font-semibold text-xs uppercase tracking-wider">
          <Link href="#platform" className="flex items-center gap-2">
            Explore Architecture
            <ChevronRight className="h-4 w-4 text-zinc-500" />
          </Link>
        </Button>
      </div>

      {/* Modern Connected Horizontal Pipeline Strip */}
      <div className="relative z-10 mt-12 w-full max-w-4xl mx-auto border-t border-white/10 pt-6 font-sans">
        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 px-2">
          <span>PARALLEL 5-AGENT TELEMETRY PIPELINE</span>
          <span className="text-blue-400 flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
            OPERATIONAL
          </span>
        </div>

        {/* Connected Linear Step Flow */}
        <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 text-xs text-left bg-zinc-950/90 border border-white/10 px-5 py-3.5 rounded-2xl backdrop-blur-md">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono font-bold">01</span>
              <span className="font-extrabold text-white tracking-wider">PLANNER</span>
            </div>
            <span className="text-[10px] text-zinc-400 block pl-5">Deconstruct Goals</span>
          </div>

          <span className="hidden sm:inline-block text-zinc-600 font-mono">→</span>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono font-bold">02</span>
              <span className="font-extrabold text-white tracking-wider">RESEARCHER</span>
            </div>
            <span className="text-[10px] text-zinc-400 block pl-5">Parallel Queries</span>
          </div>

          <span className="hidden sm:inline-block text-zinc-600 font-mono">→</span>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono font-bold">03</span>
              <span className="font-extrabold text-white tracking-wider">SCOUT</span>
            </div>
            <span className="text-[10px] text-zinc-400 block pl-5">Live Scraper</span>
          </div>

          <span className="hidden sm:inline-block text-zinc-600 font-mono">→</span>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono font-bold">04</span>
              <span className="font-extrabold text-white tracking-wider">VERIFIER</span>
            </div>
            <span className="text-[10px] text-zinc-400 block pl-5">Evidence Scoring</span>
          </div>

          <span className="hidden sm:inline-block text-zinc-600 font-mono">→</span>

          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-zinc-500 font-mono font-bold">05</span>
              <span className="font-extrabold text-white tracking-wider">COORDINATOR</span>
            </div>
            <span className="text-[10px] text-zinc-400 block pl-5">Executive Briefs</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;
