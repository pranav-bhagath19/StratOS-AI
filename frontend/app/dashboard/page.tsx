"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { apiGet, apiPost } from "@/lib/api";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Divider } from "@/components/ui/Divider";
import { hyperspeedPresets } from "@/components/hyperspeed/HyperSpeedPresets";

import {
  AnalysisInput,
  type AnalysisType,
  type Preset,
  type AnalysisModule,
} from "@/components/intelligence/AnalysisInput";
import { AgentFlow } from "@/components/intelligence/AgentFlow";
import { AnalysisStatus } from "@/components/intelligence/AnalysisStatus";
import { ExecutiveBriefPanel, type Brief } from "@/components/reports/ExecutiveBrief";
import { SchedulesPanel, type Schedule } from "@/components/dashboard/RecentReports";
import { getStoredUser, type UserProfile } from "@/lib/auth";
import { AgentName, AgentState, AGENTS } from "@/components/intelligence/AgentStatus";

const Hyperspeed = dynamic(() => import("@/components/hyperspeed/Hyperspeed"), {
  ssr: false,
});

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

type Phase = "setup" | "running" | "complete" | "failed";
type Tab = "deploy" | "schedules";

const PRESETS: Preset[] = [
  {
    track: "WEDGE · COMPETITIVE INTEL",
    title: "NVIDIA",
    analysis: "account_pulse",
    target: "nvidia.com",
    tagline: "Track competitor architecture announcements & product rollouts.",
  },
  {
    track: "EXPANSION · SUPPLY CHAIN",
    title: "Boeing",
    analysis: "supplier_watch",
    target: "boeing.com",
    tagline: "Aerospace supplier under regulatory pressure — de-risk exposure.",
  },
  {
    track: "EXPANSION · SECURITY",
    title: "Change Healthcare",
    analysis: "threat_surface",
    target: "change.unitedhealthgroup.com",
    tagline: "Major healthcare cyber incident — monitor threat surface.",
  },
];

const ANALYSISS: AnalysisModule[] = [
  {
    type: "account_pulse",
    track: "WEDGE · COMPETITIVE INTEL",
    name: "Account Pulse",
    description: "Competitor moves, funding events, exec changes, product launches",
    tools: ["SERP API", "MCP Server", "Web Unlocker"],
  },
  {
    type: "supplier_watch",
    track: "EXPANSION · SUPPLY CHAIN",
    name: "Supplier Watch",
    description: "Financial health, risk signals, market position, contract exposure",
    tools: ["SERP API", "Web Scraper", "Playwright"],
  },
  {
    type: "threat_surface",
    track: "EXPANSION · SECURITY",
    name: "Threat Surface",
    description: "Breach history, CVEs, dark web exposure, domain reputation",
    tools: ["SERP API", "Web Unlocker", "MCP Server"],
  },
];

