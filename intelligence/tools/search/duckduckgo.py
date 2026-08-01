import logging
import asyncio
from ddgs import DDGS
from ddgs.exceptions import RatelimitException, TimeoutException
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from intelligence.tools.search.base import SearchProvider, SearchResult

log = logging.getLogger(__name__)

# Retry policy: up to 3 attempts, exponential backoff starting at 2s up to 6s
ddg_retry_policy = retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=6),
    retry=retry_if_exception_type((RatelimitException, TimeoutException))
)


class DuckDuckGoSearchProvider(SearchProvider):
    """DuckDuckGo Search provider using the ddgs library with tenacity retry."""

    @ddg_retry_policy
    def _search_text_with_retry(self, query: str, limit: int):
        with DDGS() as ddgs:
            return list(ddgs.text(query, max_results=limit))

    @ddg_retry_policy
    def _search_news_with_retry(self, query: str, limit: int):
        with DDGS() as ddgs:
            return list(ddgs.news(query, max_results=limit))

    def _search_blocking(self, query: str, limit: int) -> list[SearchResult]:
        results = []
        raw_results = self._search_text_with_retry(query, limit)
        for r in raw_results:
            results.append({
                "title": r.get("title", ""),
                "url": r.get("href", ""),
                "description": r.get("body", "")
            })
        return results

    def _search_news_blocking(self, query: str, limit: int) -> list[SearchResult]:
        results = []
        raw_results = self._search_news_with_retry(query, limit)
        for r in raw_results:
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "description": r.get("body", "")
            })
        return results

    async def search(self, query: str, limit: int = 10) -> list[SearchResult]:
        # Propagate exceptions to ProviderManager for fallback handling
        return await asyncio.to_thread(self._search_blocking, query, limit)

    async def search_news(self, query: str, limit: int = 10) -> list[SearchResult]:
        return await asyncio.to_thread(self._search_news_blocking, query, limit)
