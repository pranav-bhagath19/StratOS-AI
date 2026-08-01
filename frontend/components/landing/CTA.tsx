import React from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CTA() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24 font-sans bg-black">
      <div className="relative rounded-2xl border border-white/15 bg-zinc-950 p-10 text-center shadow-2xl overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Ready to automate your competitive intelligence?
          </h2>
          <p className="text-sm text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Run live multi-agent analyses on any competitor or market target right now.
          </p>
          <div className="pt-4 flex justify-center">
            <Button asChild variant="primary" size="lg">
              <Link href="/dashboard" className="flex items-center gap-2">
                Start Analysis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
