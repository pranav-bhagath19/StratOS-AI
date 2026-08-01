"use client"

import { type RefObject, useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Loader2, RefreshCw, Zap } from "lucide-react"

import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { apiGet, apiPost } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

import { AnalysisInput, type AnalysisType, type Preset, type AnalysisModule } from "@/components/intelligence/AnalysisInput"
import { AgentStatusPipeline, type AgentName, type AgentState } from "@/components/intelligence/AgentStatus"
import { ProviderShowcasePanel, type ProviderDetails } from "@/components/intelligence/SourceCard"
import { ExecutiveBriefPanel, type Brief } from "@/components/reports/ExecutiveBrief"
import { SchedulesPanel, type Schedule } from "@/components/dashboard/RecentReports"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

type Phase = "setup" | "running" | "complete" | "failed"
type Tab = "deploy" | "schedules"

const PRESETS: Preset[] = [
  {
    track: "WEDGE · COMPETITIVE INTEL",
    title: "Anthropic",
    analysis: "account_pulse",
    target: "anthropic.com",
    tagline: "Fast-moving enterprise-AI competitor — track the threat.",
  },
  {
    track: "EXPANSION · SUPPLY CHAIN",
    title: "Boeing",
    analysis: "supplier_watch",
    target: "boeing.com",
    tagline: "Aerospace supplier under regulatory pressure — de-risk?",
  },
  {
    track: "EXPANSION · SECURITY",
    title: "Change Healthcare",
    analysis: "threat_surface",
    target: "change.unitedhealthgroup.com",
    tagline: "Major healthcare cyber incident — what's the exposure?",
  },
]

const ANALYSISS: AnalysisModule[] = [
  {
    type: "account_pulse",
    track: "WEDGE · COMPETITIVE INTEL",
    name: "Account Pulse",
    description: "Competitor moves, funding events, exec changes, product launches",
    tools: ["SERP API", "MCP Server", "Web Unlocker"],
  },
  {
    type: "supplier_watch",
    track: "EXPANSION · SUPPLY CHAIN",
    name: "Supplier Watch",
    description: "Financial health, risk signals, market position, contract exposure",
    tools: ["SERP API", "Web Scraper", "Playwright"],
  },
  {
    type: "threat_surface",
    track: "EXPANSION · SECURITY",
    name: "Threat Surface",
    description: "Breach history, CVEs, dark web exposure, domain reputation",
    tools: ["SERP API", "Web Unlocker", "MCP Server"],
  },
]

const AGENTS = ["planner", "researcher", "scout", "verifier", "coordinator"] as const

const INITIAL_AGENTS = (): Record<AgentName, AgentState> =>
  Object.fromEntries(
    AGENTS.map((a) => [a, { status: "idle", message: "" }])
  ) as Record<AgentName, AgentState>

const EMPTY_PROVIDER_DETAILS = (): ProviderDetails => ({})

