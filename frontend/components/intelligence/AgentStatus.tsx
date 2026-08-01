"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Loader2, CheckCircle2, XCircle, Activity } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

export type AgentStatus = "idle" | "running" | "complete" | "failed"
export type AgentState = { status: AgentStatus; message: string }
export const AGENTS = ["planner", "researcher", "scout", "verifier", "coordinator"] as const
export type AgentName = (typeof AGENTS)[number]

export function AgentStatusPipeline({
  agents,
}: {
  agents: Record<AgentName, AgentState>
}) {
  return (
    <Card className="border border-white/10 bg-zinc-950 font-sans">
      <CardHeader className="border-b border-white/10 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-zinc-300 tracking-wider flex items-center gap-2">
            <Activity className="h-4 w-4 text-white" />
            5-AGENT EXECUTION PIPELINE
          </span>
          <span className="font-mono text-[10px] text-zinc-500">LangGraph Orchestration</span>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex flex-col gap-2">
        {AGENTS.map((name) => (
          <AgentRow key={name} name={name} state={agents[name]} />
        ))}
      </CardContent>
    </Card>
  )
}

function AgentRow({ name, state }: { name: AgentName; state: AgentState }) {
  const { status, message } = state
  return (
    <motion.div
      className="flex items-center gap-4 px-2 py-2 rounded-lg hover:bg-zinc-900/60"
      animate={{ opacity: status === "idle" ? 0.4 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="w-5 shrink-0 flex justify-center">
        {status === "idle" && <span className="w-2 h-2 rounded-full bg-zinc-800" />}
        {status === "running" && <Loader2 className="h-4 w-4 text-amber-400 animate-spin" />}
        {status === "complete" && (
          <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400 }}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </motion.div>
        )}
        {status === "failed" && <XCircle className="h-4 w-4 text-red-500" />}
      </div>

      <span
        className={`font-mono text-xs w-28 shrink-0 font-bold ${
          status === "idle"
            ? "text-zinc-600"
            : status === "running"
            ? "text-amber-300"
            : status === "complete"
            ? "text-emerald-400"
            : "text-red-400"
        }`}
      >
        {name.toUpperCase()}
      </span>

      <AnimatePresence mode="wait">
        <motion.span
          key={message}
          initial={{ opacity: 0, x: 4 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="font-mono text-xs text-zinc-400 truncate flex-1"
        >
          {status === "idle" ? "—" : message}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  )
}
