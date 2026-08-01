"""Analysis routes — create, stream, and retrieve StratOS analyses."""

import asyncio
import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from intelligence.agents.base import events as ev
from intelligence.workflows.executive_brief.graph import analysis_graph
from intelligence.agents.base.state import AnalysisState
from intelligence.tools.manager import provider_manager
from backend.config.config import settings
from database import client as db
from backend.schemas.analysis import AnalysisCreate

router = APIRouter(tags=["analyses"])

# Prevent background tasks from being garbage collected before they finish.
_running_tasks: set[asyncio.Task] = set()


async def _run_analysis(
    analysis_id: str,
    analysis_type: str,
    target: str,
    context: str | None,
) -> None:
    """Run the LangGraph graph, persist results, signal SSE done."""
    try:
        await db.aupdate_analysis_status(analysis_id, "running")

        initial_state: AnalysisState = {
            "analysis_id": analysis_id,
            "analysis_type": analysis_type,
            "target": target,
            "context": context,
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

        final_state = await analysis_graph.ainvoke(initial_state)

        # Persist accumulated events
        for evt in final_state.get("events", []):
            try:
                await db.ainsert_intelligence_event(
                    analysis_id=analysis_id,
                    agent=evt["agent"],
                    event_type=evt["event_type"],
                    message=evt["message"],
                    payload=evt.get("payload"),
                    provider_product=evt.get("provider_product"),
                )
            except Exception:
                pass

        # Persist the Battle Brief
        await db.ainsert_brief(analysis_id, {
            "market_move_score": final_state.get("market_move_score", 0),
            "recommended_move": final_state.get("recommended_move", "MONITOR"),
            "confidence_score": final_state.get("confidence_score", 0),
            "executive_summary": final_state.get("executive_summary", ""),
            "action_pack": final_state.get("action_pack", {}),
            "provider_calls": final_state.get("provider_calls", []),
        })
        await db.aupdate_analysis_status(analysis_id, "completed")

    except Exception as exc:
        await db.aupdate_analysis_status(analysis_id, "failed")
        await ev.emit(analysis_id, "coordinator", "failed", f"Analysis failed: {exc}")

    finally:
        await ev.emit_done(analysis_id)


# ── Routes — literal paths MUST come before /{analysis_id} ────────────────────

@router.get("/hello")
async def hello_analysis() -> dict:
    """Smoke-test: verifies search provider reachability and openrouter config."""
    if not settings.openrouter_api_key:
        return {
            "status": "config_needed",
            "message": "Set OPENROUTER_API_KEY in .env",
        }
    try:
        results = await provider_manager.search("war room AI hackathon", limit=3)
        return {
            "status": "ok",
            "search_reachable": True,
            "sample_titles": [r.get("title", "(no title)") for r in results],
        }
    except Exception as exc:
        return {"status": "error", "search_reachable": False, "error": str(exc)}


@router.post("/", status_code=201)
async def create_analysis(body: AnalysisCreate) -> dict:
    """Create a new analysis and launch the 5-agent LangGraph pipeline."""
    analysis = await db.ainsert_analysis(body.target, body.analysis_type.value, body.context)
    analysis_id = str(analysis["id"])
    ev.create_queue(analysis_id)
    task = asyncio.create_task(
        _run_analysis(analysis_id, body.analysis_type.value, body.target, body.context)
    )
    _running_tasks.add(task)
    task.add_done_callback(_running_tasks.discard)
    return {"analysis_id": analysis_id, "status": "queued"}


@router.get("/")
async def list_analyses(limit: int = 20) -> list[dict]:
    return await db.alist_analyses(limit=limit)


@router.get("/{analysis_id}/stream")
async def stream_analysis(analysis_id: str):
    """SSE stream for a running analysis. Replays history then streams live events."""

    async def event_generator():
        # Replay past events persisted in Firestore
        past = await db.alist_intelligence_events(analysis_id)
        for evt in past:
            yield {
                "event": "intelligence_event",
                "data": json.dumps({
                    "agent": evt["agent"],
                    "event_type": evt["event_type"],
                    "message": evt["message"],
                    "provider_product": evt.get("provider_product"),
                    "payload": evt.get("payload") or {},
                }),
            }

        # Stream live events from the in-memory queue
        q = ev.get_queue(analysis_id)
        if q is None:
            # Analysis already finished or never started — send done immediately
            yield {"event": "done", "data": json.dumps({"message": "no active stream"})}
            return

        while True:
            item = await q.get()
            if item.get("__done__"):
                yield {"event": "done", "data": json.dumps({"message": "analysis complete"})}
                ev.remove_queue(analysis_id)
                return
            yield {"event": "intelligence_event", "data": json.dumps(item)}

    return EventSourceResponse(event_generator())


@router.get("/{analysis_id}/diff")
async def get_analysis_diff(analysis_id: str) -> dict:
    """Compare this analysis's brief to the most recent prior run on the same target+type."""
    analysis = await db.aget_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    current_brief = await db.aget_brief_by_analysis(analysis_id)
    if not current_brief:
        return {"has_prior": False}

    prior_analysis = await db.afind_prior_analysis(
        target=analysis["target"],
        analysis_type=analysis["analysis_type"],
        exclude_id=analysis_id,
    )
    if not prior_analysis:
        return {"has_prior": False}

    prior_brief = await db.aget_brief_by_analysis(str(prior_analysis["id"]))
    if not prior_brief:
        return {"has_prior": False}

    score_delta = current_brief["market_move_score"] - prior_brief["market_move_score"]
    confidence_delta = current_brief["confidence_score"] - prior_brief["confidence_score"]
    current_move = (current_brief.get("recommended_move") or "").upper()
    prior_move = (prior_brief.get("recommended_move") or "").upper()

    def _actions(b: dict) -> list[str]:
        ap = b.get("action_pack") or {}
        acts = ap.get("actions") or {}
        return (acts.get("immediate") or []) + (acts.get("this_week") or []) + (acts.get("watch") or [])

    def _jaccard(a: str, b: str) -> float:
        ta, tb = set(a.lower().split()), set(b.lower().split())
        if not ta or not tb:
            return 0.0
        return len(ta & tb) / len(ta | tb)

    def _matched(item: str, pool: list[str], thresh: float = 0.4) -> bool:
        return any(_jaccard(item, p) >= thresh for p in pool)

    cur_acts = _actions(current_brief)
    pri_acts = _actions(prior_brief)
    new_findings = [a for a in cur_acts if not _matched(a, pri_acts)][:3]
    resolved_findings = [a for a in pri_acts if not _matched(a, cur_acts)][:3]

    return {
        "has_prior": True,
        "prior_analysis_id": str(prior_analysis["id"]),
        "prior_date": prior_analysis.get("created_at"),
        "score_delta": score_delta,
        "confidence_delta": confidence_delta,
        "move_changed": current_move != prior_move,
        "prior_move": prior_move,
        "current_move": current_move,
        "new_findings": new_findings,
        "resolved_findings": resolved_findings,
        "prior_summary": ((prior_brief.get("action_pack") or {}).get("situation") or ""),
    }


@router.post("/{analysis_id}/notify")
async def notify_slack(analysis_id: str, body: dict) -> dict:
    """Post a formatted Battle Brief to a Slack webhook (Slack Block Kit)."""
    webhook_url: str = body.get("webhook_url", "").strip()
    share_base: str = body.get("share_base", "http://localhost:3000").rstrip("/")

    if not webhook_url:
        raise HTTPException(status_code=400, detail="webhook_url is required")

    analysis = await db.aget_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    brief = await db.aget_brief_by_analysis(analysis_id)
    if not brief:
        raise HTTPException(status_code=404, detail="Brief not ready yet")

    import httpx

    target = analysis.get("target", "")
    analysis_type = analysis.get("analysis_type", "").replace("_", " ").upper()
    score = brief.get("market_move_score", 0)
    move = (brief.get("recommended_move") or "MONITOR").upper()
    confidence = brief.get("confidence_score", 0)
    action_pack = brief.get("action_pack") or {}
    headline = action_pack.get("headline", "")
    situation = action_pack.get("situation", "")
    actions = action_pack.get("actions") or {}
    immediate = actions.get("immediate") or []

    _MOVE_EMOJI = {
        "ATTACK": ":red_circle:", "DEFEND": ":large_yellow_circle:",
        "ESCALATE": ":rotating_light:", "WAIT": ":pause_button:",
        "MONITOR": ":eye:",
    }
    move_emoji = _MOVE_EMOJI.get(move, ":white_circle:")
    share_url = f"{share_base}/share/{analysis_id}"

    # Truncate long text for Slack's 3000-char section limit.
    summary = (headline + "\n" + situation).strip()
    if len(summary) > 500:
        summary = summary[:497] + "..."

    immediate_text = "\n".join(f"> :arrow_right: {a}" for a in immediate[:3])

    blocks = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"StratOS AI — {target} | {move_emoji} {move}"},
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Analysis:*\n{analysis_type}"},
                {"type": "mrkdwn", "text": f"*Market Move Score:*\n*{score}/100*"},
                {"type": "mrkdwn", "text": f"*Recommended Move:*\n{move_emoji} *{move}*"},
                {"type": "mrkdwn", "text": f"*Confidence:*\n{confidence}/100"},
            ],
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Situation*\n{summary}"},
        },
    ]

    if immediate_text:
        blocks.append({
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*Immediate Actions*\n{immediate_text}"},
        })

    blocks += [
        {"type": "divider"},
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": "Generated by *StratOS AI* · Powered by *Bright Data*"},
            ],
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "View Full Brief"},
                    "url": share_url,
                    "style": "primary",
                },
            ],
        },
    ]

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(webhook_url, json={"blocks": blocks})
        if resp.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"Slack returned {resp.status_code}: {resp.text[:200]}",
            )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Could not reach Slack: {exc}")

    return {"ok": True, "target": target, "move": move, "score": score}


@router.get("/{analysis_id}")
async def get_analysis(analysis_id: str) -> dict:
    analysis = await db.aget_analysis(analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    try:
        brief = await db.aget_brief_by_analysis(analysis_id)
    except Exception:
        brief = None  # brief may not exist yet — always return 200
    return {"analysis": analysis, "brief": brief}
