"use client"

import React from "react"
import { toast } from "sonner"
import { Calendar, Clock, Play, Trash2, RefreshCw } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

export type Schedule = {
  id: string
  target: string
  analysis_type: string
  cron: string
  label: string | null
  active: boolean
  last_run_at: string | null
  last_analysis_id: string | null
}

export function SchedulesPanel({
  schedules,
  onRefresh,
  onRunNow,
}: {
  schedules: Schedule[]
  onRefresh: () => void
  onRunNow: (target: string, analysisType: any) => void
}) {
  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/analyses/schedules/${id}`, { method: "DELETE" })
      toast.success("Schedule removed.")
      onRefresh()
    } catch {
      toast.error("Failed to remove schedule.")
    }
  }

  return (
    <div className="space-y-8 font-sans">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="font-mono text-[10px] text-zinc-300 border-white/10 bg-zinc-950">
            SCHEDULER
          </Badge>
          <span className="font-mono text-[10px] text-zinc-500 tracking-wider">INNGEST RECURRING JOBS</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Scheduled Analyses</h1>
        <p className="text-sm text-zinc-400 mt-1 max-w-xl">
          Automated analyses that run on a recurring schedule. Diff telemetry is calculated on every refresh.
        </p>
      </div>

      {/* Dev Server Note */}
      <Card className="border border-white/10 bg-zinc-950 p-4">
        <p className="font-mono text-xs text-zinc-400 flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-[9px] text-amber-400 border-amber-500/30">DEV SERVER</Badge>
          <span>Run Inngest locally: <code className="text-zinc-200 bg-black px-2 py-0.5 rounded border border-white/10">npx inngest-cli@latest dev -u http://localhost:8000/api/inngest</code></span>
        </p>
      </Card>

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <Card className="border border-white/10 bg-zinc-950 p-12 text-center">
          <Calendar className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <p className="font-mono text-xs text-zinc-400 font-semibold">NO SCHEDULES FOUND</p>
          <p className="font-mono text-[10px] text-zinc-600 mt-1">Run <code className="text-zinc-400">api/scripts/create_analysis_schedules.sql</code> to initialize schedules table.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {schedules.map((s) => (
            <Card key={s.id} className="border border-white/10 bg-zinc-950 p-5 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.active ? "bg-emerald-500 shadow-emerald-500/50 shadow-sm" : "bg-zinc-700"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {s.label ?? `${s.target} · ${s.analysis_type}`}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <Badge variant="outline" className="font-mono text-[9px] text-zinc-400 border-white/10 bg-black">
                      {s.cron}
                    </Badge>
                    <span className="font-mono text-[10px] text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-600" />
                      {s.last_run_at ? `Last ran ${new Date(s.last_run_at).toLocaleDateString()}` : "Never run"}
                    </span>
                    {s.last_analysis_id && (
                      <span className="font-mono text-[10px] text-zinc-500">
                        ANALYSIS {s.last_analysis_id.slice(0, 8).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRunNow(s.target, s.analysis_type)}
                  className="font-mono text-xs text-zinc-300 border-white/10 hover:bg-zinc-900 h-8"
                >
                  <Play className="h-3 w-3 mr-1 text-emerald-400" />
                  Run now
                </Button>
                {s.id !== "preset-anthropic" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(s.id)}
                    className="font-mono text-xs text-red-400 border-white/10 hover:border-red-900/40 hover:bg-red-950/20 h-8"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        className="font-mono text-xs text-zinc-400 hover:text-white"
      >
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Refresh Schedules
      </Button>
    </div>
  )
}
