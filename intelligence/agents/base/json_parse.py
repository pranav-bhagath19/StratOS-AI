"""Robust JSON extraction helper for LLM outputs."""

import json
import re
from typing import Any


def extract_json(raw: str) -> dict[str, Any] | list[Any]:
    """
    Extracts and parses a JSON object or array from raw LLM output strings.
    
    Handles:
    1. Direct clean JSON strings.
    2. Markdown code fences ```json ... ``` anywhere in the string.
    3. Leading/trailing commentary using balanced bracket extraction (string-aware).
    
    Raises ValueError with raw preview if no valid JSON can be extracted.
    """
    if not raw or not raw.strip():
        raise ValueError("Cannot extract JSON from empty LLM response.")

    raw_clean = raw.strip()

    # 1. Try direct parsing first
    try:
        data = json.loads(raw_clean)
        if isinstance(data, (dict, list)):
            return data
    except Exception:
        pass

    # 2. Try markdown code blocks using re.DOTALL anywhere in string
    code_block_matches = re.finditer(r"```(?:json)?\s*(.*?)\s*```", raw, re.DOTALL | re.IGNORECASE)
    for match in code_block_matches:
        fenced_content = match.group(1).strip()
        try:
            data = json.loads(fenced_content)
            if isinstance(data, (dict, list)):
                return data
        except Exception:
            pass

    # 3. Fallback: Find first balanced top-level { ... } or [ ... ] (string-aware)
    for i, char in enumerate(raw):
        if char not in ("{", "["):
            continue

        open_char = char
        close_char = "}" if open_char == "{" else "]"
        depth = 0
        in_string = False
        escape = False

        for j in range(i, len(raw)):
            c = raw[j]
            if in_string:
                if escape:
                    escape = False
                elif c == "\\":
                    escape = True
                elif c == '"':
                    in_string = False
            else:
                if c == '"':
                    in_string = True
                elif c == open_char:
                    depth += 1
                elif c == close_char:
                    depth -= 1
                    if depth == 0:
                        candidate = raw[i : j + 1]
                        try:
                            data = json.loads(candidate)
                            if isinstance(data, (dict, list)):
                                return data
                        except Exception:
                            pass
                        break

    preview = raw[:200] + ("..." if len(raw) > 200 else "")
    raise ValueError(f"Failed to extract valid JSON from LLM response. Raw response start: {preview!r}")
