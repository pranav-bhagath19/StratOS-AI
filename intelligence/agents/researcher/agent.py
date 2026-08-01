"""Researcher — executes research plan via swappable tools, all steps in parallel."""

import asyncio
import logging
import time

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, ProviderCall, AnalysisState, ResearchStep
from intelligence.tools.manager import provider_manager
from backend.config.config import settings

log = logging.getLogger(__name__)

_PRODUCT_MAP: dict[str, str] = {
    "serp_search": "serp_api",
    "serp_news": "serp_api",
    "mcp_search": "mcp_server",
    "mcp_scrape": "mcp_server",
    "unlocker_fetch": "web_unlocker",
    "scraper_linkedin": "web_scraper_api",
    "browser_render": "scraping_browser",
}

# Per-product timeout budgets (seconds).
_PRODUCT_TIMEOUT: dict[str, float] = {
    "serp_api": 15.0,
    "mcp_server": 20.0,
    "web_unlocker": 30.0,
    "web_scraper_api": 160.0,
    "scraping_browser": 35.0,
}

# Products that get one retry on timeout (60% of original budget, after 1s pause).
_RETRY_PRODUCTS = {"web_unlocker", "scraping_browser"}
_RETRY_DELAY = 1.0
_RETRY_TIMEOUT_FACTOR = 0.6


def _fmt_serp(results: list[dict]) -> str:
    lines = []
    for x in results[:5]:
        title = x.get("title", "")
        desc = x.get("description", "") or x.get("snippet", "")
        url = x.get("url", "") or x.get("link", "")
        lines.append(f"**{title}**\n{desc}\n{url}")
    return "\n\n".join(lines)


async def _execute(step: ResearchStep) -> tuple[str, ProviderCall]:
    """Execute one step using the provider manager; handles all errors internally."""
    tool = step["tool"]
    q = step["query_or_url"]
    latency_ms = 0
    result_text: str | None = None
    
    import time
    start_time = time.monotonic()

    try:
        if tool in ("serp_search", "serp_news"):
            search_type = "news" if tool == "serp_news" else "web"
            results = await provider_manager.search(q, limit=10, search_type=search_type)
            if results:
                result_text = _fmt_serp(results)

        elif tool in ("mcp_search", "mcp_scrape", "unlocker_fetch"):
            result_text, _, _ = await provider_manager.fetch_page(q)

        elif tool == "browser_render":
            result_text, _, _ = await provider_manager.fetch_page(q, force_browser=True)

        elif tool == "scraper_linkedin":
            if "linkedin.com" in q:
                result_text, _, _ = await provider_manager.fetch_page(q, force_browser=True)
            else:
                result_text, _, _ = await provider_manager.fetch_page(q)

        else:
            result_text = f"[Unknown tool: {tool}]"

    except Exception as exc:
        result_text = f"[Error in {tool}: {exc}]"

    latency_ms = int((time.monotonic() - start_time) * 1000)
    product = _PRODUCT_MAP.get(tool, "unknown")

    # Derive status from content quality
    has_content = bool(result_text and len(result_text.strip()) > 50)
    ok = has_content
    status = "ok" if has_content else "empty"

    provider_call: ProviderCall = {
        "product": product,
        "tool": tool,
        "query_or_url": q,
        "latency_ms": latency_ms,
        "ok": ok,
        "status": status,
    }
    return result_text or f"[No data retrieved for: {q}]", provider_call


