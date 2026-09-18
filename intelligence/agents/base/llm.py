"""Resilient LLM invocation layer for StratOS AI.
Supports primary paid models with automatic fallback to secondary models.
Handles HTTP 429, 5xx (500, 502, 503, 504), timeouts, and network errors.
"""

import asyncio
import logging
import os
import random
from dataclasses import dataclass
from typing import Any

from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
import openai
import httpx

from backend.config.config import settings

log = logging.getLogger(__name__)


@dataclass
class LLMResult:
    success: bool
    content: str = ""
    model: str | None = None
    error: str | None = None
    error_type: str | None = None  # rate_limit | service_overload | timeout | auth | general
    fallback_used: bool = False
    attempts: int = 0


class LLMInvocationError(RuntimeError):
    """Raised when all configured LLM models fail after retries."""
    def __init__(self, message: str, result: LLMResult):
        super().__init__(message)
        self.result = result


def _is_transient_error(e: Exception) -> tuple[bool, str]:
    """Detects whether an error is transient/recoverable via retry or fallback.
    Returns (is_transient, error_category).
    """
    err_str = str(e).lower()

    # 0. Payment required / credits exhausted (HTTP 402) - non-transient for this model; rotate immediately
    if getattr(e, "status_code", None) == 402 or "402" in err_str or "credit" in err_str or "afford" in err_str:
        return False, "insufficient_credits"

    # 1. Rate limits (HTTP 429)
    if isinstance(e, openai.RateLimitError) or getattr(e, "status_code", None) == 429 or "429" in err_str or "rate limit" in err_str:
        return True, "rate_limit"

    # 2. Server-side errors / Overloaded (HTTP 500, 502, 503, 504)
    status = getattr(e, "status_code", None)
    if status in (500, 502, 503, 504):
        return True, "service_overload"

    if any(code in err_str for code in ("500", "502", "503", "504", "overloaded", "capacity", "bad gateway", "service unavailable")):
        return True, "service_overload"

    # Check OpenAI API error response body
    if hasattr(e, "body") and isinstance(e.body, dict):
        code = e.body.get("code")
        if code in (429, 500, 502, 503, 504):
            return True, "service_overload" if code != 429 else "rate_limit"
        msg = str(e.body.get("message", "")).lower()
        if "overload" in msg or "rate limit" in msg or "unavailable" in msg:
            return True, "service_overload"

    # 3. Timeouts
    if isinstance(e, (asyncio.TimeoutError, TimeoutError, httpx.TimeoutException)):
        return True, "timeout"
    if "timeout" in err_str or "timed out" in err_str:
        return True, "timeout"

    # 4. Connection / Network errors
    if isinstance(e, (httpx.ConnectError, httpx.NetworkError, openai.APIConnectionError)):
        return True, "connection_error"
    if "connection error" in err_str or "failed to connect" in err_str:
        return True, "connection_error"

    # Non-transient errors (e.g. 401 Unauthorized, 400 Bad Request syntax)
    return False, "fatal"


def get_model_pipeline() -> list[str]:
    """Constructs the prioritized model chain:
    Primary configured model -> Fallback rotation (no duplicates).
    """
    models: list[str] = []

    # If an explicit model is configured (and not an empty placeholder), try it first
    primary = (settings.openrouter_model or "").strip()
    if primary and primary != "none":
        models.append(primary)

    # Append fallback free-tier or alternative models
    for m in settings.openrouter_free_models:
        m_clean = m.strip()
        if m_clean and m_clean not in models:
            models.append(m_clean)

    return models if models else ["anthropic/claude-3.5-sonnet", "google/gemma-4-31b-it:free"]


