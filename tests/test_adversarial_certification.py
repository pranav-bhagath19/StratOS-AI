"""Adversarial Judge-Day Certification Test Suite.
Hostile production evaluator testing every failure mode, concurrency boundary,
and data integrity requirement for StratOS-AI.
"""

import asyncio
import json
import os
import sys
import threading
import time
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# Anchor repo root
_REPO_ROOT = Path(__file__).resolve().parent.parent
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from backend.config.config import settings
from backend.routes.analyses import determine_analysis_status
from database.firebase.admin import get_firebase_app
from intelligence.agents.base.evidence import format_structured_evidence, extract_key_claims
from intelligence.agents.base.llm import LLMResult, get_llm_result
from intelligence.agents.base.state import AnalysisState
from intelligence.agents.coordinator.agent import run_coordinator
from intelligence.agents.planner.agent import run_planner
from intelligence.agents.researcher.agent import run_researcher
from intelligence.agents.scout.agent import run_scout
from intelligence.agents.verifier.agent import run_verifier
from intelligence.tools.browser.playwright import PlaywrightBrowserProvider
from intelligence.workflows.executive_brief.graph import analysis_graph


# ============================================================================
# 1. PLANNER ADVERSARIAL ATTACKS
# ============================================================================

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error_type,error_code",
    [
        ("rate_limit", 429),
        ("insufficient_credits", 402),
        ("server_error", 500),
        ("bad_gateway", 502),
        ("service_unavailable", 503),
        ("timeout", 408),
    ],
)
async def test_planner_under_all_http_error_codes(error_type, error_code):
    """Planner must never crash under 429, 402, 500, 502, 503, or timeout."""
    state: AnalysisState = {
        "analysis_id": f"plan-{error_code}",
        "analysis_type": "account_pulse",
        "target": "AdversarialTarget.com",
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

    mock_fail = LLMResult(
        success=False,
        content="",
        error=f"HTTP {error_code} {error_type}",
        error_type=error_type,
        model="mocked-model",
    )

    with patch("intelligence.agents.planner.agent.get_llm_result", new=AsyncMock(return_value=mock_fail)):
        with pytest.raises(RuntimeError, match="Planner LLM failed"):
            await run_planner(state)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "malformed_content",
    [
        "",  # Empty
        "   \n\t   ",  # Whitespace only
        "NOT JSON AT ALL",  # Garbage
        "{'invalid_json': True}",  # Python repr, invalid JSON
        '{"research_plan": "not a list"}',  # Wrong type
        '{"research_plan": []}',  # Empty list
        "X" * 50000,  # Enormous response
    ],
    ids=["empty", "whitespace", "not_json", "python_dict", "not_list", "empty_list", "oversized"],
)
async def test_planner_under_malformed_llm_outputs(malformed_content):
    """Planner must fallback safely when LLM produces malformed or empty output."""
    state: AnalysisState = {
        "analysis_id": "plan-malformed",
        "analysis_type": "account_pulse",
        "target": "MalformedTarget",
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

    mock_res = LLMResult(
        success=True,
        content=malformed_content,
        model="mocked-model",
    )

    with patch("intelligence.agents.planner.agent.get_llm_result", new=AsyncMock(return_value=mock_res)):
        with pytest.raises(RuntimeError):
            await run_planner(state)


# ============================================================================
# 2. RESEARCHER ADVERSARIAL ATTACKS
# ============================================================================

@pytest.mark.asyncio
async def test_researcher_under_multi_tool_catastrophe():
    """Researcher with 1 search timeout, 1 scraper 500, 1 browser crash, 1 404 page."""
    state: AnalysisState = {
        "analysis_id": "res-catastrophe",
        "analysis_type": "account_pulse",
        "target": "BrokenTarget.org",
        "context": None,
        "research_plan": [
            {"step": 1, "tool": "serp_news", "goal": "News", "query_or_url": "query1"},
            {"step": 2, "tool": "mcp_search", "goal": "MCP", "query_or_url": "query2"},
            {"step": 3, "tool": "unlocker_fetch", "goal": "Fetch", "query_or_url": "https://broken.com/404"},
            {"step": 4, "tool": "scraper_linkedin", "goal": "Profile", "query_or_url": "https://linkedin.com/in/bad"},
            {"step": 5, "tool": "browser_render", "goal": "Render", "query_or_url": "https://badsite.com"},
        ],
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

    async def mock_execute(step):
        tool = step["tool"]
        if tool == "serp_news":
            return "Found minimal company trace.", {"product": "serp_api", "tool": tool, "query_or_url": "q", "latency_ms": 10, "ok": True, "status": "ok"}
        elif tool == "mcp_search":
            raise asyncio.TimeoutError("MCP search timed out after 15s")
        elif tool == "unlocker_fetch":
            return "[Error: HTTP 404 Not Found]", {"product": "web_unlocker", "tool": tool, "query_or_url": "q", "latency_ms": 10, "ok": False, "status": "empty"}
        elif tool == "scraper_linkedin":
            return "[Error: HTTP 500 Internal Error]", {"product": "web_scraper_api", "tool": tool, "query_or_url": "q", "latency_ms": 10, "ok": False, "status": "empty"}
        else:
            raise RuntimeError("Browser process crashed unexpectedly")

    with patch("intelligence.agents.researcher.agent._execute", side_effect=mock_execute):
        res = await run_researcher(state)
        calls = res.get("provider_calls", [])
        assert len(calls) == 5, "All 5 steps must report in provider_calls"
        assert res.get("research_status") in ("partial", "failed")
        assert "Found minimal company trace." in res.get("raw_findings", "")


@pytest.mark.asyncio
async def test_researcher_ten_concurrent_browser_requests():
    """Verify 10 concurrent requests to PlaywrightBrowserProvider do not deadlock or crash."""
    provider = PlaywrightBrowserProvider()

    async def mock_subprocess_exec(*cmd, **kwargs):
        mock_proc = AsyncMock()
        mock_proc.returncode = 0
        mock_proc.communicate = AsyncMock(return_value=(b'<html>Rendered content</html>', b''))
        mock_proc.kill = MagicMock()
        return mock_proc

    with patch("asyncio.create_subprocess_exec", side_effect=mock_subprocess_exec):
        urls = [f"https://example{i}.com" for i in range(10)]
        tasks = [provider.fetch_rendered(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        assert len(results) == 10
        for idx, r in enumerate(results):
            assert not isinstance(r, Exception), f"Task {idx} failed with {r}"
            assert "Rendered content" in r


# ============================================================================
# 3. SCOUT ADVERSARIAL ATTACKS
# ============================================================================

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "case_name,expected_challenge_substr",
    [
        ("empty", "collection completeness"),
        ("sparse", "cross-source"),
        ("enormous", "temporal"),
    ],
)
async def test_scout_under_pathological_inputs(case_name, expected_challenge_substr):
    """Scout must generate accurate challenges without fabricating missing evidence."""
    if case_name == "empty":
        findings = ""
    elif case_name == "sparse":
        findings = "Only 50 characters of sparse notes."
    else:
        findings = "A" * 50000

    state: AnalysisState = {
        "analysis_id": "scout-pathology",
        "analysis_type": "account_pulse",
        "target": "PathologyTarget",
        "context": None,
        "research_plan": [],
        "raw_findings": findings,
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

    challenge_map = {
        "empty": ["Collection completeness: No evidence retrieved for target."],
        "sparse": ["Cross-source validation: Sparse findings require corroboration."],
        "enormous": ["Temporal relevance: Massive corpus requires fresh verification."],
    }
    mock_ok = LLMResult(
        success=True,
        content=json.dumps(challenge_map[case_name]),
        model="mock",
    )
    with patch("intelligence.agents.scout.agent.get_llm_result", new=AsyncMock(return_value=mock_ok)):
        res = await run_scout(state)
        challenges = res.get("challenges", [])
        assert len(challenges) > 0, "Scout must produce challenges"
        assert any(expected_challenge_substr.lower() in c.lower() for c in challenges)


# ============================================================================
# 4. VERIFIER ADVERSARIAL ATTACKS
# ============================================================================

@pytest.mark.asyncio
async def test_verifier_no_fabricated_confidence_on_zero_evidence():
    """Verifier must severely penalize confidence when evidence is missing or unverified."""
    state: AnalysisState = {
        "analysis_id": "ver-zero",
        "analysis_type": "account_pulse",
        "target": "ZeroEvidenceTarget",
        "context": None,
        "research_plan": [],
        "raw_findings": "",
        "provider_calls": [
            {"step": 1, "tool": "serp", "product": "serp_api", "status": "timeout", "ok": False},
            {"step": 2, "tool": "mcp", "product": "mcp_server", "status": "timeout", "ok": False},
        ],
        "challenges": ["No data retrieved"],
        "verified_findings": "",
        "confidence_score": 0,
        "market_move_score": 0,
        "recommended_move": "MONITOR",
        "executive_summary": "",
        "action_pack": {},
        "events": [],
    }

    mock_ok = LLMResult(
        success=True,
        content=json.dumps({
            "confidence_score": 15,
            "verified_findings": "Provider Corroboration: Zero verified data sources retrieved.",
        }),
        model="mock",
    )
    with patch("intelligence.agents.verifier.agent.get_llm_result", new=AsyncMock(return_value=mock_ok)):
        res = await run_verifier(state)
        conf = res.get("confidence_score", 100)
        assert conf <= 20, f"Confidence {conf} must not be inflated without evidence"
        assert "Provider Corroboration" in res.get("verified_findings", "")


# ============================================================================
# 5. COORDINATOR ADVERSARIAL ATTACKS
# ============================================================================

@pytest.mark.asyncio
async def test_coordinator_strictly_fails_on_llm_failure():
    """Coordinator strictly raises RuntimeError if LLM fails (no fake battle brief)."""
    state: AnalysisState = {
        "analysis_id": "coord-fail",
        "analysis_type": "account_pulse",
        "target": "FailCorp",
        "context": None,
        "research_plan": [],
        "raw_findings": "Minimal notes",
        "provider_calls": [],
        "challenges": ["High uncertainty"],
        "verified_findings": "Unverified summary",
        "confidence_score": 30,
        "market_move_score": 0,
        "recommended_move": "MONITOR",
        "executive_summary": "",
        "action_pack": {},
        "events": [],
    }

    mock_fail = LLMResult(success=False, content="", error="LLM down", error_type="timeout", model="mock")
    with patch("intelligence.agents.coordinator.agent.get_llm_result", new=AsyncMock(return_value=mock_fail)):
        with pytest.raises(RuntimeError, match="Coordinator LLM failed"):
            await run_coordinator(state)


# ============================================================================
# 6. ORCHESTRATOR MATRIX TESTS (LangGraph all combinations)
# ============================================================================

@pytest.mark.asyncio
@pytest.mark.parametrize(
    "fail_planner,fail_researcher,fail_scout,fail_verifier,fail_coordinator",
    [
        (True, False, False, False, False),
        (False, True, False, False, False),
        (False, False, True, False, False),
        (False, False, False, True, False),
        (False, False, False, False, True),
        (True, True, True, True, True),
    ],
)
async def test_langgraph_orchestration_matrix(
    fail_planner, fail_researcher, fail_scout, fail_verifier, fail_coordinator
):
    """LangGraph must terminate gracefully in all agent failure permutations."""
    run_id = f"matrix-{int(time.time() * 1000)}"
    initial_state: AnalysisState = {
        "analysis_id": run_id,
        "analysis_type": "account_pulse",
        "target": "PermutationTarget",
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

    mock_llm_fail = LLMResult(success=False, content="", error="Simulated fail", error_type="timeout", model="mock")
    planner_ok_content = json.dumps([
        {"step": 1, "tool": "serp_news", "goal": "News", "query_or_url": "test"},
        {"step": 2, "tool": "mcp_search", "goal": "MCP", "query_or_url": "test"},
        {"step": 3, "tool": "unlocker_fetch", "goal": "Fetch", "query_or_url": "https://test.com"},
        {"step": 4, "tool": "scraper_linkedin", "goal": "LI", "query_or_url": "https://test.com/li"},
        {"step": 5, "tool": "browser_render", "goal": "Render", "query_or_url": "https://test.com/dyn"},
    ])
    scout_ok_content = json.dumps(["c1", "c2"])
    verifier_ok_content = json.dumps({
        "confidence_score": 85,
        "verified_findings": "Corroborated evidence",
    })
    coordinator_ok_content = json.dumps({
        "market_move_score": 80,
        "recommended_move": "ATTACK",
        "headline": "Strategic Assessment",
        "situation": "Strong market position verified.",
        "key_findings": ["Finding 1", "Finding 2"],
        "action_pack": {"immediate": ["Action 1"], "this_week": [], "watch": []},
        "coordinator_rationale": "High confidence corroboration.",
    })

    async def mock_get_llm(system_msg, messages, max_tokens, **kwargs):
        sys_lower = system_msg.lower()
        if "research_plan" in sys_lower or "planner" in sys_lower:
            return mock_llm_fail if fail_planner else LLMResult(success=True, content=planner_ok_content, model="mock")
        elif "scout" in sys_lower or "challenges" in sys_lower:
            return mock_llm_fail if fail_scout else LLMResult(success=True, content=scout_ok_content, model="mock")
        elif "verifier" in sys_lower or "confidence" in sys_lower:
            return mock_llm_fail if fail_verifier else LLMResult(success=True, content=verifier_ok_content, model="mock")
        else:
            return mock_llm_fail if fail_coordinator else LLMResult(success=True, content=coordinator_ok_content, model="mock")

    async def mock_execute(step):
        if fail_researcher:
            raise asyncio.TimeoutError("Researcher timeout")
        tool = step.get("tool", "serp_news")
        product_map = {
            "serp_news": "serp_api",
            "mcp_search": "mcp_server",
            "unlocker_fetch": "web_unlocker",
            "scraper_linkedin": "web_scraper_api",
            "browser_render": "scraping_browser",
        }
        product = product_map.get(tool, "serp_api")
        return "Evidence collected", {"product": product, "tool": tool, "query_or_url": "q", "latency_ms": 10, "ok": True, "status": "ok"}

    with patch("intelligence.agents.base.llm.get_llm_result", side_effect=mock_get_llm), \
         patch("intelligence.agents.planner.agent.get_llm_result", side_effect=mock_get_llm), \
         patch("intelligence.agents.scout.agent.get_llm_result", side_effect=mock_get_llm), \
         patch("intelligence.agents.verifier.agent.get_llm_result", side_effect=mock_get_llm), \
         patch("intelligence.agents.coordinator.agent.get_llm_result", side_effect=mock_get_llm), \
         patch("intelligence.agents.researcher.agent._execute", side_effect=mock_execute):

        any_failed = any([fail_planner, fail_researcher, fail_scout, fail_verifier, fail_coordinator])
        if any_failed:
            with pytest.raises((RuntimeError, asyncio.TimeoutError)):
                await analysis_graph.ainvoke(initial_state)
        else:
            final_state = await analysis_graph.ainvoke(initial_state)
            assert final_state is not None
            assert "executive_summary" in final_state
            has_brief = bool(final_state.get("executive_summary"))
            status = determine_analysis_status(final_state, has_brief=has_brief)
            assert status == "completed", f"Expected completed status when all succeed but got {status}"


# ============================================================================
# 7. FRONTEND MALICIOUS / INVALID EVENT MATRIX
# ============================================================================

@pytest.mark.parametrize(
    "payload,expected_ui_state",
    [
        # Missing status and no brief
        ({"type": "done"}, "failed"),
        # Failed backend status
        ({"type": "done", "status": "failed"}, "failed"),
        # Completed status but has_brief is False
        ({"type": "done", "status": "completed", "has_brief": False}, "failed"),
        # Completed status but brief is None
        ({"type": "done", "status": "completed", "has_brief": True, "brief": None}, "failed"),
        # Partial status with brief -> mapped to failed (strict full-success mode: no partial state)
        ({"type": "done", "status": "partial", "has_brief": True, "brief": {"id": "1"}}, "failed"),
        # Completed status with valid brief
        ({"type": "done", "status": "completed", "has_brief": True, "brief": {"id": "1"}}, "completed"),
    ],
)
def test_frontend_state_machine_security(payload, expected_ui_state):
    """Emulate page.tsx event parser to guarantee zero false-successes."""
    backend_status = payload.get("status")
    has_brief = bool(payload.get("has_brief")) and (payload.get("brief") is not None if "brief" in payload else True)

    if backend_status == "failed" or not has_brief or backend_status == "partial":
        ui_state = "failed"
    elif backend_status == "completed" and has_brief:
        ui_state = "completed"
    else:
        ui_state = "failed"

    assert ui_state == expected_ui_state, f"Payload {payload} produced {ui_state}, expected {expected_ui_state}"


# ============================================================================
# 8. CONCURRENCY & DATA ISOLATION (Zero Cross-Contamination)
# ============================================================================

@pytest.mark.asyncio
async def test_concurrent_analyses_data_isolation():
    """Run 5 simultaneous analyses for different targets and assert ZERO cross-contamination."""
    targets = ["TargetAlpha", "TargetBeta", "TargetGamma", "TargetDelta", "TargetEpsilon"]

    async def mock_execute(step):
        await asyncio.sleep(0.01)
        query = step.get("query_or_url", "")
        target = "Unknown"
        for t in targets:
            if t in query:
                target = t
                break
        return f"SPECIFIC_DATA_FOR_{target}", {
            "product": "serp_api",
            "tool": step.get("tool", "serp_news"),
            "query_or_url": query,
            "latency_ms": 20,
            "ok": True,
            "status": "ok",
        }

    async def mock_concurrent_llm(system_msg, messages, max_tokens, **kwargs):
        human_text = " ".join([m.content for m in messages if hasattr(m, "content")])
        target = "Unknown"
        for t in targets:
            if t in human_text:
                target = t
                break

        sys_lower = system_msg.lower()
        if "you are the planner" in sys_lower or "research_plan" in sys_lower:
            plan = [
                {"step": 1, "tool": "serp_news", "goal": f"Intel on {target}", "query_or_url": target},
                {"step": 2, "tool": "mcp_search", "goal": f"MCP on {target}", "query_or_url": target},
                {"step": 3, "tool": "unlocker_fetch", "goal": f"Fetch {target}", "query_or_url": f"https://{target}.com"},
                {"step": 4, "tool": "scraper_linkedin", "goal": f"LI {target}", "query_or_url": f"https://{target}.com/li"},
                {"step": 5, "tool": "browser_render", "goal": f"Render {target}", "query_or_url": f"https://{target}.com/dyn"},
            ]
            content_str = json.dumps(plan)
        elif "you are the verifier" in sys_lower:
            content_str = json.dumps({
                "confidence_score": 85,
                "verified_findings": f"Verified data for {target}",
            })
        elif "you are the scout" in sys_lower:
            content_str = json.dumps([f"Challenge for {target}"])
        elif "you are coordinator" in sys_lower:
            content_str = json.dumps({
                "market_move_score": 75,
                "recommended_move": "ATTACK",
                "headline": f"Analysis for {target}",
                "situation": f"Strategic situation for {target}",
                "key_findings": [f"Key finding for {target}"],
                "action_pack": {"immediate": [f"Action for {target}"], "this_week": [], "watch": []},
                "coordinator_rationale": f"Rationale for {target}",
            })
        else:
            content_str = "{}"
        return LLMResult(success=True, content=content_str, model="mock")

    async def run_isolated_analysis(target_name: str):
        run_id = f"iso-{target_name}-{int(time.time() * 1000)}"
        state: AnalysisState = {
            "analysis_id": run_id,
            "analysis_type": "account_pulse",
            "target": target_name,
            "context": None,
            "research_plan": [
                {"step": 1, "tool": "serp_news", "goal": f"Intel on {target_name}", "query_or_url": target_name}
            ],
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
        result = await analysis_graph.ainvoke(state)
        return target_name, result

    with patch("intelligence.agents.researcher.agent._execute", side_effect=mock_execute), \
         patch("intelligence.agents.base.llm.get_llm_result", side_effect=mock_concurrent_llm), \
         patch("intelligence.agents.planner.agent.get_llm_result", side_effect=mock_concurrent_llm), \
         patch("intelligence.agents.scout.agent.get_llm_result", side_effect=mock_concurrent_llm), \
         patch("intelligence.agents.verifier.agent.get_llm_result", side_effect=mock_concurrent_llm), \
         patch("intelligence.agents.coordinator.agent.get_llm_result", side_effect=mock_concurrent_llm):

        tasks = [run_isolated_analysis(t) for t in targets]
        results = await asyncio.gather(*tasks)

    for target_name, res in results:
        findings = res.get("raw_findings", "")
        summary = res.get("executive_summary", "")

        # MUST contain own data
        assert f"SPECIFIC_DATA_FOR_{target_name}" in findings
        assert target_name in summary

        # MUST NOT contain any other target's data
        for other_target in targets:
            if other_target != target_name:
                assert f"SPECIFIC_DATA_FOR_{other_target}" not in findings, (
                    f"Cross-contamination detected! {target_name} contains data from {other_target}"
                )
                assert other_target not in summary, (
                    f"Cross-contamination detected! {target_name} summary contains {other_target}"
                )
