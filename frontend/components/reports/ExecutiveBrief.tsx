"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Copy, Download, Link2, Send, X, Loader2, ShieldCheck, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { Divider } from "@/components/ui/Divider";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").replace(/\/+$/, "");

export type Brief = {
  market_move_score: number;
  recommended_move: string;
  confidence_score: number;
  executive_summary: string;
  action_pack: {
    headline?: string;
    situation?: string;
    actions?: { immediate?: string[]; this_week?: string[]; watch?: string[] };
    coordinator_rationale?: string;
  };
};

export type AnalysisDiff = {
  has_prior: boolean;
  prior_analysis_id?: string;
  prior_date?: string;
  score_delta?: number;
  confidence_delta?: number;
  move_changed?: boolean;
  prior_move?: string;
  current_move?: string;
  new_findings?: string[];
  resolved_findings?: string[];
  prior_summary?: string;
};

const MOVE_BADGE_STYLES: Record<string, string> = {
  ATTACK: "text-red-400 border-red-500/40 bg-red-500/10 shadow-lg",
  DEFEND: "text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-lg",
  ESCALATE: "text-red-300 border-red-400/40 bg-red-400/10 shadow-lg",
  WAIT: "text-zinc-400 border-zinc-600 bg-zinc-800/40",
  MONITOR: "text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-lg",
};

