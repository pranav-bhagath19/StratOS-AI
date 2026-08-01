import asyncio
import logging
from intelligence.tools.browser.base import BrowserProvider
from backend.config.config import settings

log = logging.getLogger(__name__)

class PlaywrightBrowserProvider(BrowserProvider):
    """Local Headless Chromium Playwright browser provider."""

    def _fetch_blocking(self, url: str, timeout_ms: int) -> str:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            try:
                page = browser.new_page()
                page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
                content = page.content()
                return content
            finally:
                browser.close()

    async def fetch_rendered(self, url: str) -> str:
        if not settings.playwright_enabled:
            raise RuntimeError("Playwright provider is disabled in settings.")

        timeout_ms = int(settings.browser_timeout * 1000)
        try:
            return await asyncio.to_thread(self._fetch_blocking, url, timeout_ms)
        except Exception as exc:
            log.warning(f"PlaywrightBrowserProvider: failed to fetch {url}: {exc}")
            raise RuntimeError(f"Playwright rendering failed: {exc}")
