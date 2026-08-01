"use client"

// Day 3: Executive Strategic Brief renderer.
// Displays: headline, situation, key findings per agent, action pack,
// citations with confidence bars, and the full coordinator rationale.

export type ExecutiveBriefProps = {
  analysisId: string
  marketMoveScore: number
  recommendedMove: "ATTACK" | "DEFEND" | "WAIT" | "ESCALATE" | "MONITOR"
  headline: string
  situation: string
  actionPack: string[]
}

export function ExecutiveBrief({ headline, recommendedMove }: ExecutiveBriefProps) {
  return (
    <div className="border border-zinc-800 bg-zinc-900/20 p-6">
      <p className="font-mono text-[10px] text-zinc-600 tracking-widest mb-2">
        EXECUTIVE BATTLE BRIEF — Day 3
      </p>
      <p className="font-mono text-xs text-red-500">{recommendedMove}</p>
      <p className="text-sm text-zinc-300 mt-2">{headline}</p>
    </div>
  )
}
