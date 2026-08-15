"""Smoke test: Firestore Repository round-trip.

Run:
    uv run pytest tests/test_db.py -v
"""

import pytest

from database.client import (
    insert_analysis,
    update_analysis_status,
    get_analysis,
    insert_intelligence_event,
    list_intelligence_events,
    insert_brief,
    get_brief_by_analysis,
)



@pytest.fixture(autouse=True)
def cleanup_analyses():
    created_ids: list[str] = []
    yield created_ids
    
    from database.client import analysis_repo, brief_repo, event_repo
    
    for mid in created_ids:
        if analysis_repo.collection:
            # Firestore cleanup
            try:
                analysis_repo.collection.document(mid).delete()
                brief_repo.collection.document(mid).delete()
                
                # Delete events for this analysis
                events = event_repo.collection.where("analysis_id", "==", mid).stream()
                for e in events:
                    e.reference.delete()
                    
                # Delete citations for this analysis
                cits = event_repo.client.collection(event_repo.citations_collection_name).where("analysis_id", "==", mid).stream()
                for c in cits:
                    c.reference.delete()
            except Exception:
                pass
        else:
            # Local JSON cleanup
            from database.repositories.base import _load_local_db, _save_local_db
            from database.firebase import collections
            try:
                db = _load_local_db()
                db[collections.ANALYSES].pop(mid, None)
                db[collections.BRIEFS].pop(mid, None)
                
                if collections.INTELLIGENCE_EVENTS in db:
                    db[collections.INTELLIGENCE_EVENTS] = {
                        k: v for k, v in db[collections.INTELLIGENCE_EVENTS].items()
                        if v.get("analysis_id") != mid
                    }
                if collections.CITATIONS in db:
                    db[collections.CITATIONS] = {
                        k: v for k, v in db[collections.CITATIONS].items()
                        if v.get("analysis_id") != mid
                    }
                _save_local_db(db)
            except Exception:
                pass


def test_analysis_insert_and_fetch(cleanup_analyses):
    analysis = insert_analysis("smoke-test.example.com", "account_pulse")
    cleanup_analyses.append(analysis["id"])

    assert analysis["target"] == "smoke-test.example.com"
    assert analysis["analysis_type"] == "account_pulse"
    assert analysis["status"] == "queued"
    assert "id" in analysis

    fetched = get_analysis(analysis["id"])
    assert fetched is not None
    assert fetched["id"] == analysis["id"]


def test_update_analysis_status(cleanup_analyses):
    analysis = insert_analysis("status-test.example.com", "supplier_watch")
    cleanup_analyses.append(analysis["id"])

    update_analysis_status(analysis["id"], "running")
    updated = get_analysis(analysis["id"])
    assert updated["status"] == "running"

    update_analysis_status(analysis["id"], "completed")
    final = get_analysis(analysis["id"])
    assert final["status"] == "completed"


def test_intelligence_events_round_trip(cleanup_analyses):
    analysis = insert_analysis("events-test.example.com", "threat_surface")
    mid = analysis["id"]
    cleanup_analyses.append(mid)

    e1 = insert_intelligence_event(
        mid, "coordinator", "started",
        message="Generating research plan",
        payload={"steps": 4},
    )
    e2 = insert_intelligence_event(
        mid, "researcher", "tool_call",
        message="Calling SERP API",
        provider_product="serp_api",
        payload={"query": "smoke test query"},
    )

    events = list_intelligence_events(mid)
    assert len(events) == 2
    assert events[0]["agent"] == "coordinator"
    assert events[0]["event_type"] == "started"
    assert events[1]["agent"] == "researcher"
    assert events[1]["provider_product"] == "serp_api"
    assert events[1]["payload"]["query"] == "smoke test query"


def test_brief_insert_and_fetch(cleanup_analyses):
    analysis = insert_analysis("brief-test.example.com", "account_pulse")
    mid = analysis["id"]
    cleanup_analyses.append(mid)

    update_analysis_status(mid, "completed")

    brief_data = {
        "market_move_score": 72,
        "recommended_move": "attack",
        "confidence_score": 85,
        "executive_summary": "Smoke test brief — target shows clear opportunity.",
        "action_pack": {
            "landing_angle": "Test angle",
            "email_copy": "Test email",
            "crm_payload": "Test CRM",
            "risk_warning": "Test warning",
        },
        "provider_calls": [
            {"product": "serp_api", "calls": 3},
            {"product": "web_unlocker", "calls": 1},
        ],
    }
    brief = insert_brief(mid, brief_data)

    assert brief["market_move_score"] == 72
    assert brief["recommended_move"] == "attack"
    assert brief["confidence_score"] == 85

    fetched = get_brief_by_analysis(mid)
    assert fetched is not None
    assert fetched["analysis_id"] == mid
    assert fetched["market_move_score"] == 72


def test_get_nonexistent_analysis():
    import uuid
    result = get_analysis(uuid.uuid4())
    assert result is None
