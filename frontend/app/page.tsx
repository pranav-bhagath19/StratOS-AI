"use client"

import React from "react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Hero } from "@/components/landing/Hero"
import { TechnologyStrip } from "@/components/landing/TechnologyStrip"
import { IntelligenceBento } from "@/components/landing/IntelligenceBento"
import { AgentNetwork } from "@/components/landing/AgentNetwork"
import { HowItWorks } from "@/components/landing/HowItWorks"
import { CTA } from "@/components/landing/CTA"
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards"
import { AceternityAccordion, type AccordionItem } from "@/components/ui/accordion-aceternity"
import { TrendingUp, Package, Shield } from "lucide-react"

const TESTIMONIALS = [
  {
    quote:
      "StratOS AI gave us visibility into competitor executive hires and product rollouts days before they were officially announced.",
    name: "VP of Competitive Strategy",
    title: "Enterprise SaaS Leader",
    icon: <TrendingUp className="h-5 w-5 text-white" />,
  },
  {
    quote:
      "The Supplier Watch module flagged critical supply-chain exposures across our key vendor stack, saving us from a major disruption.",
    name: "Head of Procurement & Risk",
    title: "Global Supply Chain Co.",
    icon: <Package className="h-5 w-5 text-white" />,
  },
  {
    quote:
      "Instead of spending hours sifting through search results, our security team receives instant executive briefs with clear action packs.",
    name: "Lead Security Architect",
    title: "Fintech Enterprise",
    icon: <Shield className="h-5 w-5 text-white" />,
  },
]

const FAQ_ITEMS: AccordionItem[] = [
  {
    id: "faq-1",
    question: "What is StratOS AI and how does it work?",
    answer:
      "StratOS AI is an autonomous competitive intelligence engine. You input a target company or domain, and five specialized AI agents (Planner, Researcher, Scout, Verifier, and Coordinator) execute parallel live-web searches, parse real-time telemetry, and synthesize an Executive Battle Brief with actionable recommendations.",
  },
  {
    id: "faq-2",
    question: "What live web data sources are used?",
    answer:
      "StratOS AI uses a hybrid web-intelligence layer combining DuckDuckGo SERP APIs, Playwright headless browser rendering, lightweight HTTP scrapers, and OpenRouter LLMs. It operates in real time with zero hardcoded sample datasets.",
  },
  {
    id: "faq-3",
    question: "What are the three flagship intelligence modules?",
    answer:
      "1) Account Pulse: Tracks competitor strategic moves, executive changes, funding, and product launches. 2) Supplier Watch: De-risks supply chain vendors and evaluates market posture. 3) Threat Surface: Scans for breach history, CVE exposures, and dark web risk signals.",
  },
  {
    id: "faq-4",
    question: "Can analyses be scheduled automatically?",
    answer:
      "Yes. StratOS AI integrates with Inngest to support cron-based recurring analyses. Every automated run computes a run-over-run diff (score delta, confidence change, new findings) and can send instant Slack alerts.",
  },
  {
    id: "faq-5",
    question: "How does the multi-agent pipeline ensure accuracy?",
    answer:
      "Every finding discovered by the Scout agent is passed through the Verifier agent to validate source reliability before the Coordinator compiles the final Executive Brief.",
  },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <TechnologyStrip />
        <IntelligenceBento />
        <AgentNetwork />
        <HowItWorks />

        {/* User Perspectives Section */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 font-sans bg-black">
          <div className="text-center mb-12 space-y-3">
            <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
              USER PERSPECTIVES
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Trusted by Strategy & Revenue Leaders
            </h2>
          </div>
          <InfiniteMovingCards items={TESTIMONIALS} speed="normal" />
        </section>

        {/* FAQ Section */}
        <section className="relative z-10 max-w-6xl mx-auto px-6 py-16 font-sans bg-black">
          <div className="text-center mb-12 space-y-3">
            <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Everything You Need to Know
            </h2>
          </div>
          <AceternityAccordion items={FAQ_ITEMS} />
        </section>

        <CTA />
      </main>
      <Footer />
    </div>
  )
}
