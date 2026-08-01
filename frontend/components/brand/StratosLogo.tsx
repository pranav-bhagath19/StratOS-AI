import React from "react"
import Link from "next/link"
import { Shield } from "lucide-react"

export function StratosLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-3 bg-black border border-white/10 rounded-full px-4 py-1.5 hover:border-white/20 transition-all shadow-md group ${className}`}
    >
      <Shield className="h-4 w-4 text-red-500 shrink-0 stroke-[1.8]" />
      <span className="font-mono text-xs font-bold tracking-[0.18em] text-white">
        StratOS
      </span>
      <span className="font-mono text-[9px] text-zinc-400 border border-zinc-700/80 px-1.5 py-0.5 rounded-[2px] tracking-wider uppercase">
        AI
      </span>
    </Link>
  )
}

export function Logo({ className = "" }: { className?: string }) {
  return <StratosLogo className={className} />
}