export function ExecutiveBriefPanel({
  brief,
  analysisId,
  target,
}: {
  brief: Brief;
  analysisId: string | null;
  target: string;
}) {
  const { market_move_score, confidence_score, action_pack } = brief;
  const recommended_move = (brief.recommended_move ?? "monitor").toUpperCase();
  const moveStyle = MOVE_BADGE_STYLES[recommended_move] ?? "text-blue-400 border-blue-500/40 bg-blue-500/10 shadow-lg";
  const actions = action_pack.actions ?? {};

  const [diff, setDiff] = useState<AnalysisDiff | null>(null);
  const [diffModal, setDiffModal] = useState(false);
  const [slackModal, setSlackModal] = useState(false);
  const [slackUrl, setSlackUrl] = useState(() =>
    typeof window !== "undefined" ? localStorage.getItem("stratos_slack_webhook") ?? "" : ""
  );
  const [slackSending, setSlackSending] = useState(false);

  useEffect(() => {
    if (!analysisId) return;
    let cancelled = false;
    fetch(`${API_BASE}/analyses/${analysisId}/diff`)
      .then((r) => r.json())
      .then((d: AnalysisDiff) => {
        if (!cancelled) setDiff(d.has_prior ? d : null);
      })
      .catch(() => {
        if (!cancelled) setDiff(null);
      });
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  const handleCopyMarkdown = () => {
    const lines = [
      `# STRATOS AI · EXECUTIVE BRIEF REPORT`,
      `Target: ${target}`,
      `Market Move Score: ${market_move_score}/100`,
      `Recommended Move: ${recommended_move}`,
      `Confidence Verification: ${confidence_score}/100`,
      ``,
      `## EXECUTIVE SUMMARY`,
      action_pack.headline ?? "",
      action_pack.situation ?? brief.executive_summary ?? "",
      ``,
      `## RECOMMENDED ACTIONS`,
      `### Immediate`,
      ...(actions.immediate ?? []).map((a) => `- ${a}`),
      `### This Week`,
      ...(actions.this_week ?? []).map((a) => `- ${a}`),
      `### Watch`,
      ...(actions.watch ?? []).map((a) => `- ${a}`),
      ``,
      `## COORDINATOR RATIONALE`,
      action_pack.coordinator_rationale ?? "",
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      toast.success("Intelligence Report copied to clipboard.");
    });
  };

  const handleDownloadPDF = async () => {
    if (!analysisId) return;
    try {
      const res = await fetch(`${API_BASE}/analyses/${analysisId}/brief/pdf`);
      if (!res.ok) {
        toast.error("PDF unavailable");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `stratos-report-${target.replace(/\./g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("PDF download failed.");
    }
  };

  const handleShare = async () => {
    if (!analysisId) return;
    try {
      const res = await fetch(`${API_BASE}/analyses/${analysisId}/brief/share`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const { share_url } = (await res.json()) as { share_url: string };
      const full = `${window.location.origin}${share_url}`;
      await navigator.clipboard.writeText(full);
      toast.success("Share link copied to clipboard.", { description: full });
    } catch {
      toast.error("Share failed.");
    }
  };

  const handleSendSlack = async () => {
    if (!analysisId || !slackUrl.trim()) return;
    localStorage.setItem("stratos_slack_webhook", slackUrl.trim());
    setSlackSending(true);
    try {
      const res = await fetch(`${API_BASE}/analyses/${analysisId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: slackUrl.trim(),
          share_base: window.location.origin,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Brief sent to Slack!");
      setSlackModal(false);
    } catch {
      toast.error("Slack delivery failed.");
    } finally {
      setSlackSending(false);
    }
  };

  return (
    <div className="space-y-8 font-sans max-w-4xl mx-auto border-t border-white/15 pt-10">
      {/* Run Comparison Delta Banner */}
      {diff && diff.has_prior && (
        <div className="border border-blue-500/30 bg-blue-500/10 p-4 rounded-xl flex items-center justify-between flex-wrap gap-4 font-sans text-xs">
          <div className="flex items-center gap-3">
            <span className="text-zinc-400 uppercase font-semibold">RUN DELTA VS PRIOR</span>
            <span className="text-blue-400 font-bold">
              Score {diff.score_delta ? (diff.score_delta > 0 ? `+${diff.score_delta}` : diff.score_delta) : "0"}
            </span>
          </div>
          <button onClick={() => setDiffModal(true)} className="text-zinc-300 hover:text-white underline font-semibold">
            View Run Comparison →
          </button>
        </div>
      )}

      {/* Editorial Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div className="space-y-2">
          <SectionLabel>EXECUTIVE INTELLIGENCE BRIEF</SectionLabel>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {target}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 bg-zinc-950 border border-white/15 px-3.5 py-2 rounded-xl shrink-0">
          <ShieldCheck className="h-4 w-4 text-blue-400" />
          <span>CONFIDENCE {confidence_score}%</span>
        </div>
      </div>

      {/* Market Move & Strategic Score Box */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-950 p-6 sm:p-7 rounded-2xl border border-white/15 shadow-xl">
        <div className="space-y-2">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            MARKET MOVE SCORE
          </span>
          <div className="flex items-baseline gap-2 font-sans">
            <span className="text-5xl font-extrabold text-white">{market_move_score}</span>
            <span className="text-lg text-zinc-500 font-bold">/ 100</span>
          </div>
          {/* Progress Bar Indicator */}
          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-blue-400 rounded-full transition-all duration-500"
              style={{ width: `${market_move_score}%` }}
            />
          </div>
        </div>

        <div className="space-y-2 flex flex-col justify-center sm:items-end text-left sm:text-right">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            RECOMMENDED STRATEGIC MOVE
          </span>
          <span className={`inline-block font-sans text-lg font-extrabold tracking-wider px-5 py-2 rounded-xl border uppercase ${moveStyle}`}>
            {recommended_move}
          </span>
        </div>
      </div>

      {/* Executive Summary & Situation Assessment */}
      <div className="border border-white/10 bg-zinc-950 p-6 rounded-2xl space-y-3">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
          SITUATION ASSESSMENT
        </span>
        <h2 className="text-xl font-extrabold text-white leading-snug">
          {action_pack.headline || `${target} Strategic Market Assessment`}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl">
          {action_pack.situation || brief.executive_summary}
        </p>
      </div>

      {/* Action Pack 3-Column Grid */}
      <div className="space-y-3">
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
          RECOMMENDED ACTIONS
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
          {/* Immediate Actions */}
          <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] text-red-400 font-extrabold uppercase tracking-wider">
                01 IMMEDIATE
              </span>
              <Zap className="h-3.5 w-3.5 text-red-400" />
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {(actions.immediate ?? ["Deploy competitive displacement campaign"]).map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* This Week Actions */}
          <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider">
                02 THIS WEEK
              </span>
              <Zap className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {(actions.this_week ?? ["Brief sales organization on product gap"]).map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Watch Actions */}
          <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[10px] text-blue-400 font-extrabold uppercase tracking-wider">
                03 WATCH
              </span>
              <Zap className="h-3.5 w-3.5 text-blue-400" />
            </div>
            <ul className="space-y-2 text-xs text-zinc-300">
              {(actions.watch ?? ["Track quarterly release telemetry"]).map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Coordinator Rationale */}
      {action_pack.coordinator_rationale && (
        <div className="border border-white/10 bg-zinc-950 p-5 rounded-2xl space-y-2">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
            COORDINATOR RATIONALE
          </span>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            {action_pack.coordinator_rationale}
          </p>
        </div>
      )}

      {/* Export & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-sans text-xs pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleCopyMarkdown} className="font-bold text-xs uppercase tracking-wider">
            <Copy className="h-3.5 w-3.5 mr-1.5" />
            Copy Markdown
          </Button>
          <Button variant="secondary" size="sm" onClick={handleDownloadPDF} className="font-bold text-xs uppercase tracking-wider">
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Download PDF
          </Button>
          <Button variant="secondary" size="sm" onClick={handleShare} className="font-bold text-xs uppercase tracking-wider">
            <Link2 className="h-3.5 w-3.5 mr-1.5" />
            Share Link
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSlackModal(true)} className="font-bold text-xs uppercase tracking-wider">
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Slack
          </Button>
        </div>
      </div>

      {/* Slack Modal */}
      {slackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-sans">
          <div className="border border-white/15 bg-zinc-950 p-6 rounded-2xl max-w-md w-full space-y-4 text-xs">
            <div className="flex justify-between items-center text-white">
              <span className="font-bold text-sm">SLACK INTEGRATION</span>
              <button onClick={() => setSlackModal(false)}><X className="h-4 w-4 text-zinc-400 hover:text-white" /></button>
            </div>
            <p className="text-zinc-400">Enter your Slack Webhook URL to post this brief to your channel.</p>
            <input
              type="url"
              value={slackUrl}
              onChange={(e) => setSlackUrl(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full bg-black border border-white/15 p-3 rounded-xl text-white font-mono"
            />
            <Button variant="primary" size="sm" onClick={handleSendSlack} disabled={slackSending} className="w-full font-bold uppercase tracking-wider">
              {slackSending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Send Report to Slack
            </Button>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {diffModal && diff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 font-sans">
          <div className="border border-white/15 bg-zinc-950 p-6 rounded-2xl max-w-lg w-full space-y-4 text-xs">
            <div className="flex justify-between items-center text-white">
              <span className="font-bold text-sm">RUN COMPARISON DELTA</span>
              <button onClick={() => setDiffModal(false)}><X className="h-4 w-4 text-zinc-400 hover:text-white" /></button>
            </div>
            <p className="text-zinc-300">Score Delta: <span className="font-bold text-white">{diff.score_delta}</span></p>
            {diff.prior_summary && <p className="text-zinc-400 leading-relaxed">{diff.prior_summary}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExecutiveBriefPanel;
