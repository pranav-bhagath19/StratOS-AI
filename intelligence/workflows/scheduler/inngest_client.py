"""Inngest client and scheduled analysis functions for StratOS AI.

Dev server:  npx inngest-cli@latest dev -u http://localhost:8000/api/inngest
Docs:        https://www.inngest.com/docs/sdk/serve
"""

import logging

import inngest

log = logging.getLogger(__name__)

client = inngest.Inngest(app_id="stratos-ai", is_production=False)


@client.create_function(
    fn_id="analyses-run",
    trigger=inngest.TriggerEvent(event="stratos/analyses.run"),
)
async def run_analysis_fn(ctx: inngest.Context, step: inngest.Step) -> dict:
    """Event-triggered: run any analysis from a schedule or ad-hoc trigger."""
    target: str = ctx.event.data.get("target", "")
    analysis_type: str = ctx.event.data.get("analysis_type", "account_pulse")
    schedule_id: str | None = ctx.event.data.get("schedule_id")

    if not target:
        return {"error": "target is required"}

    log.info("Inngest: running analysis target=%s type=%s", target, analysis_type)

    from database import client as db
    from intelligence.agents.base import events as ev
    from intelligence.workflows.executive_brief.graph import analysis_graph
    from intelligence.agents.base.state import AnalysisState
    import asyncio

    analysis = await db.ainsert_analysis(target, analysis_type)
    analysis_id = str(analysis["id"])
    ev.create_queue(analysis_id)

    initial_state: AnalysisState = {
        "analysis_id": analysis_id,
        "analysis_type": analysis_type,
        "target": target,
        "context": f"Recurring schedule (id={schedule_id})" if schedule_id else None,
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

    try:
        await db.aupdate_analysis_status(analysis_id, "running")
        final_state = await analysis_graph.ainvoke(initial_state)

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

        await db.ainsert_brief(analysis_id, {
            "market_move_score": final_state.get("market_move_score", 0),
            "recommended_move": final_state.get("recommended_move", "MONITOR"),
            "confidence_score": final_state.get("confidence_score", 0),
            "executive_summary": final_state.get("executive_summary", ""),
            "action_pack": final_state.get("action_pack", {}),
            "provider_calls": final_state.get("provider_calls", []),
        })
        await db.aupdate_analysis_status(analysis_id, "completed")

        if schedule_id:
            try:
                await db.amark_schedule_ran(schedule_id, analysis_id)
            except Exception:
                pass

    except Exception as exc:
        log.error("Inngest analysis failed: %s", exc)
        try:
            await db.aupdate_analysis_status(analysis_id, "failed")
        except Exception:
            pass
    finally:
        try:
            await ev.emit_done(analysis_id)
        except Exception:
            pass

    return {"analysis_id": analysis_id, "status": "completed"}


@client.create_function(
    fn_id="analyses-weekly-anthropic",
    trigger=inngest.TriggerCron(cron="0 9 * * 1"),  # Monday 9am UTC
)
async def weekly_anthropic_fn(ctx: inngest.Context, step: inngest.Step) -> dict:
    """Pre-loaded schedule: Anthropic account_pulse every Monday 9am UTC."""
    await step.send_event(
        "trigger-anthropic",
        inngest.Event(
            name="stratos/analyses.run",
            data={
                "target": "anthropic.com",
                "analysis_type": "account_pulse",
                "schedule_id": "preset-anthropic",
            },
        ),
    )
    return {"triggered": True}


FUNCTIONS = [run_analysis_fn, weekly_anthropic_fn]