const INITIAL_AGENTS = (): Record<AgentName, AgentState> =>
  Object.fromEntries(
    AGENTS.map((a) => [a, { status: "idle", message: "" }])
  ) as Record<AgentName, AgentState>;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get("target") || "";

  const [tab, setTab] = useState<Tab>("deploy");
  const [phase, setPhase] = useState<Phase>("setup");
  const [selected, setSelected] = useState<AnalysisType>("account_pulse");
  const [target, setTarget] = useState(initialTarget);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [agents, setAgents] = useState<Record<AgentName, AgentState>>(INITIAL_AGENTS);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);
  const [, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const u = getStoredUser();
    if (!u) {
      router.push("/login?redirect=/dashboard&reason=auth_required");
    } else {
      setUser(u);
    }
  }, [router]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  const loadSchedules = useCallback(async () => {
    try {
      const data = await apiGet<Schedule[]>("/analyses/schedules");
      setSchedules(data);
    } catch {
      // schedules fallback
    }
  }, []);

  useEffect(() => {
    if (tab !== "schedules") return;
    let cancelled = false;
    (async () => {
      try {
        const data = await apiGet<Schedule[]>("/analyses/schedules");
        if (!cancelled) setSchedules(data);
      } catch {
        // empty fallback
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const pushLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-100), line]);
  }, []);

  const deployAnalysis = async (analysisTarget: string, analysisType: AnalysisType) => {
    if (isDeploying) return;

    setIsDeploying(true);
    esRef.current?.close();
    esRef.current = null;

    setLog([]);
    setAgents(INITIAL_AGENTS());
    setBrief(null);
    setAnalysisId(null);

    try {
      const res = await apiPost<{ analysis_id: string }>("/analyses/", {
        analysis_type: analysisType,
        target: analysisTarget,
        context: null,
      });
      setAnalysisId(res.analysis_id);
      setPhase("running");
      pushLog(`DEPLOYED analysis=${res.analysis_id.slice(0, 8)}`);
      startSSE(res.analysis_id);
    } catch (err) {
      setIsDeploying(false);
      toast.error("Deploy failed", {
        description: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleDeploy = async () => {
    if (!target.trim()) {
      toast.error("Target required", { description: "Enter a company name or domain." });
      return;
    }
    await deployAnalysis(target.trim(), selected);
  };

  const handlePresetDeploy = async (presetTarget: string, analysisType: AnalysisType) => {
    setSelected(analysisType);
    setTarget(presetTarget);
    await deployAnalysis(presetTarget, analysisType);
  };

  const startSSE = (id: string) => {
    const es = new EventSource(`${API_BASE}/analyses/${id}/stream`);
    esRef.current = es;

    es.addEventListener("intelligence_event", (e: MessageEvent) => {
      try {
        const d = JSON.parse(e.data as string) as {
          agent: string;
          event_type: string;
          message: string;
        };
        const { agent, event_type, message } = d;

        setAgents((prev) => {
          const next = { ...prev };
          const a = agent as AgentName;
          if (!AGENTS.includes(a)) return prev;
          if (["started", "thinking", "tool_call", "tool_result"].includes(event_type)) {
            next[a] = { status: "running", message };
          } else if (event_type === "completed") {
            next[a] = { status: "complete", message };
          } else if (event_type === "failed") {
            next[a] = { status: "failed", message };
          }
          return next;
        });

        const tag = agent.toUpperCase().padEnd(10);
        pushLog(`${tag}  ${event_type.padEnd(12)}  ${message}`);
      } catch {
        // ignore malformed events
      }
    });

    es.addEventListener("done", async () => {
      es.close();
      esRef.current = null;
      pushLog("─────────────  ANALYSIS COMPLETE  ─────────────");
      try {
        const r = await fetch(`${API_BASE}/analyses/${id}`);
        const data = (await r.json()) as { brief: Brief | null };
        if (data.brief) setBrief(data.brief);
      } catch {
        // best-effort
      }
      setIsDeploying(false);
      setPhase("complete");
    });

    es.onerror = () => {
      pushLog("SSE ERROR: connection dropped");
      setIsDeploying(false);
      setPhase("failed");
    };
  };

  const handleReset = () => {
    esRef.current?.close();
    esRef.current = null;
    setIsDeploying(false);
    setPhase("setup");
    setAnalysisId(null);
    setBrief(null);
    setLog([]);
    setAgents(INITIAL_AGENTS());
  };

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-6 pt-28 pb-16 font-sans">
      {phase === "setup" && (
        <div className="space-y-8 font-sans">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
            <div className="space-y-2">
              <SectionLabel>STRATOS AI COMMAND CONSOLE</SectionLabel>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Target Intelligence Workspace
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                Deploy autonomous multi-agent research scans across target accounts, supply chain nodes, and security surfaces.
              </p>
            </div>

            {/* Navigation Tabs */}
            <div className="inline-flex p-1 bg-zinc-950 border border-white/10 rounded-xl text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => setTab("deploy")}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  tab === "deploy"
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Deploy Scan
              </button>
              <button
                type="button"
                onClick={() => setTab("schedules")}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${
                  tab === "schedules"
                    ? "bg-white text-black font-bold shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Scheduled Reports
              </button>
            </div>
          </div>

          {tab === "deploy" ? (
            <AnalysisInput
              selected={selected}
              onSelect={setSelected}
              target={target}
              onTargetChange={setTarget}
              onDeploy={handleDeploy}
              onPresetDeploy={handlePresetDeploy}
              isDeploying={isDeploying}
              presets={PRESETS}
              modules={ANALYSISS}
            />
          ) : (
            <SchedulesPanel
              schedules={schedules}
              onRefresh={loadSchedules}
              onRunNow={handlePresetDeploy}
            />
          )}
        </div>
      )}

      {phase !== "setup" && (
        <div className="space-y-8 font-sans">
          {/* Status Header */}
          <AnalysisStatus
            target={target || "NVIDIA"}
            status={
              phase === "running"
                ? "RESEARCHING"
                : phase === "complete"
                ? "COMPLETE"
                : "FAILED"
            }
            moduleName={ANALYSISS.find((m) => m.type === selected)?.name}
            onReset={handleReset}
          />

          {/* Running Initialization Accent */}
          {phase === "running" && (
            <div className="relative border border-white/15 bg-black p-8 rounded-2xl overflow-hidden text-center space-y-4">
              <div className="absolute inset-0 opacity-25 pointer-events-none">
                <Hyperspeed effectOptions={hyperspeedPresets.six} />
              </div>
              <div className="relative z-10 space-y-2 font-sans">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>5-AGENT PIPELINE RUNNING LIVE TELEMETRY</span>
                </div>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Parsing live domain signals, executing Playwright web scrapers, and cross-verifying evidence.
                </p>
              </div>
            </div>
          )}

          {/* Agent Pipeline Flow */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              AGENT EXECUTION PIPELINE
            </span>
            <AgentFlow agents={agents} />
          </div>

          <Divider />

          {/* Live Telemetry Stream */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              TELEMETRY EVENT STREAM LOG
            </span>
            <div
              ref={logRef}
              className="overflow-y-auto p-4 font-mono text-xs text-zinc-400 space-y-1 max-h-56 bg-black border border-white/10 rounded-xl"
            >
              {log.length === 0 ? (
                <span className="text-zinc-600 italic">Connecting to agent telemetry feed…</span>
              ) : (
                log.map((line, i) => (
                  <div key={i} className="leading-relaxed border-b border-zinc-900 pb-0.5">
                    {line}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Executive Brief Output Report */}
          {phase === "complete" && brief && (
            <ExecutiveBriefPanel brief={brief} analysisId={analysisId} target={target} />
          )}
        </div>
      )}
    </main>
  );
}

export default function StratOSPage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-white selection:text-black">
      <Navbar />
      <Suspense fallback={
        <div className="min-h-[60vh] flex items-center justify-center text-zinc-500 text-xs font-sans">
          Loading workspace...
        </div>
      }>
        <DashboardContent />
      </Suspense>
      <Footer />
    </div>
  );
}
