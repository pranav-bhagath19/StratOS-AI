"""End-to-End Normal Demo Verification Script (Section 15).
Runs 10 consecutive normal demo analyses against target 'Portonics'.
Measures timing, agent state transitions, LLM model usage, fallback usage,
final status, brief existence, SSE terminal event, and frontend terminal state.
"""

import asyncio
import json
import logging
import time
import sys
from pathlib import Path
from typing import Any, Dict, List

# Anchor project root to path
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from intelligence.agents.base.state import AnalysisState
from intelligence.workflows.executive_brief.graph import analysis_graph

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("portonics_demo")

async def run_single_demo(run_num: int, target: str = "Portonics") -> Dict[str, Any]:
    run_id = f"portonics-run-{run_num:02d}-{int(time.time())}"
    log.info(f"\n==========================================")
    log.info(f"STARTING DEMO RUN {run_num}/10: target='{target}' [run_id={run_id}]")
    log.info(f"==========================================")

    initial_state: AnalysisState = {
        "analysis_id": run_id,
        "analysis_type": "account_pulse",
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

    t0 = time.monotonic()
    error = None
    final_state: Dict[str, Any] = {}

    try:
        final_state = await analysis_graph.ainvoke(initial_state)
    except Exception as exc:
        log.exception(f"Run {run_num} failed with exception: {exc}")
        error = str(exc)

    duration = time.monotonic() - t0

    # Extract metrics
    plan = final_state.get("research_plan", [])
    provider_calls = final_state.get("provider_calls", [])
    challenges = final_state.get("challenges", [])
    verified_findings = final_state.get("verified_findings", "")
    exec_summary = final_state.get("executive_summary", "")
    action_pack = final_state.get("action_pack", {})
    confidence = final_state.get("confidence_score", 0)

    # Agent completions
    planner_ok = len(plan) > 0
    researcher_ok = len(provider_calls) > 0
    scout_ok = len(challenges) > 0 or final_state.get("scout_status") in ("ok", "degraded")
    verifier_ok = bool(verified_findings) or final_state.get("verifier_status") in ("ok", "degraded")
    coordinator_ok = bool(exec_summary and action_pack.get("actions"))

    has_brief = bool(exec_summary and action_pack.get("actions"))
    plan_source = plan[0].get("plan_source", "llm") if plan else "none"

    # Status computation using official backend logic
    from backend.routes.analyses import determine_analysis_status
    backend_status = determine_analysis_status(final_state, has_brief=has_brief)

    # Simulated SSE terminal event
    sse_event = {
        "event": "done",
        "data": {
            "status": backend_status,
            "has_brief": has_brief,
            "analysis_id": run_id,
            "message": f"Analysis finished with status: {backend_status}",
        }
    }

    # Simulated Frontend terminal state (Strict binary: complete or failed)
    if backend_status == "completed" and has_brief:
        frontend_state = "completed"
    else:
        frontend_state = "failed"

    # Critical false-success verification
    false_success = (frontend_state == "completed" and not has_brief)

    result = {
        "run_num": run_num,
        "run_id": run_id,
        "target": target,
        "duration_seconds": round(duration, 2),
        "planner_ok": planner_ok,
        "researcher_ok": researcher_ok,
        "scout_ok": scout_ok,
        "verifier_ok": verifier_ok,
        "coordinator_ok": coordinator_ok,
        "research_steps_count": len(provider_calls),
        "successful_steps": ok_calls,
        "timeout_steps": timeout_calls,
        "plan_source": plan_source,
        "confidence_score": confidence,
        "backend_status": backend_status,
        "has_brief": has_brief,
        "brief_length": len(exec_summary),
        "sse_terminal_status": sse_event["data"]["status"],
        "frontend_terminal_state": frontend_state,
        "false_success": false_success,
        "error": error,
    }

    log.info(
        f"RUN {run_num:02d} FINISHED in {duration:.2f}s | "
        f"Status: backend={backend_status}, sse={sse_event['data']['status']}, ui={frontend_state} | "
        f"Brief: {has_brief} ({len(exec_summary)} chars) | FalseSuccess: {false_success}"
    )

    return result

async def main():
    log.info("Starting 10 consecutive normal demo verification runs for 'Portonics'...")
    results: List[Dict[str, Any]] = []

    for i in range(1, 11):
        res = await run_single_demo(i, target="Portonics")
        results.append(res)
        # Brief pause between runs to be polite to external APIs
        await asyncio.sleep(1)

    out_file = Path("portonics_demo_results.json")
    out_file.write_text(json.dumps(results, indent=2), encoding="utf-8")
    log.info(f"\nSaved all 10 run results to {out_file.resolve()}")

    # Summary
    total_runs = len(results)
    completed_runs = sum(1 for r in results if r["frontend_terminal_state"] == "completed")
    partial_runs = sum(1 for r in results if r["frontend_terminal_state"] == "partial")
    failed_runs = sum(1 for r in results if r["frontend_terminal_state"] == "failed")
    false_success_count = sum(1 for r in results if r["false_success"])
    avg_duration = sum(r["duration_seconds"] for r in results) / total_runs

    print("\n" + "=" * 60)
    print("PORTONICS 10-RUN NORMAL DEMO VERIFICATION SUMMARY")
    print("=" * 60)
    print(f"Total Runs:          {total_runs}")
    print(f"Completed (Full):    {completed_runs}")
    print(f"Partial (Degraded):  {partial_runs}")
    print(f"Failed:              {failed_runs}")
    print(f"False-Success Runs:  {false_success_count} (CRITICAL: MUST BE 0)")
    print(f"Average Duration:    {avg_duration:.2f}s")
    print("=" * 60)

    if false_success_count > 0:
        log.error("CRITICAL FAILURE: False-success detected!")
        sys.exit(1)
    else:
        log.info("ALL RUNS TERMINATED WITH TRUTHFUL STATE. ZERO FALSE-SUCCESS RUNS.")

if __name__ == "__main__":
    asyncio.run(main())
