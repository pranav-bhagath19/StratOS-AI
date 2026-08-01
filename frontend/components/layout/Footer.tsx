import React from "react"
import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { Badge } from "@/components/ui/badge"

export function Footer() {
  return (
    <footer className="relative z-20 border-t border-white/10 bg-black font-sans text-zinc-400">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Col */}
          <div className="space-y-4 md:col-span-2">
            <Logo />
            <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
              Autonomous multi-agent competitive intelligence. Researching competitors, tracking market signals, verifying evidence, and generating strategy in real time.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["LangGraph", "FastAPI", "Next.js", "Playwright", "OpenRouter"].map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="font-mono text-[9px] text-zinc-400 border-white/10 bg-zinc-950 px-2 py-0.5"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="font-mono text-xs font-bold text-white tracking-wider uppercase">Platform</p>
            <ul className="space-y-2 text-xs font-mono">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/#platform" className="hover:text-white transition-colors">Architecture</Link>
              </li>
              <li>
                <Link href="/#intelligence" className="hover:text-white transition-colors">Multi-Agent Network</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">Console Workspace</Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div className="space-y-3">
            <p className="font-mono text-xs font-bold text-white tracking-wider uppercase">Intelligence Engine</p>
            <ul className="space-y-2 text-xs font-mono text-zinc-400">
              <li>Account Pulse</li>
              <li>Supplier Watch</li>
              <li>Threat Surface</li>
              <li>Inngest Schedules</li>
              <li>Playwright Scrapers</li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} StratOS AI. Autonomous Competitive Intelligence.</p>
          <a
            href="https://github.com/pranav-bhagath19/StratOS-AI"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            github.com/pranav-bhagath19/StratOS-AI ↗
          </a>
        </div>
      </div>
    </footer>
  )
}
