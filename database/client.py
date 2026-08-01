import asyncio
import logging
import uuid
from uuid import UUID
from datetime import datetime, timezone

# Import Restructured Repositories
from database.repositories.analysis_repository import AnalysisRepository
from database.repositories.brief_repository import BriefRepository
from database.repositories.event_repository import EventRepository
from database.repositories.citation_repository import CitationRepository
from database.repositories.schedule_repository import ScheduleRepository
from database.repositories.cache_repository import CacheRepository

log = logging.getLogger(__name__)

# Instantiate global shared repositories
analysis_repo = AnalysisRepository()
brief_repo = BriefRepository()
event_repo = EventRepository()
citation_repo = CitationRepository()
schedule_repo = ScheduleRepository()
cache_repo = CacheRepository()

def _map_agent_to_db(agent: str) -> str:
    agent_lower = agent.lower() if agent else ""
    if agent_lower == "coordinator":
        return "commander"
    if agent_lower == "scout":
        return "skeptic"
    return agent_lower

def _map_agent_from_db(agent: str) -> str:
    agent_lower = agent.lower() if agent else ""
    if agent_lower == "commander":
        return "coordinator"
    if agent_lower == "skeptic":
        return "scout"
    return agent_lower


# ── Analyses ──

def insert_analysis(target: str, analysis_type: str, context: str | None = None) -> dict:
    analysis_id = str(uuid.uuid4())
    log.info(f"Database: Inserting analysis {analysis_id} for target {target}")
    return analysis_repo.insert(analysis_id, target, analysis_type, context, status="queued")

def update_analysis_status(analysis_id: UUID | str, status: str) -> None:
    log.info(f"Database: Updating analysis {analysis_id} status to {status}")
    analysis_repo.update_status(str(analysis_id), status)

def get_analysis(analysis_id: UUID | str) -> dict | None:
    return analysis_repo.get(str(analysis_id))

def list_analyses(limit: int = 20, offset: int = 0) -> list[dict]:
    return analysis_repo.list_all(limit, offset)

def find_prior_analysis(target: str, analysis_type: str, exclude_id: str) -> dict | None:
    return analysis_repo.find_prior(target, analysis_type, str(exclude_id))


# ── Agent Events ──

def insert_intelligence_event(
    analysis_id: UUID | str,
    agent: str,
    event_type: str,
    message: str,
    payload: dict | None = None,
    provider_product: str | None = None,
) -> dict:
    event_id = str(uuid.uuid4())
    db_agent = _map_agent_to_db(agent)
    res = event_repo.insert(
        event_id,
        str(analysis_id),
        db_agent,
        event_type,
        message,
        payload,
        provider_product
    )
    if res and "agent" in res:
        res["agent"] = _map_agent_from_db(res["agent"])
    return res

def list_intelligence_events(analysis_id: UUID | str) -> list[dict]:
    events = event_repo.list_for_analysis(str(analysis_id))
    for ev in events:
        if ev and "agent" in ev:
            ev["agent"] = _map_agent_from_db(ev["agent"])
    return events


# ── Briefs ──

def insert_brief(analysis_id: UUID | str, brief: dict) -> dict:
    brief_id = str(uuid.uuid4())
    log.info(f"Database: Inserting brief {brief_id} for analysis {analysis_id}")
    return brief_repo.insert(brief_id, str(analysis_id), brief)

def get_brief_by_analysis(analysis_id: UUID | str) -> dict | None:
    return brief_repo.get_by_analysis(str(analysis_id))

def mark_brief_shared(analysis_id: UUID | str) -> dict | None:
    return brief_repo.mark_shared(str(analysis_id))


# ── Scraper Cache ──

def get_scraper_cache(target_url: str, dataset_id: str, max_age_hours: int = 24) -> dict | None:
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(hours=max_age_hours)).isoformat()
    return cache_repo.get(target_url, dataset_id, cutoff)

def set_scraper_cache(target_url: str, dataset_id: str, snapshot_id: str, data: dict | list) -> None:
    cache_repo.set(target_url, dataset_id, snapshot_id, data)


# ── Citations ──

