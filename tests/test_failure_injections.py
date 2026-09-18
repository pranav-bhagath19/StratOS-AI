"""Automated Failure Injection & Zero-Failure Demo Hardening Test Suite.
Tests all boundary conditions and failure modes across the 5-agent pipeline:
- LLM failover (429, 500, 502, 503, timeouts, network, exhaustion)
- Researcher resilience (tool failures, timeouts, browser isolation)
- Agent graceful degradation (Planner, Scout, Verifier, Coordinator)
- Firebase thread-safety and concurrency
- Truthful terminal states and false-success prevention
"""

import asyncio
import json
import threading
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from intelligence.agents.base.state import AnalysisState
from intelligence.agents.base.llm import get_llm_result, LLMResult
from intelligence.agents.planner.agent import run_planner
from intelligence.agents.researcher.agent import run_researcher
from intelligence.agents.scout.agent import run_scout
from intelligence.agents.verifier.agent import run_verifier
from intelligence.agents.coordinator.agent import run_coordinator
from intelligence.workflows.executive_brief.graph import analysis_graph
from intelligence.tools.manager import provider_manager
from backend.routes.analyses import _run_analysis
from database.firebase.admin import get_firebase_app


def _get_base_state() -> AnalysisState:
    return {
        "analysis_id": "test-failure-injection",
        "analysis_type": "account_pulse",
        "target": "example.com",
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


# ==============================================================================
# 1. LLM FAILOVER & TRANSIENT ERROR TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_llm_failover_on_429_rate_limit():
    """LLM failover: Model 1 hits 429, Model 2 succeeds."""
    mock_resp = MagicMock()
    mock_resp.content = '{"status": "ok"}'

    with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=[
        Exception("HTTP 429: Too Many Requests"),
        Exception("HTTP 429: Too Many Requests"),
        mock_resp,
    ]):
        result = await get_llm_result("system", [], 100, request_timeout=5.0)
        assert result.success is True
        assert result.fallback_used is True
        assert result.content == '{"status": "ok"}'


@pytest.mark.asyncio
async def test_llm_failover_on_503_service_overload():
    """LLM failover: Model 1 hits 503 Overloaded, Model 2 succeeds."""
    mock_resp = MagicMock()
    mock_resp.content = "Synthesized response"

    with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=[
        Exception("HTTP 503: Service temporarily overloaded"),
        Exception("HTTP 503: Service temporarily overloaded"),
        mock_resp,
    ]):
        result = await get_llm_result("system", [], 100, request_timeout=5.0)
        assert result.success is True
        assert result.fallback_used is True
        assert "Synthesized response" in result.content


@pytest.mark.asyncio
async def test_llm_failover_all_models_exhausted_returns_structured_failure():
    """LLM failover: When all models fail, returns LLMResult(success=False) without unhandled crash."""
    with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=Exception("HTTP 500: Server Error")):
        result = await get_llm_result("system", [], 100, request_timeout=2.0)
        assert result.success is False
        assert result.content == ""
        assert result.error_type == "service_overload"


@pytest.mark.asyncio
async def test_llm_empty_response_handling():
    """LLM failover: Empty response triggers retry or fallback model."""
    empty_resp = MagicMock(content="   ")
    valid_resp = MagicMock(content="Valid content")

    with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=[
        empty_resp,
        empty_resp,
        valid_resp,
    ]):
        result = await get_llm_result("system", [], 100, request_timeout=2.0)
        assert result.success is True
        assert result.content == "Valid content"


# ==============================================================================
# 2. PLANNER RESILIENCE TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_planner_fails_strictly_on_llm_timeout():
    """Planner strictly raises RuntimeError on LLM timeout (no fabricated fallback plan)."""
    state = _get_base_state()
    with patch("intelligence.agents.planner.agent.get_llm_result", side_effect=asyncio.TimeoutError("LLM timeout")):
        with pytest.raises(RuntimeError, match="Planner LLM failed"):
            await run_planner(state)


@pytest.mark.asyncio
async def test_planner_fails_strictly_on_malformed_json():
    """Planner strictly raises RuntimeError on invalid JSON string (no fabricated fallback plan)."""
    state = _get_base_state()
    llm_res = LLMResult(success=True, content="I cannot format this as JSON!", model="test")
    with patch("intelligence.agents.planner.agent.get_llm_result", return_value=llm_res):
        with pytest.raises(RuntimeError, match="Planner JSON extraction failed"):
            await run_planner(state)


# ==============================================================================
# 3. RESEARCHER RESILIENCE & TIMEOUT TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_researcher_survives_single_tool_timeout():
    """Researcher: One tool times out, other tools complete successfully."""
    state = _get_base_state()
    state["research_plan"] = [
        {"step": 1, "goal": "Timeout test", "tool": "serp_search", "query_or_url": "test", "result": None, "ok": None},
        {"step": 2, "goal": "Ok test", "tool": "serp_news", "query_or_url": "test news", "result": None, "ok": None},
    ]

    async def mock_search(q, limit=10, search_type="web"):
        if "news" in q:
            return [{"title": "News Title", "url": "https://news.com", "snippet": "Recent update"}]
        raise asyncio.TimeoutError("Search timed out")

    with patch("intelligence.tools.manager.provider_manager.search", side_effect=mock_search):
        res = await run_researcher(state)
        calls = res["provider_calls"]
        assert len(calls) == 2
        assert any(c["status"] == "timeout" for c in calls)
        assert any(c["status"] == "ok" for c in calls)


