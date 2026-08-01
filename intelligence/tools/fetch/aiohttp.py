import logging
import aiohttp
from intelligence.tools.fetch.base import FetchProvider
from backend.config.config import settings

log = logging.getLogger(__name__)

class AioHttpFetchProvider(FetchProvider):
    """Asynchronous HTTP fetch provider using aiohttp library."""

    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5"
        }

    async def fetch(self, url: str) -> str:
        try:
            timeout = aiohttp.ClientTimeout(total=settings.fetch_timeout)
            async with aiohttp.ClientSession(headers=self.headers, timeout=timeout) as session:
                async with session.get(url, allow_redirects=True) as resp:
                    resp.raise_for_status()
                    return await resp.text()
        except Exception as exc:
            log.warning(f"AioHttpFetchProvider: failed to fetch {url}: {exc}")
            raise RuntimeError(f"AioHttp fetch failed: {exc}")
