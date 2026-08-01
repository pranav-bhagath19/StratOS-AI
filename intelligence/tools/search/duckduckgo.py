import logging
import asyncio
from duckduckgo_search import DDGS
from intelligence.tools.search.base import SearchProvider, SearchResult

log = logging.getLogger(__name__)

class DuckDuckGoSearchProvider(SearchProvider):
    """DuckDuckGo Search provider using the duckduckgo-search library."""

    def _search_blocking(self, query: str, limit: int) -> list[SearchResult]:
        try:
            with DDGS() as ddgs:
                results = []
                for r in ddgs.text(query, max_results=limit):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("href", ""),
                        "description": r.get("body", "")
                    })
                return results
        except Exception as exc:
            log.warning(f"DuckDuckGoSearchProvider: search error: {exc}")
            return []

    def _search_news_blocking(self, query: str, limit: int) -> list[SearchResult]:
        try:
            with DDGS() as ddgs:
                results = []
                for r in ddgs.news(query, max_results=limit):
                    results.append({
                        "title": r.get("title", ""),
                        "url": r.get("url", ""),
                        "description": r.get("body", "")
                    })
                return results
        except Exception as exc:
            log.warning(f"DuckDuckGoSearchProvider: news search error: {exc}")
            return []

    async def search(self, query: str, limit: int = 10) -> list[SearchResult]:
        return await asyncio.to_thread(self._search_blocking, query, limit)

    async def search_news(self, query: str, limit: int = 10) -> list[SearchResult]:
        return await asyncio.to_thread(self._search_news_blocking, query, limit)
