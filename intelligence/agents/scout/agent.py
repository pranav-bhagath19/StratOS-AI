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


async def run_scout(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    target = state["target"]
    findings = state["raw_findings"]

    await ev.emit(analysis_id, "scout", "started", "Reviewing research for weaknesses…")
    await ev.emit(analysis_id, "scout", "thinking", "Probing data quality and gaps…")

    response_content = await get_llm_response(
        system_msg=_SYSTEM,
        messages=[HumanMessage(content=f"Target: {target}\n\nFindings:\n{findings[:6000]}")],
        max_tokens=1024,
    )

    try:
        raw_challenges = extract_json(response_content)
        if isinstance(raw_challenges, list):
            challenges = [str(c) for c in raw_challenges]
        else:
            challenges = [str(raw_challenges)] if raw_challenges else []
    except Exception as exc:
        log.warning(f"Scout failed to extract JSON from LLM response ({exc}). Using fallback challenges.")
        challenges = [
            "Verify data recency and completeness across research provider steps.",
            "Cross-reference key statements against secondary independent sources.",
        ]

    await ev.emit(
        analysis_id, "scout", "completed",
        f"Raised {len(challenges)} challenges",
        payload={"challenges": challenges},
    )

    event: AgentEvent = {
        "agent": "scout",
        "event_type": "completed",
        "message": f"{len(challenges)} challenges raised",
        "provider_product": None,
        "payload": {"challenges": challenges},
    }
    return {"challenges": challenges, "events": [event]}
