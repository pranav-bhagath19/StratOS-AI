"""Unit tests for extract_json helper."""

import pytest
from intelligence.agents.base.json_parse import extract_json


def test_clean_json_object():
    raw = '{"key": "value", "count": 42}'
    parsed = extract_json(raw)
    assert parsed == {"key": "value", "count": 42}


def test_clean_json_array():
    raw = '["item1", "item2", "item3"]'
    parsed = extract_json(raw)
    assert parsed == ["item1", "item2", "item3"]


def test_json_wrapped_in_markdown_code_fence():
    raw = """Here is your output:
```json
{
  "status": "success",
  "data": [1, 2, 3]
}
```
Hope this helps!"""
    parsed = extract_json(raw)
    assert parsed == {"status": "success", "data": [1, 2, 3]}


def test_json_with_leading_sentence():
    raw = 'Here is the analysis:\n{"market_move_score": 75, "recommended_move": "ATTACK"}'
    parsed = extract_json(raw)
    assert parsed == {"market_move_score": 75, "recommended_move": "ATTACK"}


def test_json_with_trailing_commentary():
    raw = '[{"step": 1, "goal": "search"}]\nNote: This plan covers all 5 Bright Data tools.'
    parsed = extract_json(raw)
    assert parsed == [{"step": 1, "goal": "search"}]


def test_json_with_nested_brackets_in_strings():
    raw = 'Sure! {"headline": "Notice [Update]: {New Product}", "valid": true}'
    parsed = extract_json(raw)
    assert parsed == {"headline": "Notice [Update]: {New Product}", "valid": True}


def test_invalid_json_raises_descriptive_value_error():
    raw = "I'm sorry, but I cannot generate a JSON response for this request."
    with pytest.raises(ValueError) as exc_info:
        extract_json(raw)
    assert "Failed to extract valid JSON from LLM response" in str(exc_info.value)
    assert "I'm sorry, but I cannot generate" in str(exc_info.value)
