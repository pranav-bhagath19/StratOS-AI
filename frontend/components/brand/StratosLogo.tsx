import React from "react"
import Link from "next/link"

export function StratosLogo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 bg-black border border-white/10 rounded-full px-3.5 py-1.5 hover:border-white/25 transition-all shadow-md group ${className}`}
    >
      <img
        src="/logo-icon.png"
        alt="StratOS AI Logo"
        className="h-5 w-5 object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
      />
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-bold tracking-[0.16em] text-white">
          StratOS
        </span>
        <span className="font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-[3px] tracking-wider uppercase">
          AI
        </span>
      </div>
    </Link>
  )
}

export function Logo({ className = "" }: { className?: string }) {
  return <StratosLogo className={className} />
}
