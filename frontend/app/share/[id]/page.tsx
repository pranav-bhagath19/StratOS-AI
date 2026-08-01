import { notFound } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Sparkles, Shield, ArrowRight, CheckCircle2 } from "lucide-react"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "")

type Brief = {
  market_move_score: number
  recommended_move: string
  confidence_score: number
  action_pack: {
    headline?: string
    situation?: string
    actions?: { immediate?: string[]; this_week?: string[]; watch?: string[] }
    coordinator_rationale?: string
  }
}

type Analysis = {
  id: string
  target: string
  analysis_type: string
  status: string
  created_at: string
}

async function getData(id: string): Promise<{ analysis: Analysis; brief: Brief } | null> {
  try {
    const res = await fetch(`${API_BASE}/share/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

const MOVE_STYLES: Record<string, string> = {
  ATTACK: "text-red-400 border-red-500/40 bg-red-500/10 shadow-lg",
  DEFEND: "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-lg",
  ESCALATE: "text-red-300 border-red-400/40 bg-red-400/10 shadow-lg",
  WAIT: "text-zinc-400 border-zinc-600 bg-zinc-800/40",
  MONITOR: "text-sky-400 border-sky-500/40 bg-sky-500/10 shadow-lg",
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { analysis, brief } = data
  const move = (brief.recommended_move ?? "MONITOR").toUpperCase()
  const moveStyle = MOVE_STYLES[move] ?? "text-zinc-400 border-zinc-600 bg-zinc-800/40"
  const actions = brief.action_pack.actions ?? {}

  const createdDate = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Navigation Header */}
      <nav className="relative z-20 border-b border-white/10 bg-black px-6 sticky top-0">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
          <Logo />
          <span className="font-mono text-[10px] text-zinc-300 border border-white/10 bg-zinc-950 px-3 py-1 rounded-full uppercase">
            PUBLIC BATTLE BRIEF
          </span>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 pt-10 pb-20 space-y-8">
        {/* Analysis Header */}
        <div className="border-b border-white/10 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-zinc-500 tracking-widest uppercase">
                STRATOS AI · INTELLIGENCE REPORT
              </span>
              <span className="font-mono text-[10px] text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 rounded">
                STATUS: VERIFIED
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {analysis.target}
            </h1>
            <p className="font-mono text-xs text-zinc-500">
              {analysis.analysis_type.toUpperCase().replace("_", " ")} · {createdDate}
            </p>
          </div>

          <div className="text-right space-y-1">
            <span className="font-mono text-xs text-zinc-500 block">CONFIDENCE VERIFICATION</span>
            <span className="font-mono text-3xl font-extrabold text-white">{brief.confidence_score}%</span>
          </div>
        </div>

        {/* Scores & Move Box */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-zinc-950 p-6 rounded-xl border border-white/10">
          <div className="space-y-1">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              MARKET MOVE SCORE
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-5xl font-extrabold text-white">{brief.market_move_score}</span>
              <span className="font-mono text-xl text-zinc-600">/ 100</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
              RECOMMENDED STRATEGIC MOVE
            </span>
            <span className={`inline-block font-mono text-lg font-extrabold tracking-widest px-6 py-2 rounded-lg border ${moveStyle}`}>
              {move}
            </span>
          </div>
        </div>

        {/* Situation */}
        {brief.action_pack.headline && (
          <div className="space-y-3 border-t border-white/10 pt-6">
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">
              01 // SITUATION ASSESSMENT
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {brief.action_pack.headline}
            </h2>
            {brief.action_pack.situation && (
              <p className="text-sm text-zinc-300 leading-relaxed max-w-3xl">
                {brief.action_pack.situation}
              </p>
            )}
          </div>
        )}

        {/* 3-Column Actions Grid */}
        <div className="space-y-3 border-t border-white/10 pt-6">
          <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">
            02 // RECOMMENDED ACTIONS
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionColumn label="IMMEDIATE" items={actions.immediate ?? []} accentClass="text-red-400 border-red-500/30 bg-red-500/5" />
            <ActionColumn label="THIS WEEK" items={actions.this_week ?? []} accentClass="text-amber-400 border-amber-500/30 bg-amber-500/5" />
            <ActionColumn label="WATCH" items={actions.watch ?? []} accentClass="text-sky-400 border-sky-500/30 bg-sky-500/5" />
          </div>
        </div>

        {/* Rationale */}
        {brief.action_pack.coordinator_rationale && (
          <div className="space-y-3 border-t border-white/10 pt-6">
            <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest block">
              03 // COORDINATOR RATIONALE
            </span>
            <div className="bg-zinc-950 p-5 rounded-xl border border-white/10 font-mono text-xs text-zinc-300 leading-relaxed">
              {brief.action_pack.coordinator_rationale}
            </div>
          </div>
        )}

        {/* Public CTA Banner */}
        <div className="mt-12 text-center bg-zinc-950 p-8 rounded-2xl border border-white/15 shadow-xl space-y-4">
          <p className="text-base font-bold text-white">Want autonomous competitive intelligence for your team?</p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">Run live multi-agent analyses on any competitor or strategic target.</p>
          <div className="flex justify-center pt-2">
            <Button asChild variant="primary" size="lg">
              <Link href="/dashboard" className="flex items-center gap-2">
                Open StratOS Console
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 border-t border-white/10 bg-black px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="font-mono text-xs text-zinc-500 tracking-wider">
            StratOS AI · Autonomous Competitive Intelligence
          </span>
          <a
            href="https://github.com/pranav-bhagath19/StratOS-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-zinc-400 hover:text-white transition-colors tracking-wider"
          >
            github.com/pranav-bhagath19/StratOS-AI ↗
          </a>
        </div>
      </footer>
    </div>
  )
}

function ActionColumn({
  label,
  items,
  accentClass,
}: {
  label: string
  items: string[]
  accentClass: string
}) {
  return (
    <Card className={`border p-4 bg-zinc-950 ${accentClass}`}>
      <p className="font-mono text-[10px] font-bold tracking-wider mb-3 uppercase">{label}</p>
      {items.length === 0 ? (
        <p className="font-mono text-xs text-zinc-600">—</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="font-mono text-xs font-bold mt-0.5 shrink-0">→</span>
              <span className="text-xs text-zinc-300 leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
