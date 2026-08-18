"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/landing/Hero";
import { IntelligenceBento } from "@/components/landing/IntelligenceBento";
import { AgentNetwork } from "@/components/landing/AgentNetwork";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <IntelligenceBento />
        <AgentNetwork />
        <HowItWorks />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
