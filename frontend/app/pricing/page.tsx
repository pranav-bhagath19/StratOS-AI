"use client"

import Link from "next/link"
import { Check, ArrowRight } from "lucide-react"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

const TIERS = [
  {
    name: "Solo",
    price: "$99",
    period: "/mo",
    description: "For individual analysts and founders who need competitive intelligence on demand.",
    features: [
      "50 analyses / month",
      "1 user",
      "All 3 analysis types",
      "PDF export",
      "Public share links",
      "Analysis diff & history",
      "Community support",
    ],
    cta: "Start free trial",
    popular: false,
  },
  {
    name: "Team",
    price: "$399",
    period: "/mo",
    description: "For GTM, strategy, and security teams that need recurring competitive intelligence.",
    features: [
      "250 analyses / month",
      "10 users",
      "All 3 analysis types",
      "Slack delivery",
      "Recurring scheduled analyses",
      "PDF export + share links",
      "Analysis diff & history",
      "Email + Slack support",
    ],
    cta: "Start free trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For organizations that need unlimited strategic intelligence at enterprise scale.",
    features: [
      "Unlimited analyses",
      "Unlimited users",
      "Custom analysis templates",
      "CRM integrations (HubSpot, Salesforce)",
      "On-premise / self-hosted option",
      "SLA + dedicated support",
      "Custom data source zones",
      "SSO + audit logs",
    ],
    cta: "Contact sales",
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 pt-20 sm:pt-24 pb-24">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="font-mono text-[10px] text-zinc-400 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-widest inline-block">
            PRICING · StratOS AI
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
            Intelligence at every scale
          </h1>
          <p className="text-base text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Powered by real-time web intelligence. No per-capability limits. No lock-in.
          </p>
          <div className="pt-2">
            <Badge variant="outline" className="font-mono text-xs text-amber-400 border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 tracking-wider">
              INDICATIVE PRICING · PRE-SEED MVP — NOT YET BILLABLE
            </Badge>
          </div>
        </div>

        {/* Tier Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {TIERS.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col justify-between transition-all duration-300 bg-zinc-950 ${
                tier.popular
                  ? "border-white/40 shadow-2xl"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="bg-white text-black font-mono text-[10px] tracking-widest px-3 py-1 font-semibold uppercase shadow-md">
                    MOST POPULAR
                  </Badge>
                </div>
              )}

              <CardHeader className="p-6 pb-2">
                <p className="font-mono text-xs font-semibold text-zinc-500 tracking-wider uppercase mb-2">
                  {tier.name}
                </p>

                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  {tier.period && (
                    <span className="font-mono text-sm text-zinc-500">{tier.period}</span>
                  )}
                </div>

                <CardDescription className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                  {tier.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 pt-4 flex-1">
                <div className="border-t border-white/10 pt-4 mb-4">
                  <p className="font-mono text-[10px] text-zinc-500 tracking-wider uppercase mb-3 font-semibold">Included Features</p>
                  <ul className="space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-xs text-zinc-300 leading-relaxed">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>

              <CardFooter className="p-6 pt-0">
                {tier.popular ? (
                  <Link
                    href="/dashboard"
                    className="w-full h-10 bg-white text-black font-semibold text-xs rounded-full hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 shadow-md"
                  >
                    {tier.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={tier.name === "Enterprise" ? "mailto:hello@stratos.ai" : "/dashboard"}
                    className="w-full h-10 bg-zinc-900 border border-white/10 text-white font-semibold text-xs rounded-full hover:bg-zinc-800 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  >
                    {tier.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Intelligence Layer Footer Attribution */}
        <div className="mt-16 border-t border-white/10 pt-10 text-center">
          <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            All tiers powered by adaptive real-time web intelligence — Search APIs, Web Scrapers, Headless Browsers, and LLMs routed adaptively per analysis. Built for B2B competitive-intelligence teams.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
            <Link href="/dashboard" className="px-5 py-2 font-mono text-xs text-zinc-300 border border-white/10 bg-zinc-950 rounded-full hover:bg-zinc-900 hover:border-white/20 transition-colors">
              Try StratOS Console →
            </Link>
            <Link href="/" className="px-4 py-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
