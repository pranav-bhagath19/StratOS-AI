"""Coordinator — synthesizes the Executive Strategic Brief from verified intelligence."""

import json
import logging

from langchain_core.messages import HumanMessage
from intelligence.agents.base.llm import get_llm_response
from intelligence.agents.base.json_parse import extract_json

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, AnalysisState
from backend.config.config import settings

log = logging.getLogger(__name__)

_SYSTEM = """You are Coordinator — the synthesis and decision agent in StratOS AI.
Produce the Executive Strategic Brief from verified intelligence.

DECISION FRAMEWORK — apply in strict order:

1. ESCALATE (80–95): A verified finding shows an IMMINENT threat — active breach, hostile
   acquisition in progress, product being discontinued, regulatory enforcement action.

2. ATTACK (65–85): confidence ≥ 60 AND ≥ 3 verified findings point to a clear OPPORTUNITY:
   competitor misstep, leadership exit, funding gap, product miss, or market opening.

3. DEFEND (65–80): confidence ≥ 60 AND ≥ 2 verified findings show a MATERIAL THREAT to your
   competitive position that has not yet become critical.

4. WAIT (35–55): evidence exists but is contradictory, confidence < 60, or findings point in
   different directions — more data is needed before committing resources.

5. MONITOR (20–40): all findings are inconclusive or noise-level, OR confidence < 45.

CRITICAL: MONITOR is NOT a safe default. A real strategy chief commits to a call with available
evidence, however imperfect. If confidence ≥ 60 and ≥ 3 verified findings point in one direction,
that is ATTACK or DEFEND at 65+, not MONITOR at 52. Timidity is not conservatism — it is failure.
Never fabricate findings. Never inflate scores beyond evidence. But never hedge when evidence is clear.

Market Move Score calibration:
- 81–100  Critical — act within 24–48h
- 61–80   Strong — act this week
- 41–60   Moderate — plan a response
- 21–40   Low — situational awareness only
- 0–20    Noise — no action needed

Respond with ONLY the JSON object/array. No preamble, no explanation, no markdown code fences, no text before or after the JSON:
{
  "market_move_score": 72,
  "recommended_move": "ATTACK",
  "headline": "One sentence, under 20 words, for the C-suite",
  "situation": "2-3 sentence situation assessment",
  "key_findings": [
    {"agent": "researcher", "headline": "Key finding in one line", "detail": "Supporting detail", "confidence": 80}
  ],
  "action_pack": {
    "immediate": ["Do this today"],
    "this_week": ["Do this week"],
    "watch": ["Monitor this signal"]
  },
  "coordinator_rationale": "Why this move was chosen over alternatives"
}"""


async def run_coordinator(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    analysis_type = state["analysis_type"]
    target = state["target"]
    verified_findings = state["verified_findings"]
    confidence_score = state["confidence_score"]
    challenges = state["challenges"]
    provider_calls = state["provider_calls"]

    await ev.emit(analysis_id, "coordinator", "started", "Synthesizing intelligence into Battle Brief…")
    await ev.emit(analysis_id, "coordinator", "thinking", "Evaluating move options…")

    products_used = list({c["product"] for c in provider_calls})
    provider_summary = f"{len(provider_calls)} calls across: {', '.join(products_used)}"

    human = (
        f"Analysis: {analysis_type}\nTarget: {target}\n"
        f"Intelligence confidence: {confidence_score}/100\n"
        f"Provider coverage: {provider_summary}\n\n"
        f"Verified Intelligence:\n{verified_findings}\n\n"
        f"Open Challenges:\n{json.dumps(challenges, indent=2)}"
    )

    response_content = await get_llm_response(
        system_msg=_SYSTEM,
        messages=[HumanMessage(content=human)],
        max_tokens=2048,
    )

    try:
        data = extract_json(response_content)
        if not isinstance(data, dict):
            data = {}
    except Exception as exc:
        log.warning(f"Coordinator failed to extract JSON from LLM output ({exc}). Using fallback brief.")
        data = {}

    market_move_score = max(0, min(100, int(data.get("market_move_score", 50))))
    recommended_move = data.get("recommended_move", "MONITOR")
    executive_summary = f"{data.get('headline', '')} {data.get('situation', '')}".strip() or f"Executive Strategic Brief for {target}"
    action_pack = {
        "headline": data.get("headline", f"Executive Strategic Brief: {target}"),
        "situation": data.get("situation", "Synthesized intelligence based on available research results."),
        "key_findings": data.get("key_findings", []),
        "actions": data.get("action_pack", {"immediate": [], "this_week": [], "watch": []}),
        "coordinator_rationale": data.get("coordinator_rationale", "Fallback rationale generated due to synthesis output structure."),
    }

    await ev.emit(
        analysis_id, "coordinator", "completed",
        f"Battle Brief: {recommended_move} — Score {market_move_score}/100",
        payload={"market_move_score": market_move_score, "recommended_move": recommended_move},
    )

    event: AgentEvent = {
        "agent": "coordinator",
        "event_type": "completed",
        "message": f"{recommended_move} — Score {market_move_score}/100",
        "provider_product": None,
        "payload": {"market_move_score": market_move_score, "recommended_move": recommended_move},
    }
    return {
        "market_move_score": market_move_score,
        "recommended_move": recommended_move,
        "executive_summary": executive_summary,
        "action_pack": action_pack,
        "events": [event],
    }
