"""Scout — challenges research findings and surfaces verification gaps."""

import json
import logging

from langchain_core.messages import HumanMessage
from intelligence.agents.base.llm import get_llm_response
from intelligence.agents.base.json_parse import extract_json

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, AnalysisState
from backend.config.config import settings

log = logging.getLogger(__name__)

_SYSTEM = """You are the Scout agent in StratOS AI.
Critically review the research findings and raise 3-5 pointed challenges.

Focus on:
- Data gaps: What important information is missing?
- Recency: Is the data fresh enough to act on?
- Source quality: Are sources credible and independent?
- Contradictions: Do any findings conflict with each other?
- Bias or incompleteness: Is any claim likely skewed?

Respond with ONLY the JSON object/array. No preamble, no explanation, no markdown code fences, no text before or after the JSON.
["Challenge 1...", "Challenge 2...", ...]"""


from intelligence.agents.base.evidence import format_structured_evidence
from intelligence.agents.base.llm import get_llm_result

async def run_scout(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    target = state["target"]
    findings = state["raw_findings"]
    provider_calls = state.get("provider_calls", [])

    await ev.emit(analysis_id, "scout", "started", "Reviewing research for weaknesses…")
    await ev.emit(analysis_id, "scout", "thinking", "Probing data quality and gaps…")

    # Structured evidence compression across all steps instead of hard truncation
    structured_evidence = format_structured_evidence(findings, provider_calls, max_total_chars=8000)

    try:
        llm_res = await get_llm_result(
            system_msg=_SYSTEM,
            messages=[HumanMessage(content=f"Target: {target}\n\nFindings:\n{structured_evidence}")],
            max_tokens=1024,
        )
    except Exception as exc:
        error_msg = f"Scout LLM failed: {exc}"
        log.error(error_msg)
        await ev.emit(analysis_id, "scout", "failed", error_msg)
        raise RuntimeError(error_msg)

    if not llm_res.success or not llm_res.content:
        error_msg = f"Scout LLM failed: {llm_res.error or 'empty response'} (type={llm_res.error_type})"
        log.error(error_msg)
        await ev.emit(analysis_id, "scout", "failed", error_msg)
        raise RuntimeError(error_msg)

    try:
        raw_challenges = extract_json(llm_res.content)
        if isinstance(raw_challenges, list) and len(raw_challenges) > 0:
            challenges = [str(c) for c in raw_challenges]
        else:
            error_msg = "Scout LLM returned invalid challenge format."
            log.error(error_msg)
            await ev.emit(analysis_id, "scout", "failed", error_msg)
            raise RuntimeError(error_msg)
    except RuntimeError:
        raise
    except Exception as exc:
        error_msg = f"Scout JSON extraction failed: {exc}"
        log.error(error_msg)
        await ev.emit(analysis_id, "scout", "failed", error_msg)
        raise RuntimeError(error_msg)

    msg = f"Raised {len(challenges)} challenges"

    await ev.emit(
        analysis_id, "scout", "completed",
        msg,
        payload={"challenges": challenges},
    )

    event: AgentEvent = {
        "agent": "scout",
        "event_type": "completed",
        "message": msg,
        "provider_product": None,
        "payload": {"challenges": challenges},
    }
    return {"challenges": challenges, "events": [event]}

