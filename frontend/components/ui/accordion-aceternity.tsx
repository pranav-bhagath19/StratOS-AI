"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export type AccordionItem = {
  id: string
  question: string
  answer: string
}

export function AceternityAccordion({
  items,
  className,
}: {
  items: AccordionItem[]
  className?: string
}) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null)

  return (
    <div className={cn("space-y-3 max-w-3xl mx-auto font-sans", className)}>
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className="border border-white/10 rounded-xl bg-zinc-950 overflow-hidden transition-colors hover:border-white/20"
          >
            <button
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-sans font-bold text-sm sm:text-base text-white">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-zinc-400 transition-transform duration-200 shrink-0 ml-4",
                  isOpen && "transform rotate-180 text-white"
                )}
              />
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-white/10 font-normal">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
