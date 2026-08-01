import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app


@pytest.mark.asyncio
async def test_health_returns_ok():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "stratos-ai-api"


@pytest.mark.asyncio
async def test_hello_without_token_returns_config_needed(monkeypatch):
    import backend.config.config as cfg
    monkeypatch.setattr(cfg.settings, "openrouter_api_key", "")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/analyses/hello")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "config_needed"
