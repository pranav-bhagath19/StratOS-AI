from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to this file's location (repo_root/.env), not the
# process's current working directory — env_file=".env" alone silently
# resolves to nothing (no error) if uvicorn is launched from a different
# directory, leaving every credential as an empty string.
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent
_ENV_FILE = _REPO_ROOT / ".env"


class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-sonnet"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    # Free-tier fallback model rotation (verified live 2026-08-01 via /api/v1/models).
    # Tried in order; on 429 the next model is used immediately.
    openrouter_free_models: list[str] = [
        "google/gemma-4-31b-it:free",
        "poolside/laguna-s-2.1:free",
        "nvidia/nemotron-3-super-120b-a12b:free",
        "nvidia/nemotron-nano-9b-v2:free",
    ]

    # Provider Selection
    search_provider: str = "duckduckgo"

    # Toggles
    playwright_enabled: bool = True
    cache_enabled: bool = True

    # Database
    database_url: str = ""

    # Firebase Service Account Credentials
    firebase_project_id: str = ""
    firebase_private_key_id: str = ""
    firebase_private_key: str = ""
    firebase_client_email: str = ""
    firebase_client_id: str = ""
    firebase_client_cert_url: str = ""
    firebase_api_key: str = ""
    firebase_auth_domain: str = ""
    firebase_storage_bucket: str = ""
    firebase_app_id: str = ""
    brave_api_key: str = ""


    # Timeouts
    search_timeout: float = 15.0
    fetch_timeout: float = 30.0
    browser_timeout: float = 35.0

    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")


settings = Settings()

import logging as _logging
_log = _logging.getLogger(__name__)
if not settings.openrouter_api_key:
    _log.warning(
        "Settings: OPENROUTER_API_KEY is not set (looked for %s). "
        "LLM calls in every agent will fail with 'Missing credentials' until this is set.",
        _ENV_FILE,
    )

