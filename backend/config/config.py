from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenRouter
    openrouter_api_key: str = ""
    openrouter_model: str = "anthropic/claude-3.5-sonnet"
    openrouter_base_url: str = "https://openrouter.ai/api/v1"

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

    # Timeouts
    search_timeout: float = 15.0
    fetch_timeout: float = 30.0
    browser_timeout: float = 35.0

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
