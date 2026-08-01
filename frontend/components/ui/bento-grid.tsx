"use client"

import React from "react"
import { cn } from "@/lib/utils"

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string
  children?: React.ReactNode
}) => {
  return (
    <div
      className={cn(
        "grid md:auto-rows-[18rem] grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto font-sans",
        className
      )}
    >
      {children}
    </div>
  )
}

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
  badge,
}: {
  className?: string
  title?: string | React.ReactNode
  description?: string | React.ReactNode
  header?: React.ReactNode
  icon?: React.ReactNode
  badge?: string
}) => {
  return (
    <div
      className={cn(
        "row-span-1 rounded-xl p-5 bg-zinc-950 border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all duration-200 group/bento relative overflow-hidden",
        className
      )}
    >
      {header}

      <div className="group-hover/bento:translate-x-1 transition duration-200 relative z-10">
        <div className="flex items-center justify-between mb-2">
          {icon}
          {badge && (
            <span className="font-mono text-[9px] text-zinc-300 border border-white/10 bg-zinc-900 px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        <div className="font-sans font-bold text-white mb-1 text-base">
          {title}
        </div>
        <div className="font-sans text-xs text-zinc-400 leading-relaxed">
          {description}
        </div>
      </div>
    </div>
  )
}
