import logging
import asyncio
import requests
from intelligence.tools.fetch.base import FetchProvider
from backend.config.config import settings

log = logging.getLogger(__name__)

class RequestsFetchProvider(FetchProvider):
    """Lite HTTP client fetch provider using standard requests library."""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }

    def _fetch_blocking(self, url: str) -> str:
        resp = requests.get(url, headers=self.headers, timeout=settings.fetch_timeout)
        resp.raise_for_status()
        return resp.text

    async def fetch(self, url: str) -> str:
        try:
            return await asyncio.to_thread(self._fetch_blocking, url)
        except Exception as exc:
            log.warning(f"RequestsFetchProvider: failed to fetch {url}: {exc}")
            raise RuntimeError(f"Standard requests fetch failed: {exc}")