async def _attempt_with_retry(
    step: ResearchStep, product: str, base_timeout: float
) -> tuple[str, ProviderCall]:
    """Try once; retry eligible products once more at 60% timeout on TimeoutError."""
    async def _once(timeout: float) -> tuple[str, ProviderCall] | None:
        try:
            return await asyncio.wait_for(_execute(step), timeout=timeout)
        except asyncio.TimeoutError:
            return None

    # First attempt
    res = await _once(base_timeout)
    if res is not None:
        return res

    # Check retry eligibility
    if product not in _RETRY_PRODUCTS:
        log.warning(
            "Researcher: step %d timed out after %.0fs; not eligible for retry",
            step["step"], base_timeout
        )
        timeout_provider_call: ProviderCall = {
            "product": product,
            "tool": step["tool"],
            "query_or_url": step["query_or_url"],
            "latency_ms": int(base_timeout * 1000),
            "ok": False,
            "status": "timeout",
        }
        return f"[{step['tool']} timed out after {base_timeout:.0f}s — skipped]", timeout_provider_call

    # Second attempt
    retry_timeout = base_timeout * _RETRY_TIMEOUT_FACTOR
    log.info(
        "Researcher: step %d timed out; retrying in %.1fs with budget %.0fs...",
        step["step"], _RETRY_DELAY, retry_timeout
    )
    await asyncio.sleep(_RETRY_DELAY)
    
    res = await _once(retry_timeout)
    if res is not None:
        return res

    # Final failure
    log.error(
        "Researcher: step %d timed out on retry after %.0fs",
        step["step"], retry_timeout
    )
    timeout_provider_call: ProviderCall = {
        "product": product,
        "tool": step["tool"],
        "query_or_url": step["query_or_url"],
        "latency_ms": int((base_timeout + retry_timeout + _RETRY_DELAY) * 1000),
        "ok": False,
        "status": "timeout",
    }
    return f"[{step['tool']} timed out after {base_timeout:.0f}s — skipped]", timeout_provider_call


async def _run_step(step: ResearchStep, analysis_id: str) -> tuple[int, str, ProviderCall]:
    """Emit tool_call, execute with per-product timeout + retry, emit tool_result."""
    product = _PRODUCT_MAP.get(step["tool"], "unknown")
    base_timeout = _PRODUCT_TIMEOUT.get(product, 20.0)

    await ev.emit(
        analysis_id, "researcher", "tool_call",
        f"Step {step['step']}: {step['goal']}",
        product=product,
    )

    text, provider_call = await _attempt_with_retry(step, product, base_timeout)

    await ev.emit(
        analysis_id, "researcher", "tool_result",
        f"Step {step['step']} {provider_call['status']} — {provider_call['latency_ms']}ms, {len(text)} chars",
        product=product,
        payload={"latency_ms": provider_call["latency_ms"], "ok": provider_call["ok"], "status": provider_call["status"]},
    )

    return step["step"], text, provider_call


async def run_researcher(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    plan = state["research_plan"]

    await ev.emit(analysis_id, "researcher", "started",
                  f"Firing {len(plan)} steps in parallel…")

    wall_start = time.monotonic()

    # All steps fire concurrently — tool_call/tool_result events interleave in the live feed.
    raw_results: list[tuple[int, str, ProviderCall]] = await asyncio.gather(
        *[_run_step(step, analysis_id) for step in plan]
    )

    wall_ms = int((time.monotonic() - wall_start) * 1000)

    # Re-sort by step number for coherent findings narrative.
    raw_results.sort(key=lambda x: x[0])

    findings: list[str] = []
    provider_calls: list[ProviderCall] = []
    state_events: list[AgentEvent] = []

    step_map = {s["step"]: s for s in plan}
    for step_num, text, provider_call in raw_results:
        step = step_map[step_num]
        findings.append(f"### Step {step_num}: {step['goal']}\n\n{text}")
        provider_calls.append(provider_call)
        state_events.append({
            "agent": "researcher",
            "event_type": "tool_call",
            "message": f"Step {step_num}: {step['goal']}",
            "provider_product": provider_call["product"],
            "payload": {"provider_call": provider_call},
        })

    status_counts = {}
    for c in provider_calls:
        s = c.get("status", "unknown")
        status_counts[s] = status_counts.get(s, 0) + 1

    products_used = {c["product"] for c in provider_calls if c.get("status") == "ok"}
    products_attempted = {c["product"] for c in provider_calls}

    if len(products_attempted) < 5:
        missing = (
            {"serp_api", "mcp_server", "web_unlocker", "web_scraper_api", "scraping_browser"}
            - products_attempted
        )
        log.warning("Researcher: only %d/5 capabilities attempted — missing: %s", len(products_attempted), missing)

    await ev.emit(
        analysis_id, "researcher", "completed",
        f"Research done — {len(provider_calls)} calls, {len(products_used)}/5 ok, {wall_ms}ms wall",
        payload={
            "wall_time_ms": wall_ms,
            "products_covered": len(products_used),
            "status_counts": status_counts,
        },
    )

    return {
        "raw_findings": "\n\n---\n\n".join(findings),
        "provider_calls": provider_calls,
        "events": state_events,
    }
