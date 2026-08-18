"""Resilient LLM invocation layer for OpenRouter free-tier models with fallback."""

import asyncio
import logging
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
import openai
from backend.config.config import settings

log = logging.getLogger(__name__)


async def get_llm_response(system_msg: str, messages: list, max_tokens: int) -> str:
    """
    Invokes the LLM using models in openrouter_free_models.
    
    If a rate limit error (HTTP 429) occurs, falls back to the next model immediately.
    Auth and bad request errors fail fast and are raised immediately.
    """
    models = settings.openrouter_free_models
    if not models:
        raise ValueError("openrouter_free_models list in settings is empty.")

    last_exception = None

    for model in models:
        # Add a ~300ms delay between calls to stay under 20 requests/minute
        await asyncio.sleep(0.3)
        
        try:
            log.info(f"Attempting LLM call using model: {model}")
            
            # Construct a clean list of messages starting with the system message
            payload_messages = [SystemMessage(content=system_msg)] + messages
            
            llm = ChatOpenAI(
                model=model,
                openai_api_key=settings.openrouter_api_key,
                openai_api_base=settings.openrouter_base_url,
                request_timeout=45,
                max_retries=1,
                max_tokens=max_tokens,
            )
            
            response = await llm.ainvoke(payload_messages)
            content = str(response.content) if response and response.content is not None else ""
            if not content.strip():
                log.warning(f"Model {model} returned an empty response. Falling back to next model.")
                last_exception = ValueError(f"Model {model} returned empty response.")
                continue

            # Log which model successfully served the call
            log.info(f"LLM call successfully served by model: {model}")
            return content
            
        except Exception as e:
            # Detect rate-limit/429 type error
            is_rate_limit = False
            
            # 1. Instance of openai.RateLimitError
            if isinstance(e, openai.RateLimitError):
                is_rate_limit = True
            # 2. HTTP Status Code 429 checking
            elif getattr(e, "status_code", None) == 429:
                is_rate_limit = True
            elif hasattr(e, "body") and isinstance(e.body, dict) and e.body.get("status") == 429:
                is_rate_limit = True
            elif getattr(getattr(e, "response", None), "status_code", None) == 429:
                is_rate_limit = True
            # 3. String representation checking
            elif "429" in str(e) or "rate limit" in str(e).lower() or "rate_limit" in str(e).lower():
                is_rate_limit = True
                
            if is_rate_limit:
                log.warning(f"Model {model} hit rate limit (429). Falling back to next model. Error: {e}")
                last_exception = e
                continue
            else:
                log.error(f"Fail-fast error encountered with model {model}: {e}")
                raise

    if last_exception:
        log.error("All configured openrouter_free_models returned 429 / rate limit errors.")
        raise last_exception
    else:
        raise RuntimeError("No models were executed successfully due to errors.")

