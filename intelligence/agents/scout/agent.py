"""Scout — challenges research findings and surfaces verification gaps."""

import json

from langchain_core.messages import HumanMessage
from intelligence.agents.base.llm import get_llm_response, parse_json_from_llm

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, AnalysisState
from backend.config.config import settings

_SYSTEM = """You are the Scout agent in StratOS AI.
Critically review the research findings and raise 3-5 pointed challenges.

Focus on:
- Data gaps: What important information is missing?
- Recency: Is the data fresh enough to act on?
- Source quality: Are sources credible and independent?
- Contradictions: Do any findings conflict with each other?
- Bias or incompleteness: Is any claim likely skewed?

Output ONLY a JSON array of challenge strings — no markdown, no explanation:
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

    challenges: list[str] = parse_json_from_llm(response_content)

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
