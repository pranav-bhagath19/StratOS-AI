import { notFound } from "next/navigation"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import { ArrowRight, ShieldCheck, Zap } from "lucide-react"

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
  MONITOR: "text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-lg",
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { analysis, brief } = data
  const move = (brief.recommended_move ?? "MONITOR").toUpperCase()
  const moveStyle = MOVE_STYLES[move] ?? "text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-lg"
  const actions = brief.action_pack.actions ?? {}

  const createdDate = new Date(analysis.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  return (
    <div className="relative min-h-screen bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Navigation Header */}
      <nav className="relative z-20 border-b border-white/10 bg-black px-6 sticky top-0">
        <div className="max-w-4xl mx-auto h-16 flex items-center justify-between">
          <Logo />
          <span className="text-[10px] font-bold text-zinc-300 border border-white/15 bg-zinc-950 px-3 py-1 rounded-full uppercase tracking-wider">
            PUBLIC BRIEF
          </span>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 pt-10 pb-20 space-y-8">
        {/* Analysis Header */}
        <div className="border-b border-white/10 pb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-zinc-400 tracking-widest uppercase">
                STRATOS AI · INTELLIGENCE REPORT
              </span>
              <span className="text-[10px] font-bold text-blue-400 border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 rounded">
                VERIFIED
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
              {analysis.target}
            </h1>
            <p className="text-xs text-zinc-400 font-medium">
              {analysis.analysis_type.toUpperCase().replace("_", " ")} · {createdDate}
            </p>
          </div>

          <div className="text-right space-y-1 bg-zinc-950 border border-white/15 px-4 py-2 rounded-xl">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">CONFIDENCE VERIFICATION</span>
            <span className="text-2xl font-extrabold text-white">{brief.confidence_score}%</span>
          </div>
        </div>

        {/* Scores & Move Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-950 p-6 sm:p-7 rounded-2xl border border-white/15 shadow-xl">
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              MARKET MOVE SCORE
            </span>
            <div className="flex items-baseline gap-2 font-sans">
              <span className="text-5xl font-extrabold text-white">{brief.market_move_score}</span>
              <span className="text-lg text-zinc-500 font-bold">/ 100</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-blue-400 rounded-full"
                style={{ width: `${brief.market_move_score}%` }}
              />
            </div>
          </div>

          <div className="space-y-2 flex flex-col justify-center sm:items-end text-left sm:text-right">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              RECOMMENDED STRATEGIC MOVE
            </span>
            <span className={`inline-block font-sans text-lg font-extrabold tracking-wider px-5 py-2 rounded-xl border uppercase ${moveStyle}`}>
              {move}
            </span>
          </div>
        </div>

        {/* Situation Assessment */}
        {brief.action_pack.headline && (
          <div className="border border-white/10 bg-zinc-950 p-6 rounded-2xl space-y-3">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              SITUATION ASSESSMENT
            </span>
            <h2 className="text-xl font-extrabold text-white leading-snug">
              {brief.action_pack.headline}
            </h2>
            {brief.action_pack.situation && (
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
                {brief.action_pack.situation}
              </p>
            )}
          </div>
        )}

        {/* 3-Column Actions Grid */}
        <div className="space-y-3">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            RECOMMENDED ACTIONS
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ActionCard label="01 IMMEDIATE" items={actions.immediate ?? []} color="text-red-400" />
            <ActionCard label="02 THIS WEEK" items={actions.this_week ?? []} color="text-amber-400" />
            <ActionCard label="03 WATCH" items={actions.watch ?? []} color="text-blue-400" />
          </div>
        </div>

        {/* Rationale */}
        {brief.action_pack.coordinator_rationale && (
          <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-2">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
              COORDINATOR RATIONALE
            </span>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              {brief.action_pack.coordinator_rationale}
            </p>
          </div>
        )}

        {/* Public CTA Banner */}
        <div className="mt-12 text-center bg-zinc-950 p-8 rounded-2xl border border-white/15 shadow-2xl space-y-4">
          <p className="text-lg font-extrabold text-white">Want autonomous competitive intelligence for your team?</p>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">Run live multi-agent analyses on any competitor or strategic target.</p>
          <div className="flex justify-center pt-2">
            <Button asChild variant="primary" size="lg" className="font-bold text-xs uppercase tracking-wider">
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
          <span className="font-sans text-xs text-zinc-500 font-medium">
            StratOS AI · Autonomous Competitive Intelligence
          </span>
          <a
            href="https://github.com/pranav-bhagath19/StratOS-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-zinc-400 hover:text-white transition-colors"
          >
            github.com/pranav-bhagath19/StratOS-AI ↗
          </a>
        </div>
      </footer>
    </div>
  )
}

function ActionCard({
  label,
  items,
  color,
}: {
  label: string
  items: string[]
  color: string
}) {
  return (
    <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-3">
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <span className={`text-[10px] ${color} font-extrabold uppercase tracking-wider`}>
          {label}
        </span>
        <Zap className={`h-3.5 w-3.5 ${color}`} />
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-zinc-600">—</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
              <ArrowRight className={`h-3.5 w-3.5 ${color} shrink-0 mt-0.5`} />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
