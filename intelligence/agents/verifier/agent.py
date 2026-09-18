"""Verifier — resolves Scout challenges and assigns a confidence score."""

import json
import logging

from langchain_core.messages import HumanMessage
from intelligence.agents.base.llm import get_llm_response
from intelligence.agents.base.json_parse import extract_json

from intelligence.agents.base import events as ev
from intelligence.agents.base.state import AgentEvent, AnalysisState
from backend.config.config import settings

log = logging.getLogger(__name__)

_SYSTEM = """You are the Verifier agent in StratOS AI.
Address the Scout's challenges against the research data.

For each challenge:
- CONFIRMED: Challenge is valid — the data is limited here
- REFUTED: Challenge is unfounded — the data adequately covers this
- PARTIAL: Partially valid — note the nuance

Then produce verified_findings: a crisp Markdown summary of what we KNOW with high confidence.

CONFIDENCE CALCULATION RULE — READ CAREFULLY:
Confidence measures the QUALITY of what you found, NOT the percentage of steps that succeeded.
A step that returned empty or timed out is a COLLECTION GAP, not negative evidence.
It means "we don't know" for that dimension — it does NOT reduce confidence in what you DID find.

Calibration:
- If 2 sources independently confirm the same specific event (e.g., a named breach, a named acquisition,
  a named financial figure), that is STRONG corroboration → base confidence 75–85, regardless of how
  many other steps returned empty.
- If 3+ sources corroborate and data is recent → 80–95.
- If only 1 source found data but that data is specific and detailed → 55–70.
- Empty/failed steps do not lower confidence — they just limit SCOPE of what you can speak to.

Apply penalties ONLY for timeouts (status: timeout): subtract 5 per timed-out step, max -15.
DO NOT apply any penalty for empty or failed steps.

CONCRETE EXAMPLES:
  Bad:  2 ok steps (both at 80% quality) + 4 empty steps → confidence 32 ← WRONG
  Good: 2 ok steps (both at 80% quality) + 4 empty steps → confidence 78 - 0 = 78 ← CORRECT
  Good: 2 ok steps (80%) + 1 timeout + 3 empty → confidence 78 - 5 = 73 ← CORRECT
  Good: 1 ok step (specific named event) + 5 empty → confidence 62 ← CORRECT

Confidence scale (apply to what you DID find):
- 80–100: Strong corroboration of specific facts across ≥2 independent sources
- 60–79: Solid — 1–2 sources with specific, named, verifiable findings
- 40–59: Partial — directional signals but no specific verifiable facts
- Below 40: Genuinely insufficient — only speculation or hearsay found (NOT same as "few sources")

OUTPUT FORMAT INSTRUCTIONS:
You must output a single, complete JSON object starting with { and ending with }.
Do not output preamble, markdown formatting, or commentary.

Output JSON Structure:
{
  "verified_findings": "## Verified Intelligence\\n...",
  "confidence_score": 72,
  "resolutions": [{"challenge": "...", "verdict": "CONFIRMED", "note": "..."}]
}"""


from intelligence.agents.base.evidence import format_structured_evidence
from intelligence.agents.base.llm import get_llm_result

async def run_verifier(state: AnalysisState) -> dict:
    analysis_id = state["analysis_id"]
    target = state["target"]
    raw_findings = state["raw_findings"]
    challenges = state["challenges"]
    provider_calls = state["provider_calls"]

    await ev.emit(analysis_id, "verifier", "started", f"Verifying intelligence findings for {target}…")
    await ev.emit(analysis_id, "verifier", "thinking", "Resolving Scout challenges against evidence…")

    # Bounded structured evidence view
    structured_evidence = format_structured_evidence(
        raw_findings=raw_findings,
        provider_calls=provider_calls,
        max_total_chars=8000,
    )

    # Count actual timeouts for the calibration rule
    timeout_count = sum(
        1 for c in provider_calls
        if c.get("status") == "timeout"
    )
    penalty = min(timeout_count * 5, 15)

    human = (
        f"Target: {target}\n\n"
        f"Step summary: {len(provider_calls)} calls executed"
        + f"\n\nTimed-out steps: {timeout_count} → apply -{penalty} confidence penalty (max -15)\n\n"
        f"Research Findings:\n{structured_evidence}\n\n"
        f"Scout Challenges:\n{json.dumps(challenges, indent=2)}"
    )

    try:
        llm_res = await get_llm_result(
            system_msg=_SYSTEM,
            messages=[HumanMessage(content=human)],
            max_tokens=3000,
        )
    except Exception as exc:
        error_msg = f"Verifier LLM failed: {exc}"
        log.error(error_msg)
        await ev.emit(analysis_id, "verifier", "failed", error_msg)
        raise RuntimeError(error_msg)

    if not llm_res.success or not llm_res.content:
        error_msg = f"Verifier LLM failed: {llm_res.error or 'empty response'} (type={llm_res.error_type})"
        log.error(error_msg)
        await ev.emit(analysis_id, "verifier", "failed", error_msg)
        raise RuntimeError(error_msg)

    try:
        extracted = extract_json(llm_res.content)
        if isinstance(extracted, list) and len(extracted) > 0 and isinstance(extracted[0], dict):
            extracted = extracted[0]

        if isinstance(extracted, dict):
            # Normalise confidence score key if alternative name was used
            if "confidence_score" not in extracted:
                for alt in ("confidence", "score", "confidenceScore", "overall_confidence"):
                    if alt in extracted:
                        extracted["confidence_score"] = extracted[alt]
                        break
            if "confidence_score" not in extracted:
                # Check inside any sub-dictionary
                for val in extracted.values():
                    if isinstance(val, dict) and ("confidence_score" in val or "confidence" in val):
                        extracted["confidence_score"] = val.get("confidence_score", val.get("confidence"))
                        break

            # Regex fallback for confidence_score if still missing from dict
            if "confidence_score" not in extracted:
                import re
                m = re.search(r'["\']?confidence(?:_score)?["\']?\s*[:=]\s*(\d+)', llm_res.content, re.IGNORECASE)
                if m:
                    extracted["confidence_score"] = int(m.group(1))

        if not isinstance(extracted, dict) or "confidence_score" not in extracted:
            error_msg = "Verifier LLM returned invalid format (expected dict with confidence_score)."
            log.error(error_msg)
            await ev.emit(analysis_id, "verifier", "failed", error_msg)
            raise RuntimeError(error_msg)
        data = extracted
    except RuntimeError:
        raise
    except Exception as exc:
        error_msg = f"Verifier JSON extraction failed: {exc}"
        log.error(error_msg)
        await ev.emit(analysis_id, "verifier", "failed", error_msg)
        raise RuntimeError(error_msg)

    confidence_score = max(0, min(100, int(data["confidence_score"])))
    verified_findings = data.get("verified_findings") or data.get("findings") or data.get("summary") or ""

    msg = f"Confidence: {confidence_score}/100"

    await ev.emit(
        analysis_id, "verifier", "completed",
        msg,
        payload={"confidence_score": confidence_score},
    )

    event: AgentEvent = {
        "agent": "verifier",
        "event_type": "completed",
        "message": msg,
        "provider_product": None,
        "payload": {"confidence_score": confidence_score},
    }
    return {
        "verified_findings": verified_findings,
        "confidence_score": confidence_score,
        "events": [event],
    }

