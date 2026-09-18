"""Evidence processing and structured compression module for StratOS AI.
Extracts, deduplicates, prioritizes, and compresses research findings to fit
model context windows without naive hard-slicing.
"""

import re
from typing import Any


def extract_key_claims(text: str, max_items_per_step: int = 5) -> list[str]:
    """Extracts non-trivial lines, claims, or bullet points from a step's text."""
    if not text:
        return []

    lines = [line.strip() for line in text.split("\n") if line.strip()]
    cleaned_lines = []
    seen = set()

    for line in lines:
        # Skip markdown headers, dividers, or boilerplate
        if line.startswith("#") or line.startswith("---") or line.startswith("==="):
            continue
        if len(line) < 15:
            continue
        # Deduplicate near-identical lines
        norm = re.sub(r"\s+", " ", line.lower())
        if norm in seen:
            continue
        seen.add(norm)
        cleaned_lines.append(line)
        if len(cleaned_lines) >= max_items_per_step:
            break

    return cleaned_lines


def format_structured_evidence(
    raw_findings: str,
    provider_calls: list[dict[str, Any]],
    max_total_chars: int = 8000,
) -> str:
    """Transforms raw multi-step research findings into a structured, balanced summary.
    Preserves citations, source tools, dates, and evidence from ALL steps rather than
    chopping off later steps with findings[:4500].
    """
    if not raw_findings:
        return "No research findings gathered."

    # Parse steps from raw_findings (separated by '### Step' or '---')
    sections = re.split(r"(?=### Step \d+:)", raw_findings)
    steps_data = []

    for sec in sections:
        sec = sec.strip()
        if not sec:
            continue
        header_match = re.search(r"### Step (\d+):\s*(.*)", sec)
        if header_match:
            step_num = int(header_match.group(1))
            goal = header_match.group(2).split("\n")[0].strip()
            # The body after the header line
            body = sec[header_match.end():].strip()
            steps_data.append((step_num, goal, body))
        else:
            # Fallback for unformatted section
            steps_data.append((len(steps_data) + 1, "General Intel", sec))

    # Determine per-step character budget
    num_steps = max(1, len(steps_data))
    budget_per_step = max(400, max_total_chars // num_steps)

    formatted_steps = []
    for step_num, goal, body in steps_data:
        # Find corresponding provider call metadata
        pcall = next((c for c in provider_calls if c.get("step") == step_num or c.get("tool")), {})
        tool = pcall.get("tool", "unknown")
        status = pcall.get("status", "ok" if len(body) > 50 else "empty")
        url = pcall.get("query_or_url", "")

        # Extract structured items
        claims = extract_key_claims(body, max_items_per_step=6)
        summary_body = "\n".join(f"- {c}" for c in claims) if claims else body[:budget_per_step]

        if len(summary_body) > budget_per_step:
            summary_body = summary_body[:budget_per_step] + "… [compressed]"

        formatted_steps.append(
            f"### Step {step_num} [{tool.upper()} - {status.upper()}]\n"
            f"Goal: {goal}\n"
            f"Source/URL: {url}\n"
            f"Key Findings & Citations:\n{summary_body}"
        )

    return "\n\n---\n\n".join(formatted_steps)
