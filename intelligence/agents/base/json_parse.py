"""Robust JSON extraction helper for LLM outputs."""

import json
import re
import ast
from typing import Any


def _clean_json_str(s: str) -> str:
    """Cleans common LLM JSON syntax errors (trailing commas, control chars, python literals)."""
    # Remove control characters except newline and tab
    s = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", " ", s)
    # Remove trailing commas in arrays/objects: [1, 2,] or {"a": 1,}
    s = re.sub(r",\s*([\]}])", r"\1", s)
    return s.strip()


def extract_json(raw: str) -> dict[str, Any] | list[Any]:
    """
    Extracts and parses a JSON object or array from raw LLM output strings.
    
    Handles:
    1. Direct clean JSON strings.
    2. Reasoning tags like <think>...</think>.
    3. Markdown code fences ```json ... ``` anywhere in the string.
    4. Commentary before/after JSON by evaluating all balanced bracket candidates.
    5. Fallbacks for trailing commas and Python dict/list representations.
    
    Raises ValueError with raw preview if no valid JSON can be extracted.
    """
    if not raw or not raw.strip():
        raise ValueError("Cannot extract JSON from empty LLM response.")

    # Remove reasoning thinking tags if present
    cleaned_raw = re.sub(r"<think>.*?</think>", "", raw, flags=re.DOTALL | re.IGNORECASE).strip()
    if not cleaned_raw:
        cleaned_raw = raw.strip()

    # 1. Try direct parsing first
    for candidate_str in (cleaned_raw, _clean_json_str(cleaned_raw)):
        try:
            data = json.loads(candidate_str)
            if isinstance(data, (dict, list)):
                return data
        except Exception:
            pass

    # 2. Try markdown code blocks using re.DOTALL anywhere in string
    code_block_matches = re.finditer(r"```(?:json)?\s*(.*?)\s*```", cleaned_raw, re.DOTALL | re.IGNORECASE)
    for match in code_block_matches:
        fenced_content = match.group(1).strip()
        for candidate_str in (fenced_content, _clean_json_str(fenced_content)):
            try:
                data = json.loads(candidate_str)
                if isinstance(data, (dict, list)):
                    return data
            except Exception:
                pass
            try:
                # Fallback to literal_eval if single quotes were used
                data = ast.literal_eval(candidate_str)
                if isinstance(data, (dict, list)):
                    return data
            except Exception:
                pass

    # 3. Comprehensive Bracket Search: Find all balanced top-level { ... } or [ ... ]
    # Collect all valid JSON bracket candidates
    candidates: list[str] = []
    
    for i, char in enumerate(cleaned_raw):
        if char not in ("{", "["):
            continue

        open_char = char
        close_char = "}" if open_char == "{" else "]"
        depth = 0
        in_string = False
        escape = False

        for j in range(i, len(cleaned_raw)):
            c = cleaned_raw[j]
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
                        candidates.append(cleaned_raw[i : j + 1])
                        break

    # Prioritize candidates by length (longest candidates first)
    candidates.sort(key=len, reverse=True)

    for candidate in candidates:
        for candidate_str in (candidate, _clean_json_str(candidate)):
            try:
                data = json.loads(candidate_str)
                if isinstance(data, (dict, list)):
                    return data
            except Exception:
                pass
            try:
                data = ast.literal_eval(candidate_str)
                if isinstance(data, (dict, list)):
                    return data
            except Exception:
                pass

    preview = raw[:250] + ("..." if len(raw) > 250 else "")
    raise ValueError(f"Failed to extract valid JSON from LLM response. Raw response start: {preview!r}")
