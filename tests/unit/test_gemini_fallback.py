"""Tests for Google Gemini cross-provider fallback."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from backend.config.config import settings
from intelligence.agents.base.llm import get_llm_result, LLMResult


@pytest.mark.asyncio
async def test_gemini_fallback_when_openrouter_exhausted():
    """When all OpenRouter models fail, system seamlessly falls back to Google Gemini."""
    openrouter_fail = Exception("HTTP 429: OpenRouter daily rate limit exceeded")
    gemini_resp = MagicMock(content="Strategic output from Google Gemini")

    with patch.object(settings, "openrouter_api_key", "sk-or-test"), \
         patch.object(settings, "gemini_api_key", "test-gemini-api-key"), \
         patch.object(settings, "gemini_model", "gemini-3.6-flash"):

        async def mock_ainvoke(messages):
            # If called via Gemini
            return gemini_resp

        # OpenRouter has 1 primary model (2 attempts) + 3 free models (1 attempt each) = 5 attempts
        with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=[
            openrouter_fail,
            openrouter_fail,
            openrouter_fail,
            openrouter_fail,
            openrouter_fail,
            gemini_resp,
        ]):
            res = await get_llm_result("system", [], 100, request_timeout=2.0)
            assert res.success is True
            assert res.content == "Strategic output from Google Gemini"
            assert "gemini" in res.model
            assert res.fallback_used is True


@pytest.mark.asyncio
async def test_gemini_primary_when_no_openrouter_key():
    """When OPENROUTER_API_KEY is not set, system routes directly to Google Gemini."""
    gemini_resp = MagicMock(content="Direct Gemini response")

    with patch.object(settings, "openrouter_api_key", ""), \
         patch.object(settings, "gemini_api_key", "test-gemini-api-key"), \
         patch.object(settings, "gemini_model", "gemini-3.6-flash"):

        with patch("langchain_openai.ChatOpenAI.ainvoke", return_value=gemini_resp):
            res = await get_llm_result("system", [], 100, request_timeout=2.0)
            assert res.success is True
            assert res.content == "Direct Gemini response"
            assert res.model == "gemini/gemini-3.6-flash"


@pytest.mark.asyncio
async def test_gemini_fallback_fails_gracefully():
    """When both OpenRouter and Gemini fail, returns structured failure without crashing."""
    openrouter_fail = Exception("HTTP 503: Service Unavailable")
    gemini_fail = Exception("HTTP 403: Gemini API key invalid")

    with patch.object(settings, "openrouter_api_key", "sk-or-test"), \
         patch.object(settings, "gemini_api_key", "test-gemini-api-key"):

        with patch("langchain_openai.ChatOpenAI.ainvoke", side_effect=[
            openrouter_fail,
            openrouter_fail,
            openrouter_fail,
            openrouter_fail,
            gemini_fail,
        ]):
            res = await get_llm_result("system", [], 100, request_timeout=2.0)
            assert res.success is False
            assert "Gemini" in res.error


@pytest.mark.asyncio
async def test_gemini_not_called_if_openrouter_succeeds():
    """When OpenRouter succeeds, Gemini is not engaged."""
    openrouter_resp = MagicMock(content="OpenRouter success")

    with patch.object(settings, "openrouter_api_key", "sk-or-test"), \
         patch.object(settings, "gemini_api_key", "test-gemini-api-key"):

        with patch("langchain_openai.ChatOpenAI.ainvoke", return_value=openrouter_resp):
            res = await get_llm_result("system", [], 100, request_timeout=2.0)
            assert res.success is True
            assert res.content == "OpenRouter success"
            assert "gemini" not in res.model
