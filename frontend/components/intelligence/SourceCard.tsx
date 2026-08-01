"use client"

import React from "react"
import { Search, Globe, ShieldCheck, FileText, Monitor } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export type ProviderProductDetail = {
  count: number
  totalLatencyMs: number
  lastGoal: string
  lastStatus: string
}
export type ProviderDetails = Record<string, ProviderProductDetail>
export type Phase = "setup" | "running" | "complete" | "failed"

export const PROVIDER_CHANNELS: {
  key: string
  label: string
  Icon: React.ElementType
}[] = [
  { key: "serp_api", label: "Search Engine", Icon: Search },
  { key: "mcp_server", label: "External API", Icon: Globe },
  { key: "web_unlocker", label: "Lightweight Fetch", Icon: ShieldCheck },
  { key: "web_scraper_api", label: "Complex Scraper", Icon: FileText },
  { key: "scraping_browser", label: "Headless Browser", Icon: Monitor },
]

export function ProviderShowcasePanel({ providerDetails, phase }: { providerDetails: ProviderDetails; phase: Phase }) {
  const totalCalls = PROVIDER_CHANNELS.reduce((sum, p) => sum + (providerDetails[p.key]?.count ?? 0), 0)
  const productsLive = PROVIDER_CHANNELS.filter((p) => (providerDetails[p.key]?.count ?? 0) > 0).length

  return (
    <Card className="border border-white/10 bg-zinc-950 overflow-hidden font-sans">
      <CardHeader className="border-b border-white/10 px-6 py-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-[10px] font-bold text-zinc-300 border-white/10 bg-zinc-900 px-2 py-0.5">
            INTEL LAYER
          </Badge>
          <span className="font-mono text-xs font-semibold text-zinc-300 tracking-wider">
            CAPABILITY TELEMETRY
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-zinc-400">
            {productsLive}/5 Active
          </span>
          <span className="font-mono text-xs text-zinc-400">
            {totalCalls} Calls
          </span>
          {phase === "running" && (
            <Badge variant="outline" className="font-mono text-[10px] text-amber-400 border-amber-500/40 bg-amber-500/10 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              STREAMING
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {PROVIDER_CHANNELS.map(({ key, label, Icon }) => {
            const detail = providerDetails[key]
            const count = detail?.count ?? 0
            const latencyMs = detail?.totalLatencyMs ?? 0
            const lastGoal = detail?.lastGoal ?? ""
            const lastStatus = detail?.lastStatus ?? ""
            const isActive = count > 0

            const statusDot =
              lastStatus === "ok"
                ? "bg-emerald-500 shadow-emerald-500/50"
                : lastStatus === "empty"
                ? "bg-amber-500 shadow-amber-500/50"
                : lastStatus === "failed" || lastStatus === "timeout"
                ? "bg-red-500 shadow-red-500/50"
                : "bg-zinc-700"

            return (
              <div
                key={key}
                className="group relative flex flex-col gap-2.5 p-4 hover:bg-zinc-900 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-zinc-600"}`} />
                  {isActive && (
                    <span className={`w-2 h-2 rounded-full shadow-sm ${statusDot}`} />
                  )}
                </div>

                <p className={`font-mono text-[10px] font-semibold tracking-wider ${isActive ? "text-zinc-300" : "text-zinc-600"}`}>
                  {label}
                </p>

                <p className={`font-mono text-2xl font-extrabold ${isActive ? "text-white" : "text-zinc-700"}`}>
                  {count}
                </p>

                <p className="font-mono text-[10px] text-zinc-500">
                  {isActive ? `${(latencyMs / 1000).toFixed(1)}s total` : "—"}
                </p>

                <p className="font-mono text-[10px] text-zinc-500 truncate" title={lastGoal}>
                  {lastGoal || "—"}
                </p>

                {isActive && lastGoal && (
                  <div className="pointer-events-none absolute bottom-full left-0 mb-2 z-20 w-64 hidden group-hover:block">
                    <Card className="border border-white/20 bg-black p-3 shadow-2xl">
                      <p className="font-mono text-[9px] text-zinc-500 tracking-wider mb-1">LAST TELEMETRY CALL</p>
                      <p className="font-mono text-xs text-zinc-300 leading-relaxed break-words">{lastGoal}</p>
                      {lastStatus && (
                        <p className={`font-mono text-[10px] mt-2 tracking-wider font-semibold ${
                          lastStatus === "ok" ? "text-emerald-400" :
                          lastStatus === "empty" ? "text-amber-400" : "text-red-400"
                        }`}>
                          STATUS: {lastStatus.toUpperCase()}
                        </p>
                      )}
                      <p className="font-mono text-[9px] text-zinc-500 mt-0.5">{latencyMs}ms cumulative</p>
                    </Card>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
