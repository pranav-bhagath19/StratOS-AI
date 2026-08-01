import logging
import httpx
from intelligence.tools.search.base import SearchProvider, SearchResult

log = logging.getLogger(__name__)


class BraveSearchProvider(SearchProvider):
    """Brave Search API provider."""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.headers = {
            "Accept": "application/json",
            "X-Subscription-Token": api_key,
            "User-Agent": "StratOS-AI"
        }

    async def search(self, query: str, limit: int = 10) -> list[SearchResult]:
        url = "https://api.search.brave.com/res/v1/web/search"
        params = {"q": query, "count": limit}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self.headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for r in data.get("web", {}).get("results", []):
                        results.append({
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                            "description": r.get("description", "")
                        })
                    return results
                else:
                    log.error("BraveSearchProvider: search failed with status %s: %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            log.exception("BraveSearchProvider: search request failed for query '%s'", query)
        return []

    async def search_news(self, query: str, limit: int = 10) -> list[SearchResult]:
        url = "https://api.search.brave.com/res/v1/news/search"
        params = {"q": query, "count": limit}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.get(url, headers=self.headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    results = []
                    for r in data.get("news", {}).get("results", []):
                        results.append({
                            "title": r.get("title", ""),
                            "url": r.get("url", ""),
                            "description": r.get("description", "")
                        })
                    return results
                else:
                    log.error("BraveSearchProvider: news search failed with status %s: %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            log.exception("BraveSearchProvider: news search request failed for query '%s'", query)
        return []
