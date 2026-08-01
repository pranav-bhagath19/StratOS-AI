"""Recurring analysis schedules — CRUD + Inngest trigger."""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import client as db

log = logging.getLogger(__name__)
router = APIRouter(tags=["schedules"])


class ScheduleCreate(BaseModel):
    target: str
    analysis_type: str = "account_pulse"
    cron: str = "0 9 * * 1"  # Monday 9am UTC
    label: str | None = None
    slack_webhook_url: str | None = None


@router.get("/analyses/schedules")
async def list_schedules() -> list[dict]:
    """List all active recurring analysis schedules."""
    try:
        return await db.alist_schedules()
    except Exception as exc:
        log.warning("Failed to list schedules (table may not exist yet): %s", exc)
        return []


@router.post("/analyses/schedules", status_code=201)
async def create_schedule(body: ScheduleCreate) -> dict:
    """Register a new recurring analysis schedule."""
    schedule = await db.ainsert_schedule(
        target=body.target,
        analysis_type=body.analysis_type,
        cron=body.cron,
        label=body.label or f"{body.target} {body.analysis_type} — {body.cron}",
        slack_webhook_url=body.slack_webhook_url,
    )

    # Fire immediately via Inngest (best-effort — Inngest dev server may not be running).
    try:
        import inngest
        from intelligence.workflows.scheduler.inngest_client import client as inngest_client
        await inngest_client.send(inngest.Event(
            name="stratos/analyses.run",
            data={
                "target": body.target,
                "analysis_type": body.analysis_type,
                "schedule_id": schedule["id"],
            },
        ))
        log.info("Inngest event sent for schedule %s", schedule["id"])
    except Exception as exc:
        log.warning("Inngest send failed (dev server may not be running): %s", exc)

    return schedule


@router.delete("/analyses/schedules/{schedule_id}", status_code=204)
async def delete_schedule(schedule_id: str) -> None:
    """Pause/delete a recurring analysis schedule."""
    await db.adelete_schedule(schedule_id)
