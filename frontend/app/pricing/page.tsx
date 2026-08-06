"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ArrowRight, X, Mail, Building2, User, Sparkles } from "lucide-react"

import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

import {
  PRICING_CONFIG,
  Currency,
  BillingPeriod,
  formatPrice,
  PlanConfig,
} from "@/config/pricing"
import { getStoredUser } from "@/lib/auth"
import { toast } from "sonner"

export default function PricingPage() {
  const router = useRouter()

  // State with LocalStorage persistence & hydration safety
  const [currency, setCurrency] = useState<Currency>("INR")
  const [billing, setBilling] = useState<BillingPeriod>("monthly")
  const [mounted, setMounted] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)

  // Form state for Enterprise Contact Sales modal
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    notes: "",
  })
  const [contactSubmitting, setContactSubmitting] = useState(false)

  // Restore preferences on mount
  useEffect(() => {
    setMounted(true)
    try {
      const savedCurrency = localStorage.getItem("stratos_currency") as Currency
      if (savedCurrency && ["INR", "USD", "GBP"].includes(savedCurrency)) {
        setCurrency(savedCurrency)
      }

      const savedBilling = localStorage.getItem("stratos_billing") as BillingPeriod
      if (savedBilling && ["monthly", "annual"].includes(savedBilling)) {
        setBilling(savedBilling)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  // Currency Switcher
  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    try {
      localStorage.setItem("stratos_currency", newCurrency)
    } catch {
      // Ignore
    }
  }

  // Billing Switcher
  const handleBillingChange = (newBilling: BillingPeriod) => {
    setBilling(newBilling)
    try {
      localStorage.setItem("stratos_billing", newBilling)
    } catch {
      // Ignore
    }
  }

  // CTA Click Handler
  const handleSelectPlan = (plan: PlanConfig) => {
    try {
      localStorage.setItem("stratos_selected_plan", plan.id)
      localStorage.setItem("stratos_currency", currency)
      localStorage.setItem("stratos_billing", billing)
    } catch {
      // Ignore
    }

    if (plan.id === "enterprise") {
      setContactModalOpen(true)
      return
    }

    const user = getStoredUser()
    if (user) {
      toast.success(`Selected ${plan.name} Plan`, {
        description: "Navigating to your StratOS AI workspace...",
      })
      router.push("/dashboard")
    } else {
      toast.info(`Selected ${plan.name} Plan`, {
        description: "Please sign in or create an account to start.",
      })
      router.push(`/login?mode=signup&plan=${plan.id}&redirect=/dashboard`)
    }
  }

  // Contact Sales Submit Handler
  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!contactForm.email || !contactForm.name) {
      toast.error("Missing fields", { description: "Please provide your name and email." })
      return
    }

    setContactSubmitting(true)
    setTimeout(() => {
      setContactSubmitting(false)
      setContactModalOpen(false)
      toast.success("Enterprise Inquiry Sent", {
        description: "Our strategy team will reach out to you within 24 hours.",
      })
      setContactForm({ name: "", email: "", company: "", notes: "" })
    }, 600)
  }

  const plans = [
    PRICING_CONFIG.starter,
    PRICING_CONFIG.growth,
    PRICING_CONFIG.business,
    PRICING_CONFIG.enterprise,
  ]

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-x-hidden">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-white/[0.02] blur-[140px] rounded-full pointer-events-none" />

      <Navbar />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-28 sm:pt-32 pb-24">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <span className="font-mono text-[10px] font-bold text-zinc-400 border border-white/10 bg-zinc-950 px-3.5 py-1 rounded-full uppercase tracking-[0.2em] inline-block shadow-sm">
            PRICING
          </span>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Strategic intelligence that scales with your business.
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Monitor competitors, uncover market signals, and transform verified intelligence into strategic action.
          </p>

          {/* Controls Bar: Billing Toggle & Currency Switcher */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-6">
            {/* Billing Toggle (Monthly / Annual) */}
            <div className="flex items-center gap-2 bg-zinc-950 border border-white/10 p-1 rounded-full shadow-inner">
              <button
                type="button"
                onClick={() => handleBillingChange("monthly")}
                className={`font-mono text-xs font-semibold px-4 py-1.5 rounded-full transition-all ${
                  billing === "monthly"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                MONTHLY
              </button>
              <button
                type="button"
                onClick={() => handleBillingChange("annual")}
                className={`font-mono text-xs font-semibold px-4 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  billing === "annual"
                    ? "bg-white text-black shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                ANNUAL
                <span className="font-mono text-[9px] font-bold text-zinc-300 bg-white/10 border border-white/20 px-1.5 py-0.5 rounded uppercase">
                  SAVE ~17%
                </span>
              </button>
            </div>

            {/* Currency Switcher (INR / USD / GBP) */}
            <div className="flex items-center gap-1 bg-zinc-950 border border-white/10 p-1 rounded-full shadow-inner">
              {(["INR", "USD", "GBP"] as Currency[]).map((curr) => (
                <button
                  key={curr}
                  type="button"
                  onClick={() => handleCurrencyChange(curr)}
                  className={`font-mono text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all ${
                    currency === curr
                      ? "bg-zinc-800 border border-white/20 text-white shadow-sm"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid (4 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {plans.map((plan) => {
            const rawPrice = plan.prices[billing][currency]
            const formattedPrice = formatPrice(rawPrice, currency)

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col justify-between transition-all duration-300 bg-zinc-950 rounded-2xl ${
                  plan.popular
                    ? "border-white/30 bg-zinc-950/95 shadow-2xl ring-1 ring-white/20"
                    : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Most Popular Monochrome Badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
                    <span className="bg-white text-black font-mono text-[10px] tracking-[0.2em] px-3.5 py-1 rounded-full font-extrabold uppercase shadow-lg border border-zinc-200">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <CardHeader className="p-6 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="font-mono text-xs font-bold text-white tracking-widest uppercase">
                      {plan.name}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="flex items-baseline gap-1.5 my-3">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                      {mounted ? formattedPrice : formatPrice(rawPrice, currency)}
                    </span>
                    {rawPrice !== "Custom" && (
                      <span className="font-mono text-xs text-zinc-500 font-medium">
                        / {billing === "monthly" ? "month" : "year"}
                      </span>
                    )}
                  </div>

                  {/* For Who / Targeted Audience */}
                  <p className="font-mono text-[10px] text-zinc-400 bg-zinc-900/80 border border-white/5 px-2.5 py-1 rounded mb-2 inline-block">
                    For: {plan.forWho}
                  </p>

                  <CardDescription className="text-xs text-zinc-400 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-2 flex-1 flex flex-col justify-between">
                  <div className="border-t border-white/10 pt-4 mb-6 space-y-3">
                    <p className="font-mono text-[10px] text-zinc-500 tracking-wider uppercase font-semibold">
                      Plan Features
                    </p>

                    <ul className="space-y-2.5">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs">
                          <Check className="h-4 w-4 text-white shrink-0 mt-0.5 stroke-[2.2]" />
                          <span className="text-zinc-300 leading-tight flex-1">
                            {feat.text}
                          </span>

                          {/* Visual Tag for Unimplemented Features */}
                          {feat.status === "coming_soon" && (
                            <span className="font-mono text-[8px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              COMING SOON
                            </span>
                          )}
                          {feat.status === "planned" && (
                            <span className="font-mono text-[8px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                              PLANNED
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button
                    variant={plan.popular ? "primary" : "secondary"}
                    size="lg"
                    className="w-full"
                    onClick={() => handleSelectPlan(plan)}
                  >
                    {plan.ctaText}
                    <ArrowRight className="h-4 w-4 ml-1.5" />
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Strategic Intelligence Infrastructure Footer Note */}
        <div className="mt-16 border-t border-white/10 pt-10 text-center space-y-4">
          <p className="text-xs text-zinc-400 max-w-3xl mx-auto leading-relaxed">
            All plans utilize StratOS AI’s multi-agent competitive intelligence engine — powered by real-time web scrapers, verified search telemetry, and strategic synthesis models.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap pt-2">
            <Link
              href="/dashboard"
              className="font-mono text-xs text-zinc-300 border border-white/10 bg-zinc-950 px-4 py-2 rounded-full hover:bg-zinc-900 hover:border-white/20 transition-colors"
            >
              Launch StratOS Workspace →
            </Link>
            <Link
              href="/"
              className="font-mono text-xs text-zinc-400 hover:text-white transition-colors py-2"
            >
              Back to Overview
            </Link>
          </div>
        </div>
      </main>

      {/* Enterprise Contact Sales Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border border-white/15 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setContactModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-zinc-400 border border-white/10 bg-zinc-900 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                ENTERPRISE INQUIRY
              </span>
              <h3 className="text-xl font-extrabold text-white">Contact Strategic Intelligence Sales</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Connect with our strategy engineers to discuss custom competitor limits, dedicated infrastructure, and enterprise deployment options.
              </p>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block font-mono text-xs text-zinc-300 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-300 mb-1.5">Work Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="jane@enterprise.com"
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-300 mb-1.5">Organization / Company Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={contactForm.company}
                    onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                    placeholder="Acme Global Inc."
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-zinc-300 mb-1.5">Requirements / Notes</label>
                <textarea
                  rows={3}
                  value={contactForm.notes}
                  onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                  placeholder="Tell us about your team size, competitor tracking volume, or custom data needs..."
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/30 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 font-mono text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <Button variant="primary" size="default" type="submit" disabled={contactSubmitting}>
                  {contactSubmitting ? "Submitting..." : "Submit Inquiry"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