@pytest.mark.asyncio
async def test_researcher_survives_all_tools_failed():
    """Researcher: All tools fail, pipeline still produces structured findings."""
    state = _get_base_state()
    state["research_plan"] = [
        {"step": 1, "goal": "Failing search", "tool": "serp_search", "query_or_url": "fail", "result": None, "ok": None},
        {"step": 2, "goal": "Failing scrape", "tool": "unlocker_fetch", "query_or_url": "fail", "result": None, "ok": None},
    ]
    with patch("intelligence.tools.manager.provider_manager.search", side_effect=RuntimeError("Search offline")):
        with patch("intelligence.tools.manager.provider_manager.fetch_page", side_effect=RuntimeError("Fetch offline")):
            res = await run_researcher(state)
            assert len(res["provider_calls"]) == 2
            assert all(not c["ok"] for c in res["provider_calls"])
            assert "Error" in res["raw_findings"]


@pytest.mark.asyncio
async def test_researcher_browser_isolated_timeout():
    """Researcher: Browser render fails cleanly without deadlock."""
    from intelligence.tools.browser.playwright import PlaywrightBrowserProvider
    provider = PlaywrightBrowserProvider()

    with patch("asyncio.create_subprocess_exec", side_effect=RuntimeError("Chromium crash simulation")):
        with pytest.raises(RuntimeError) as exc_info:
            await provider.fetch_rendered("https://example.com")
        assert "Playwright rendering failed" in str(exc_info.value)


# ==============================================================================
# 4. SCOUT RESILIENCE TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_scout_fails_strictly_on_llm_failure():
    """Scout strictly raises RuntimeError when LLM is unavailable (no fabricated challenges)."""
    state = _get_base_state()
    state["raw_findings"] = "Some gathered research findings"
    state["provider_calls"] = [{"product": "serp_api", "tool": "serp_search", "status": "timeout", "ok": False}]

    with patch("intelligence.agents.scout.agent.get_llm_result", return_value=LLMResult(success=False, content="", error="503 Overloaded")):
        with pytest.raises(RuntimeError, match="Scout LLM failed"):
            await run_scout(state)


# ==============================================================================
# 5. VERIFIER RESILIENCE & ALGORITHMIC CALIBRATION TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_verifier_fails_strictly_on_llm_failure():
    """Verifier strictly raises RuntimeError when LLM fails (no fabricated confidence score)."""
    state = _get_base_state()
    state["raw_findings"] = "Step 1: Found competitor launch details."
    state["challenges"] = ["Verify recency"]
    state["provider_calls"] = [
        {"product": "serp_api", "tool": "serp_search", "status": "ok", "ok": True, "latency_ms": 120},
        {"product": "mcp_server", "tool": "mcp_search", "status": "ok", "ok": True, "latency_ms": 200},
        {"product": "web_unlocker", "tool": "unlocker_fetch", "status": "timeout", "ok": False, "latency_ms": 15000},
    ]

    with patch("intelligence.agents.verifier.agent.get_llm_result", return_value=LLMResult(success=False, content="", error="timeout")):
        with pytest.raises(RuntimeError, match="Verifier LLM failed"):
            await run_verifier(state)


# ==============================================================================
# 6. COORDINATOR RESILIENCE TESTS
# ==============================================================================

@pytest.mark.asyncio
async def test_coordinator_fails_strictly_on_llm_failure():
    """Coordinator strictly raises RuntimeError if LLM fails (no fabricated battle brief)."""
    state = _get_base_state()
    state["verified_findings"] = "Verified evidence from research."
    state["confidence_score"] = 70
    state["challenges"] = ["Data gap on pricing"]
    state["provider_calls"] = [{"product": "serp_api", "status": "ok"}]

    with patch("intelligence.agents.coordinator.agent.get_llm_result", return_value=LLMResult(success=False, content="", error="LLM down")):
        with pytest.raises(RuntimeError, match="Coordinator LLM failed"):
            await run_coordinator(state)



# ==============================================================================
# 7. FIREBASE CONCURRENCY & THREAD-SAFETY TESTS
# ==============================================================================

def test_firebase_concurrent_initialization():
    """Firebase Admin SDK: Multiple threads initializing simultaneously must not race."""
    errors = []

    def _worker():
        try:
            for _ in range(5):
                app = get_firebase_app()
                # App may be None if credentials are intentionally unconfigured in local test mode
        except Exception as e:
            errors.append(e)

    threads = [threading.Thread(target=_worker) for _ in range(10)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    assert len(errors) == 0, f"Concurrent Firebase initialization raised: {errors}"


# ==============================================================================
# 8. BACKEND STATUS CONSISTENCY & FALSE-SUCCESS PREVENTION
# ==============================================================================

@pytest.mark.asyncio
async def test_backend_records_failure_on_unhandled_crash():
    """Backend: Unhandled crash marks analysis status 'failed', never 'completed'."""
    with patch("backend.routes.analyses.analysis_graph.ainvoke", side_effect=RuntimeError("Fatal pipeline crash")):
        with patch("database.client.aupdate_analysis_status") as mock_status:
            with patch("database.client.ainsert_brief") as mock_brief:
                await _run_analysis("test-crash", "account_pulse", "example.com", None)
                mock_status.assert_called_with("test-crash", "failed")
                mock_brief.assert_not_called()
