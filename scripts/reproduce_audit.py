"""Comprehensive audit reproduction script for StratOS-AI five-agent pipeline.
Instruments and logs timing, state transitions, tool results, and failure modes.
"""

import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Any

# Anchor project root to path
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from backend.config.config import settings
from intelligence.agents.base.state import AnalysisState
from intelligence.agents.planner.agent import run_planner
from intelligence.agents.researcher.agent import run_researcher
from intelligence.agents.scout.agent import run_scout
from intelligence.agents.verifier.agent import run_verifier
from intelligence.agents.coordinator.agent import run_coordinator
from intelligence.workflows.executive_brief.graph import analysis_graph
from intelligence.tools.manager import provider_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("audit")

async def test_agent_chain(target: str = "anthropic.com", analysis_type: str = "account_pulse"):
    run_id = f"audit-{int(time.time())}"
    print(f"\n========================================================")
    print(f"RUN ID: {run_id}")
    print(f"Target: {target} | Type: {analysis_type}")
    print(f"========================================================")
    
    state: AnalysisState = {
        "analysis_id": run_id,
        "analysis_type": analysis_type,
        "target": target,
        "context": None,
        "research_plan": [],
        "raw_findings": "",
        "provider_calls": [],
        "challenges": [],
        "verified_findings": "",
        "confidence_score": 0,
        "market_move_score": 0,
        "recommended_move": "MONITOR",
        "executive_summary": "",
        "action_pack": {},
        "events": [],
    }

    # 1. Planner
    t0 = time.monotonic()
    print(f"\n[{time.strftime('%X')}] 1. PLANNER START")
    try:
        planner_res = await run_planner(state)
        d1 = time.monotonic() - t0
        state.update(planner_res)  # type: ignore
        plan = state.get("research_plan", [])
        print(f"[{time.strftime('%X')}] 1. PLANNER END ({d1:.2f}s) — Generated {len(plan)} steps")
        for s in plan:
            print(f"   Step {s.get('step')}: [{s.get('tool')}] {s.get('goal')} -> {s.get('query_or_url')}")
    except Exception as e:
        print(f"[{time.strftime('%X')}] 1. PLANNER FAILED ({time.monotonic() - t0:.2f}s): {type(e).__name__}: {e}")
        return False

    # 2. Researcher
    t0 = time.monotonic()
    print(f"\n[{time.strftime('%X')}] 2. RESEARCHER START")
    try:
        researcher_res = await run_researcher(state)
        d2 = time.monotonic() - t0
        state.update(researcher_res)  # type: ignore
        calls = state.get("provider_calls", [])
        findings_len = len(state.get("raw_findings", ""))
        print(f"[{time.strftime('%X')}] 2. RESEARCHER END ({d2:.2f}s) — {len(calls)} calls, raw findings: {findings_len} chars")
        for c in calls:
            print(f"   Call: tool={c.get('tool')} product={c.get('product')} status={c.get('status')} ok={c.get('ok')} latency={c.get('latency_ms')}ms")
    except Exception as e:
        print(f"[{time.strftime('%X')}] 2. RESEARCHER FAILED ({time.monotonic() - t0:.2f}s): {type(e).__name__}: {e}")
        return False

    # 3. Scout
    t0 = time.monotonic()
    print(f"\n[{time.strftime('%X')}] 3. SCOUT START")
    try:
        scout_res = await run_scout(state)
        d3 = time.monotonic() - t0
        state.update(scout_res)  # type: ignore
        challenges = state.get("challenges", [])
        print(f"[{time.strftime('%X')}] 3. SCOUT END ({d3:.2f}s) — {len(challenges)} challenges")
        for ch in challenges:
            print(f"   Challenge: {ch}")
    except Exception as e:
        print(f"[{time.strftime('%X')}] 3. SCOUT FAILED ({time.monotonic() - t0:.2f}s): {type(e).__name__}: {e}")
        return False

    # 4. Verifier
    t0 = time.monotonic()
    print(f"\n[{time.strftime('%X')}] 4. VERIFIER START")
    try:
        verifier_res = await run_verifier(state)
        d4 = time.monotonic() - t0
        state.update(verifier_res)  # type: ignore
        conf = state.get("confidence_score")
        print(f"[{time.strftime('%X')}] 4. VERIFIER END ({d4:.2f}s) — Confidence: {conf}/100, verified findings: {len(state.get('verified_findings', ''))} chars")
    except Exception as e:
        print(f"[{time.strftime('%X')}] 4. VERIFIER FAILED ({time.monotonic() - t0:.2f}s): {type(e).__name__}: {e}")
        return False

    # 5. Coordinator
    t0 = time.monotonic()
    print(f"\n[{time.strftime('%X')}] 5. COORDINATOR START")
    try:
        coord_res = await run_coordinator(state)
        d5 = time.monotonic() - t0
        state.update(coord_res)  # type: ignore
        score = state.get("market_move_score")
        move = state.get("recommended_move")
        print(f"[{time.strftime('%X')}] 5. COORDINATOR END ({d5:.2f}s) — Move: {move}, Score: {score}/100")
        print(f"   Headline: {state.get('action_pack', {}).get('headline')}")
        print(f"   Executive Summary: {state.get('executive_summary')}")
    except Exception as e:
        print(f"[{time.strftime('%X')}] 5. COORDINATOR FAILED ({time.monotonic() - t0:.2f}s): {type(e).__name__}: {e}")
        return False

    print("\n[ALL 5 AGENTS COMPLETED SUCCESSFULLY]")
    return True

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "anthropic.com"
    atype = sys.argv[2] if len(sys.argv) > 2 else "account_pulse"
    asyncio.run(test_agent_chain(target, atype))