async def get_llm_result(
    system_msg: str,
    messages: list,
    max_tokens: int,
    request_timeout: float = 12.0,
    max_retries_per_model: int = 1,
) -> LLMResult:
    """Executes an LLM call across the prioritized model pipeline with bounded backoff.
    Never throws unhandled provider exceptions; returns an LLMResult.
    """
    models = get_model_pipeline()
    total_attempts = 0
    last_error_type = "unknown"
    last_error_msg = ""
    primary_model = models[0] if models else "unknown"

    if settings.openrouter_api_key:
        for idx, model in enumerate(models):
            is_fallback = (idx > 0)
            # Fast failover on fallback models: 0 retries per fallback model to rotate quickly
            allowed_retries = max_retries_per_model if not is_fallback else 0
            
            for attempt in range(allowed_retries + 1):
                total_attempts += 1
                
                # Rate limit pacing: apply delay + jitter on retries only
                if attempt > 0:
                    jitter = random.uniform(0.05, 0.15)
                    await asyncio.sleep(0.1 + jitter)

                try:
                    log.info(
                        "[LLM] Attempting call with model '%s' (fallback=%s, attempt=%d/%d)",
                        model, is_fallback, attempt + 1, allowed_retries + 1
                    )
                    payload_messages = [SystemMessage(content=system_msg)] + messages
                    llm = ChatOpenAI(
                        model=model,
                        openai_api_key=settings.openrouter_api_key,
                        openai_api_base=settings.openrouter_base_url,
                        timeout=request_timeout,
                        max_retries=0,  # We manage retries explicitly for deterministic failover
                        max_tokens=max_tokens,
                    )

                    response = await asyncio.wait_for(
                        llm.ainvoke(payload_messages),
                        timeout=request_timeout,
                    )
                    content = str(response.content) if response and response.content is not None else ""

                    if not content.strip():
                        log.warning("[LLM] Model '%s' returned empty response.", model)
                        last_error_type = "empty_response"
                        last_error_msg = f"Model '{model}' returned empty content"
                        continue  # Retry or move to next model

                    log.info("[LLM] Success served by model: '%s'", model)
                    return LLMResult(
                        success=True,
                        content=content,
                        model=model,
                        fallback_used=is_fallback,
                        attempts=total_attempts,
                    )

                except Exception as e:
                    is_transient, err_category = _is_transient_error(e)
                    last_error_type = err_category
                    last_error_msg = str(e)

                    if is_transient:
                        log.warning(
                            "[LLM] Model '%s' failed with transient %s (%s). Attempt %d/%d.",
                            model, err_category, e, attempt + 1, allowed_retries + 1
                        )
                        if attempt < allowed_retries:
                            # Exponential backoff with jitter before retrying same model
                            backoff = (0.5 * (2 ** attempt)) + random.uniform(0.1, 0.4)
                            await asyncio.sleep(backoff)
                            continue
                        else:
                            log.info("[LLM] Retries exhausted for '%s'. Falling back to next model.", model)
                            break  # Fall back to next model in list
                    else:
                        # Non-transient error (e.g. 401 or bad request)
                        log.error("[LLM] Model '%s' encountered non-transient error: %s", model, e)
                        # If this was the primary model and failed with e.g. model not found, try fallback models
                        break

        log.warning(
            "[LLM] All %d OpenRouter models exhausted after %d attempts. Checking for Google Gemini fallback...",
            len(models), total_attempts
        )
    else:
        log.info("[LLM] OPENROUTER_API_KEY not set. Checking for Google Gemini fallback...")
        last_error_msg = "OPENROUTER_API_KEY not configured"
        last_error_type = "config_needed"

    # ── Cross-Provider Fallback to Google Gemini ──────────────────────────────
    gemini_key = (
        getattr(settings, "gemini_api_key", "")
        or os.getenv("GEMINI_API_KEY", "")
        or os.getenv("GOOGLE_API_KEY", "")
    ).strip()

    if gemini_key:
        gemini_primary = (getattr(settings, "gemini_model", "gemini-3.6-flash") or "gemini-3.6-flash").strip()
        gemini_models = [gemini_primary, "gemini-flash-latest", "gemini-3.5-flash", "gemini-3.5-flash-lite"]
        seen_g = set()
        dedup_g = [m for m in gemini_models if m and not (m in seen_g or seen_g.add(m))]

        base_url = (
            getattr(settings, "gemini_base_url", "https://generativelanguage.googleapis.com/v1beta/openai/")
            or "https://generativelanguage.googleapis.com/v1beta/openai/"
        ).strip()
        payload_messages = [SystemMessage(content=system_msg)] + messages

        for g_model in dedup_g:
            log.info("[LLM] Engaging Google Gemini fallback (model='%s')", g_model)
            total_attempts += 1

            try:
                effective_timeout = max(float(request_timeout), 25.0)
                effective_tokens = max(int(max_tokens), 3000)
                gemini_llm = ChatOpenAI(
                    model=g_model,
                    openai_api_key=gemini_key,
                    openai_api_base=base_url,
                    timeout=effective_timeout,
                    max_retries=0,
                    max_tokens=effective_tokens,
                )
                response = await asyncio.wait_for(
                    gemini_llm.ainvoke(payload_messages),
                    timeout=effective_timeout,
                )
                content = str(response.content) if response and response.content is not None else ""

                if content.strip():
                    log.info("[LLM] Success served by Google Gemini fallback: '%s'", g_model)
                    return LLMResult(
                        success=True,
                        content=content,
                        model=f"gemini/{g_model}",
                        fallback_used=True,
                        attempts=total_attempts,
                    )
                else:
                    log.warning("[LLM] Google Gemini (%s) returned empty response.", g_model)
                    last_error_msg = f"{last_error_msg} | Gemini ({g_model}) returned empty content"
            except Exception as gemini_err:
                log.error("[LLM] Google Gemini (%s) failed: %s", g_model, gemini_err)
                last_error_msg = f"{last_error_msg} | Gemini ({g_model}) error: {gemini_err}"
    else:
        log.warning("[LLM] Google Gemini fallback skipped: GEMINI_API_KEY is not set in .env")

    log.error("[LLM] All LLM providers exhausted after %d attempts. Last error: %s", total_attempts, last_error_msg)
    return LLMResult(
        success=False,
        content="",
        model=primary_model,
        error=last_error_msg,
        error_type=last_error_type,
        fallback_used=True,
        attempts=total_attempts,
    )


async def get_llm_response(system_msg: str, messages: list, max_tokens: int) -> str:
    """Backward-compatible helper returning content or raising LLMInvocationError."""
    result = await get_llm_result(system_msg, messages, max_tokens)
    if result.success:
        return result.content
    raise LLMInvocationError(f"LLM invocation failed: {result.error}", result)