export default function StratOSPage() {
  const [tab, setTab] = useState<Tab>("deploy")
  const [phase, setPhase] = useState<Phase>("setup")
  const [selected, setSelected] = useState<AnalysisType>("account_pulse")
  const [target, setTarget] = useState("")
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [isDeploying, setIsDeploying] = useState(false)
  const [agents, setAgents] = useState<Record<AgentName, AgentState>>(INITIAL_AGENTS)
  const [providerDetails, setProviderDetails] = useState<ProviderDetails>(EMPTY_PROVIDER_DETAILS)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [log, setLog] = useState<string[]>([])
  const logRef = useRef<HTMLDivElement>(null)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  const loadSchedules = useCallback(async () => {
    try {
      const data = await apiGet<Schedule[]>("/analyses/schedules")
      setSchedules(data)
    } catch {
      // schedules table may not exist yet — show empty state
    }
  }, [])

  useEffect(() => {
    if (tab !== "schedules") return
    let cancelled = false
    ;(async () => {
      try {
        const data = await apiGet<Schedule[]>("/analyses/schedules")
        if (!cancelled) setSchedules(data)
      } catch {
        // schedules table may not exist yet — show empty state
      }
    })()
    return () => { cancelled = true }
  }, [tab])

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-100), line])
  }, [])

  const deployAnalysis = async (analysisTarget: string, analysisType: AnalysisType) => {
    if (isDeploying) return

    setIsDeploying(true)

    esRef.current?.close()
    esRef.current = null

    setLog([])
    setProviderDetails(EMPTY_PROVIDER_DETAILS())
    setAgents(INITIAL_AGENTS())
    setBrief(null)
    setAnalysisId(null)

    try {
      const res = await apiPost<{ analysis_id: string }>("/analyses/", {
        analysis_type: analysisType,
        target: analysisTarget,
        context: null,
      })
      setAnalysisId(res.analysis_id)
      setPhase("running")
      pushLog(`DEPLOYED  analysis=${res.analysis_id.slice(0, 8)}`)
      startSSE(res.analysis_id)
    } catch (err) {
      setIsDeploying(false)
      toast.error("Deploy failed", {
        description: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const handleDeploy = async () => {
    if (!target.trim()) {
      toast.error("Target required", { description: "Enter a company name or domain." })
      return
    }
    await deployAnalysis(target.trim(), selected)
  }

  const handlePresetDeploy = async (presetTarget: string, analysisType: AnalysisType) => {
    setSelected(analysisType)
    setTarget(presetTarget)
    await deployAnalysis(presetTarget, analysisType)
  }

  const startSSE = (id: string) => {
    const es = new EventSource(`${API_BASE}/analyses/${id}/stream`)
    esRef.current = es

    es.addEventListener("intelligence_event", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data as string) as {
          agent: string
          event_type: string
          message: string
          provider_product: string | null
          payload?: Record<string, unknown>
        }
        const { agent, event_type, message, provider_product, payload } = d

        setAgents((prev) => {
          const next = { ...prev }
          const a = agent as AgentName
          if (!AGENTS.includes(a)) return prev
          if (["started", "thinking", "tool_call", "tool_result"].includes(event_type)) {
            next[a] = { status: "running", message }
          } else if (event_type === "completed") {
            next[a] = { status: "complete", message }
          } else if (event_type === "failed") {
            next[a] = { status: "failed", message }
          }
          return next
        })

        if (provider_product) {
          if (event_type === "tool_call") {
            const goal = message.replace(/^Step \d+:\s*/, "")
            setProviderDetails((prev) => {
              const ex = prev[provider_product] ?? { count: 0, totalLatencyMs: 0, lastGoal: "", lastStatus: "" }
              return { ...prev, [provider_product]: { ...ex, count: ex.count + 1, lastGoal: goal } }
            })
          } else if (event_type === "tool_result") {
            const latency = typeof payload?.latency_ms === "number" ? payload.latency_ms : 0
            const status = typeof payload?.status === "string" ? payload.status : ""
            setProviderDetails((prev) => {
              const ex = prev[provider_product] ?? { count: 0, totalLatencyMs: 0, lastGoal: "", lastStatus: "" }
              return {
                ...prev,
                [provider_product]: { ...ex, totalLatencyMs: ex.totalLatencyMs + latency, lastStatus: status },
              }
            })
          }
        }

        const tag = agent.toUpperCase().padEnd(10)
        pushLog(`${tag}  ${event_type.padEnd(12)}  ${message}`)
      } catch {
        // ignore malformed events
      }
    })

    es.addEventListener("done", async () => {
      es.close()
      esRef.current = null
      pushLog("─────────────  ANALYSIS COMPLETE  ─────────────")
      try {
        const r = await fetch(`${API_BASE}/analyses/${id}`)
        const data = (await r.json()) as { analysis: unknown; brief: Brief | null }
        if (data.brief) setBrief(data.brief)
      } catch {
        // best-effort
      }
      setIsDeploying(false)
      setPhase("complete")
    })

    es.onerror = () => {
      pushLog("SSE ERROR: connection dropped")
      setIsDeploying(false)
      setPhase("failed")
    }
  }

  const handleReset = () => {
    esRef.current?.close()
    esRef.current = null
    setIsDeploying(false)
    setPhase("setup")
    setAnalysisId(null)
    setBrief(null)
    setLog([])
    setProviderDetails(EMPTY_PROVIDER_DETAILS())
    setAgents(INITIAL_AGENTS())
  }

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navigation */}
      <Navbar />

      {/* Main View Container */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 pt-28 sm:pt-36 pb-16">
        {/* Tab bar inside main workspace */}
        {phase === "setup" && (
          <div className="border-b border-white/10 mb-8 pb-1 flex gap-2">
            {(["deploy", "schedules"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`font-mono text-xs font-semibold tracking-wider px-5 py-2.5 rounded-full transition-all ${
                  tab === t
                    ? "border border-white/20 text-white bg-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950"
                }`}
              >
                {t === "deploy" ? "DEPLOY ANALYSIS" : "SCHEDULED ANALYSES"}
              </button>
            ))}
          </div>
        )}

        {phase !== "setup" ? (
          <div className="space-y-6 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-zinc-950 p-5 rounded-xl border border-white/10">
              <div>
                <span className="font-mono text-xs text-zinc-400 font-semibold tracking-wider">
                  {ANALYSISS.find((m) => m.type === selected)?.track} · {selected.toUpperCase().replace("_", " ")}
                </span>
                <h1 className="text-3xl font-extrabold tracking-tight text-white mt-0.5">{target}</h1>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`font-mono text-xs tracking-wider px-3 py-1.5 ${
                    phase === "running"
                      ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                      : phase === "complete"
                      ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10"
                      : "border-red-500/50 text-red-400 bg-red-500/10"
                  }`}
                >
                  {phase === "running" ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      PIPELINE RUNNING
                    </span>
                  ) : phase === "complete" ? (
                    "✓ ANALYSIS COMPLETE"
                  ) : (
                    "✗ PIPELINE FAILED"
                  )}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="font-mono text-xs text-zinc-300 border-white/10 hover:bg-zinc-900 h-9"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  New Analysis
                </Button>
              </div>
            </div>

            {/* Agent Pipeline */}
            <AgentStatusPipeline agents={agents} />

            {/* Capability Showcase */}
            <ProviderShowcasePanel providerDetails={providerDetails} phase={phase} />

            {/* Live SSE Event Stream Feed */}
            <Card className="border border-white/10 bg-zinc-950">
              <CardHeader className="border-b border-white/10 px-6 py-3 flex flex-row items-center justify-between">
                <span className="font-mono text-xs font-semibold text-zinc-300 tracking-wider flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  LIVE SSE EVENT FEED
                </span>
                {phase === "running" && (
                  <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div
                  ref={logRef}
                  className="overflow-y-auto p-4 font-mono text-xs text-zinc-400 space-y-1 max-h-56 bg-black rounded-b-xl"
                >
                  {log.length === 0 ? (
                    <span className="text-zinc-600 italic">Waiting for incoming agent telemetry events…</span>
                  ) : (
                    log.map((line, i) => (
                      <div key={i} className="leading-relaxed whitespace-pre-wrap break-all border-b border-zinc-900 pb-0.5">
                        {line}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Executive Brief Display */}
            {phase === "complete" && brief && (
              <ExecutiveBriefPanel brief={brief} analysisId={analysisId} target={target} />
            )}
          </div>
        ) : tab === "deploy" ? (
          <AnalysisInput
            selected={selected}
            onSelect={setSelected}
            target={target}
            onTargetChange={setTarget}
            onDeploy={handleDeploy}
            onPresetDeploy={handlePresetDeploy}
            isDeploying={isDeploying}
            presets={PRESETS}
            modules={ANALYSISS}
          />
        ) : (
          <SchedulesPanel
            schedules={schedules}
            onRefresh={loadSchedules}
            onRunNow={handlePresetDeploy}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
