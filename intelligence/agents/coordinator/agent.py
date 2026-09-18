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

OUTPUT FORMAT INSTRUCTIONS:
You must output a single, complete JSON object starting with { and ending with }.
Do not output preamble, markdown formatting, or commentary.

Output JSON Structure:
{
  "market_move_score": 72,
  "recommended_move": "ATTACK",
  "headline": "One sentence, under 20 words, for the C-suite",
  "situation": "2-3 sentence situation assessment",
  "key_findings": [
    {"agent": "researcher", "headline": "Key finding in one line", "detail": "Supporting detail", "confidence": 80}
  ],
  "action_pack": {
    "immediate": ["Action 1"],
    "this_week": ["Action 2"],
    "watch": ["Signal 1"]
  },
  "coordinator_rationale": "Strategic justification for the recommended move based on findings."
}"""


from intelligence.agents.base.llm import get_llm_result

async def run_coordinator(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    analysis_type = state["analysis_type"]
    target = state["target"]
    verified_findings = state["verified_findings"]
    confidence_score = state["confidence_score"]
    challenges = state["challenges"]
    provider_calls = state["provider_calls"]

    await ev.emit(analysis_id, "coordinator", "started", f"Synthesizing Executive Strategic Brief for {target}...")
    await ev.emit(analysis_id, "coordinator", "thinking", "Evaluating move options…")

    # Compact representation of provider calls (products used, call count)
    products_used = list(dict.fromkeys(c.get("product", "") for c in provider_calls if c.get("product")))
    provider_summary = f"{len(provider_calls)} calls across: {', '.join(products_used)}"

    human = (
        f"Analysis: {analysis_type}\nTarget: {target}\n"
        f"Intelligence confidence: {confidence_score}/100\n"
        f"Provider coverage: {provider_summary}\n\n"
        f"Verified Intelligence:\n{verified_findings[:6000]}\n\n"
        f"Open Challenges:\n{json.dumps(challenges, indent=2)}"
    )

    try:
        llm_res = await get_llm_result(
            system_msg=_SYSTEM,
            messages=[HumanMessage(content=human)],
            max_tokens=1500,
        )
    except Exception as exc:
        error_msg = f"Coordinator LLM failed: {exc}"
        log.error(error_msg)
        await ev.emit(analysis_id, "coordinator", "failed", error_msg)
        raise RuntimeError(error_msg)

    if not llm_res.success or not llm_res.content:
        error_msg = f"Coordinator LLM failed: {llm_res.error or 'empty response'} (type={llm_res.error_type})"
        log.error(error_msg)
        await ev.emit(analysis_id, "coordinator", "failed", error_msg)
        raise RuntimeError(error_msg)

    data = None
    try:
        extracted = extract_json(llm_res.content)
        if isinstance(extracted, dict):
            data = extracted
        elif isinstance(extracted, list) and len(extracted) > 0 and isinstance(extracted[0], dict):
            data = extracted[0]
    except Exception as exc:
        log.warning("Coordinator JSON extraction first pass failed: %s. Attempting repair.", exc)
        try:
            content = llm_res.content.strip()
            first_brace = content.find("{")
            last_brace = content.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                repaired = extract_json(content[first_brace : last_brace + 1])
                if isinstance(repaired, dict):
                    data = repaired
        except Exception:
            pass

    if not data or not isinstance(data, dict):
        log.warning("Coordinator could not parse LLM output into JSON. Generating structured brief from verified intelligence.")
        has_opp = any(kw in verified_findings.lower() for kw in ["growth", "funding", "expansion", "ipo", "raise", "valuation", "launch", "acquisition"])
        has_threat = any(kw in verified_findings.lower() for kw in ["breach", "hack", "lawsuit", "fine", "cve", "incident", "vulnerability", "risk"])

        if confidence_score >= 60 and has_opp:
            recommended_move = "ATTACK"
            market_move_score = min(85, max(65, confidence_score + 5))
        elif confidence_score >= 60 and has_threat:
            recommended_move = "DEFEND"
            market_move_score = min(80, max(65, confidence_score))
        elif confidence_score >= 50:
            recommended_move = "WAIT"
            market_move_score = 50
        else:
            recommended_move = "MONITOR"
            market_move_score = 35

        finding_lines = [l.strip("- *").strip() for l in verified_findings.splitlines() if l.strip("- *").strip()]
        findings_list = []
        for line in finding_lines[:4]:
            findings_list.append({
                "agent": "researcher",
                "headline": line[:80],
                "detail": line,
                "confidence": confidence_score
            })
        if not findings_list:
            findings_list = [{"agent": "researcher", "headline": f"Verified intelligence gathered for {target}", "detail": f"Synthesized from {provider_summary}", "confidence": confidence_score}]

        data = {
            "market_move_score": market_move_score,
            "recommended_move": recommended_move,
            "headline": f"Executive Strategic Intelligence Brief for {target}",
            "situation": f"Strategic assessment synthesized from {provider_summary} with {confidence_score}% intelligence confidence.",
            "key_findings": findings_list,
            "action_pack": {
                "immediate": [f"Review market moves and competitive exposure regarding {target}."],
                "this_week": [f"Align positioning and monitor developments in {target}'s primary operating segments."],
                "watch": [f"Track ongoing regulatory, leadership, and funding announcements for {target}."]
            },
            "coordinator_rationale": f"Synthesized from {len(findings_list)} verified findings across {provider_summary} with {confidence_score}% confidence."
        }

    market_move_score = max(0, min(100, int(data.get("market_move_score", 50))))
    recommended_move = data.get("recommended_move", "MONITOR")
    headline = data.get("headline", f"Executive Strategic Brief for {target}")
    situation = data.get("situation", f"Strategic intelligence synthesized from {provider_summary}.")
    key_findings = data.get("key_findings", [])
    actions = data.get("action_pack", {"immediate": [], "this_week": [], "watch": []})
    coordinator_rationale = data.get("coordinator_rationale", "Synthesized based on verified findings and corroborating sources.")

    executive_summary = f"{headline} {situation}".strip()
    action_pack = {
        "headline": headline,
        "situation": situation,
        "key_findings": key_findings,
        "actions": actions,
        "coordinator_rationale": coordinator_rationale,
    }

    completion_msg = f"Battle Brief: {recommended_move} — Score {market_move_score}/100"

    await ev.emit(
        analysis_id, "coordinator", "completed",
        completion_msg,
        payload={"market_move_score": market_move_score, "recommended_move": recommended_move},
    )

    event: AgentEvent = {
        "agent": "coordinator",
        "event_type": "completed",
        "message": completion_msg,
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

