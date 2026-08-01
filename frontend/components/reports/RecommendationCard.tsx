import React from "react"
import { Card } from "@/components/ui/card"

export function ActionColumn({
  label,
  items,
  accentClass,
}: {
  label: string
  items: string[]
  accentClass: string
}) {
  return (
    <Card className={`border p-4 font-sans ${accentClass}`}>
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