def insert_citations(citations: list[dict]) -> list[dict]:
    if not citations:
        return []
    
    # Map agents before storing
    for c in citations:
        if "agent" in c:
            c["agent"] = _map_agent_to_db(c["agent"])
            
    res = citation_repo.insert_citations(citations)
    
    # Map agents back after storing
    for r in res:
        if r and "agent" in r:
            r["agent"] = _map_agent_from_db(r["agent"])
    return res

def list_citations(analysis_id: UUID | str) -> list[dict]:
    res = citation_repo.list_citations(str(analysis_id))
    for r in res:
        if r and "agent" in r:
            r["agent"] = _map_agent_from_db(r["agent"])
    return res


# ── Analysis Schedules ──

def list_schedules() -> list[dict]:
    return schedule_repo.list_all()

def insert_schedule(
    target: str,
    analysis_type: str,
    cron: str,
    label: str | None = None,
    slack_webhook_url: str | None = None,
) -> dict:
    schedule_id = str(uuid.uuid4())
    return schedule_repo.insert(schedule_id, target, analysis_type, cron, label, slack_webhook_url)

def delete_schedule(schedule_id: str) -> None:
    schedule_repo.delete(schedule_id)

def mark_schedule_ran(schedule_id: str, analysis_id: str) -> None:
    schedule_repo.mark_ran(schedule_id, str(analysis_id))


# ── Async Wrappers ──

async def ainsert_analysis(target: str, analysis_type: str, context: str | None = None) -> dict:
    return await asyncio.to_thread(insert_analysis, target, analysis_type, context)

async def aupdate_analysis_status(analysis_id: UUID | str, status: str) -> None:
    await asyncio.to_thread(update_analysis_status, analysis_id, status)

async def aget_analysis(analysis_id: UUID | str) -> dict | None:
    return await asyncio.to_thread(get_analysis, analysis_id)

async def alist_analyses(limit: int = 20, offset: int = 0) -> list[dict]:
    return await asyncio.to_thread(list_analyses, limit, offset)

async def afind_prior_analysis(target: str, analysis_type: str, exclude_id: str) -> dict | None:
    return await asyncio.to_thread(find_prior_analysis, target, analysis_type, exclude_id)

async def ainsert_intelligence_event(
    analysis_id: UUID | str,
    agent: str,
    event_type: str,
    message: str,
    payload: dict | None = None,
    provider_product: str | None = None,
) -> dict:
    return await asyncio.to_thread(
        insert_intelligence_event,
        analysis_id,
        agent,
        event_type,
        message,
        payload,
        provider_product,
    )

async def alist_intelligence_events(analysis_id: UUID | str) -> list[dict]:
    return await asyncio.to_thread(list_intelligence_events, analysis_id)

async def ainsert_brief(analysis_id: UUID | str, brief: dict) -> dict:
    return await asyncio.to_thread(insert_brief, analysis_id, brief)

async def aget_brief_by_analysis(analysis_id: UUID | str) -> dict | None:
    return await asyncio.to_thread(get_brief_by_analysis, analysis_id)

async def amark_brief_shared(analysis_id: UUID | str) -> dict | None:
    return await asyncio.to_thread(mark_brief_shared, analysis_id)

async def aget_scraper_cache(target_url: str, dataset_id: str) -> dict | None:
    return await asyncio.to_thread(get_scraper_cache, target_url, dataset_id)

async def aset_scraper_cache(target_url: str, dataset_id: str, snapshot_id: str, data: dict | list) -> None:
    await asyncio.to_thread(set_scraper_cache, target_url, dataset_id, snapshot_id, data)

async def alist_schedules() -> list[dict]:
    return await asyncio.to_thread(list_schedules)

async def ainsert_schedule(
    target: str,
    analysis_type: str,
    cron: str,
    label: str | None = None,
    slack_webhook_url: str | None = None,
) -> dict:
    return await asyncio.to_thread(insert_schedule, target, analysis_type, cron, label, slack_webhook_url)

async def adelete_schedule(schedule_id: str) -> None:
    await asyncio.to_thread(delete_schedule, schedule_id)

async def amark_schedule_ran(schedule_id: str, analysis_id: str) -> None:
    await asyncio.to_thread(mark_schedule_ran, schedule_id, analysis_id)
