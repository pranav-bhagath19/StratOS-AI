export type Currency = "INR" | "USD" | "GBP"
export type BillingPeriod = "monthly" | "annual"

export type FeatureStatus = "active" | "coming_soon" | "planned"

export type FeatureItem = {
  text: string
  status?: FeatureStatus
}

export type PlanConfig = {
  id: "starter" | "growth" | "business" | "enterprise"
  name: string
  popular?: boolean
  description: string
  prices: {
    monthly: Record<Currency, number | "Custom">
    annual: Record<Currency, number | "Custom">
  }
  forWho: string
  features: FeatureItem[]
  ctaText: string
}

export const PRICING_CONFIG: Record<string, PlanConfig> = {
  starter: {
    id: "starter",
    name: "STARTER",
    popular: false,
    description: "For founders and small businesses starting competitive intelligence.",
    forWho: "Founders & Small Teams",
    prices: {
      monthly: {
        INR: 2499,
        USD: 29,
        GBP: 24,
      },
      annual: {
        INR: 24999,
        USD: 290,
        GBP: 240,
      },
    },
    features: [
      { text: "1 Team Member", status: "active" },
      { text: "5 Tracked Competitors", status: "active" },
      { text: "30 Intelligence Runs / month", status: "active" },
      { text: "10 Executive Briefs / month", status: "active" },
      { text: "Competitor Comparisons", status: "active" },
      { text: "Verified Sources", status: "active" },
      { text: "Confidence Scoring", status: "active" },
      { text: "Strategic Move Scoring", status: "active" },
      { text: "Weekly Monitoring", status: "coming_soon" },
      { text: "Basic Intelligence Alerts", status: "coming_soon" },
      { text: "30-Day Intelligence History", status: "active" },
      { text: "PDF Export", status: "active" },
      { text: "Standard Support", status: "active" },
    ],
    ctaText: "Get Started",
  },
  growth: {
    id: "growth",
    name: "GROWTH",
    popular: true,
    description: "For growing startups, product teams, and strategy teams.",
    forWho: "Product & Strategy Teams",
    prices: {
      monthly: {
        INR: 6999,
        USD: 79,
        GBP: 69,
      },
      annual: {
        INR: 69999,
        USD: 790,
        GBP: 690,
      },
    },
    features: [
      { text: "5 Team Members", status: "active" },
      { text: "20 Tracked Competitors", status: "active" },
      { text: "150 Intelligence Runs / month", status: "active" },
      { text: "50 Executive Briefs / month", status: "active" },
      { text: "Advanced Competitor Intelligence", status: "active" },
      { text: "Verified Intelligence", status: "active" },
      { text: "Confidence Scoring", status: "active" },
      { text: "Strategic Move Scoring", status: "active" },
      { text: "Daily Monitoring", status: "coming_soon" },
      { text: "Priority Intelligence Alerts", status: "coming_soon" },
      { text: "6-Month Intelligence History", status: "active" },
      { text: "PDF Export", status: "active" },
      { text: "Shared Workspace", status: "coming_soon" },
      { text: "Custom Watchlists", status: "coming_soon" },
      { text: "Priority Support", status: "active" },
    ],
    ctaText: "Get Started",
  },
  business: {
    id: "business",
    name: "BUSINESS",
    popular: false,
    description: "For businesses managing competitive intelligence across teams and markets.",
    forWho: "Scale-ups & Multi-Market Teams",
    prices: {
      monthly: {
        INR: 14999,
        USD: 179,
        GBP: 149,
      },
      annual: {
        INR: 149999,
        USD: 1790,
        GBP: 1490,
      },
    },
    features: [
      { text: "15 Team Members", status: "active" },
      { text: "50 Tracked Competitors", status: "active" },
      { text: "500 Intelligence Runs / month", status: "active" },
      { text: "150 Executive Briefs / month", status: "active" },
      { text: "Advanced Competitive Intelligence", status: "active" },
      { text: "Verified Intelligence", status: "active" },
      { text: "Confidence Scoring", status: "active" },
      { text: "Strategic Move Scoring", status: "active" },
      { text: "Priority Monitoring", status: "coming_soon" },
      { text: "Advanced Intelligence Alerts", status: "coming_soon" },
      { text: "2-Year Intelligence History", status: "active" },
      { text: "PDF Export", status: "active" },
      { text: "Shared Workspace", status: "coming_soon" },
      { text: "Custom Watchlists", status: "coming_soon" },
      { text: "API Access", status: "planned" },
      { text: "Priority Support", status: "active" },
    ],
    ctaText: "Get Started",
  },
  enterprise: {
    id: "enterprise",
    name: "ENTERPRISE",
    popular: false,
    description: "For organizations requiring custom strategic intelligence infrastructure.",
    forWho: "Enterprise & Global Organizations",
    prices: {
      monthly: {
        INR: "Custom",
        USD: "Custom",
        GBP: "Custom",
      },
      annual: {
        INR: "Custom",
        USD: "Custom",
        GBP: "Custom",
      },
    },
    features: [
      { text: "Custom Team Size", status: "active" },
      { text: "Custom Competitor Limits", status: "active" },
      { text: "Custom Intelligence Runs", status: "active" },
      { text: "Custom Monitoring", status: "coming_soon" },
      { text: "Custom Data Retention", status: "active" },
      { text: "Advanced Integrations", status: "planned" },
      { text: "Organization Workspaces", status: "coming_soon" },
      { text: "Custom Intelligence Sources", status: "active" },
      { text: "Priority Processing", status: "active" },
      { text: "Dedicated Onboarding", status: "active" },
      { text: "Dedicated Support", status: "active" },
    ],
    ctaText: "Contact Sales",
  },
}

/**
 * Currency Formatter using Intl.NumberFormat
 */
export function formatPrice(amount: number | "Custom", currency: Currency): string {
  if (amount === "Custom") return "Custom"

  const localeMap: Record<Currency, string> = {
    INR: "en-IN",
    USD: "en-US",
    GBP: "en-GB",
  }

  const symbolMap: Record<Currency, string> = {
    INR: "₹",
    USD: "$",
    GBP: "£",
  }

  const formatted = new Intl.NumberFormat(localeMap[currency], {
    maximumFractionDigits: 0,
  }).format(amount)

  return `${symbolMap[currency]}${formatted}`
}
