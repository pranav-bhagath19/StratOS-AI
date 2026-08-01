import logging
import asyncio
import json
from backend.config.config import settings

# Search Provider
from intelligence.tools.search.duckduckgo import DuckDuckGoSearchProvider
from intelligence.tools.search.base import SearchResult

# Fetch & Browser Providers
from intelligence.tools.fetch.requests import RequestsFetchProvider
from intelligence.tools.fetch.aiohttp import AioHttpFetchProvider
from intelligence.tools.browser.playwright import PlaywrightBrowserProvider

# APIs
from intelligence.tools.apis.github import fetch_github_repo
from intelligence.tools.apis.reddit import fetch_reddit_posts
from intelligence.tools.apis.rss import fetch_rss_feed

# Extractors
from intelligence.tools.extract.beautifulsoup import clean_html
from intelligence.tools.extract.trafilatura import extract_main_text
from intelligence.tools.extract.markdown import to_markdown

# Cache
from intelligence.cache.cache import get_cached, set_cached

log = logging.getLogger(__name__)


class ProviderManager:
    """Unified manager orchestrating search, fetching, browsers, extraction and APIs."""

    def __init__(self):
        # Instantiate DuckDuckGo search provider
        self.search_provider = DuckDuckGoSearchProvider()
        
        # Instantiate Brave search provider if key is set
        if settings.brave_api_key:
            from intelligence.tools.search.brave import BraveSearchProvider
            self.brave_provider = BraveSearchProvider(api_key=settings.brave_api_key)
        else:
            self.brave_provider = None
        
        # Instantiate fetch providers
        self.requests_fetcher = RequestsFetchProvider()
        self.aiohttp_fetcher = AioHttpFetchProvider()

        # Instantiate browser provider
        self.browser_provider = PlaywrightBrowserProvider()

    async def search(self, query: str, limit: int = 10, search_type: str = "web") -> list[SearchResult]:
        """Runs search using DuckDuckGo search."""
        if not settings.cache_enabled:
            return await self._run_search(query, limit, search_type)

        # Try Cache first
        cache_key = f"search:{search_type}:{query}"
        if cached := await get_cached(cache_key, "search"):
            try:
                return json.loads(cached)
            except Exception as cache_exc:
                log.exception("Failed to parse cached search results: %s", cache_exc)

        results = await self._run_search(query, limit, search_type)

        # Cache results on success
        if results:
            await set_cached(cache_key, "search", json.dumps(results), ttl_seconds=3600) # Cache search for 1 hour

        return results

    async def _run_search(self, query: str, limit: int, search_type: str) -> list[SearchResult]:
        log.info(f"Search: Querying DuckDuckGo for query: {query}")
        try:
            if search_type == "news":
                return await self.search_provider.search_news(query, limit)
            else:
                return await self.search_provider.search(query, limit)
        except Exception as ddg_exc:
            log.warning("Search: DuckDuckGo failed (after retries): %s", ddg_exc)
            
            if self.brave_provider:
                log.info("Search: Falling back to Brave Search for query: %s", query)
                try:
                    if search_type == "news":
                        results = await self.brave_provider.search_news(query, limit)
                    else:
                        results = await self.brave_provider.search(query, limit)
                    
                    if results:
                        log.info("Search: Brave Search succeeded for query: %s", query)
                        return results
                    else:
                        log.error("Search: Brave Search returned empty results for query: %s", query)
                except Exception as brave_exc:
                    log.exception("Search: Brave Search fallback failed: %s", brave_exc)
            else:
                log.warning("Search: No Brave Search API key configured. Cannot fall back.")
        
        log.error("Search: Both search providers failed or returned empty results for query: '%s'. This will degrade brief quality.", query)
        return []

    async def fetch_page(self, url: str, force_browser: bool = False) -> tuple[str, str, str]:
        """Fetches page content dynamically trying: Cache -> API -> Requests/AioHttp -> Playwright."""
        url = url.strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            if "." in url and " " not in url:
                url = f"https://{url}"
            else:
                log.info("Fetch: Target '%s' is a text query rather than a URL. Redirecting to search.", url)
                results = await self.search(url, limit=10)
                if results:
                    fmt_results = "\n\n".join(f"### {r['title']}\nURL: {r['url']}\n{r['snippet']}" for r in results)
                    return fmt_results, "serp_api", "ok"
                return f"[No results found for query: {url}]", "serp_api", "empty"

        # 1. Try Cache
        if settings.cache_enabled:
            if cached := await get_cached(url, "fetch"):
                return cached, "cache", "ok"

        # 2. Try Official APIs first
        if "github.com" in url:
            if repo_data := await fetch_github_repo(url):
                content = f"GitHub Repo Details:\n{repo_data}"
                if settings.cache_enabled:
                    await set_cached(url, "fetch", content)
                return content, "mcp_server", "ok" # telemetrize under mcp_server for API
        elif "reddit.com" in url:
            if reddit_posts := await fetch_reddit_posts(url):
                content = f"Reddit Posts:\n{reddit_posts}"
                if settings.cache_enabled:
                    await set_cached(url, "fetch", content)
                return content, "mcp_server", "ok"
        elif "rss" in url or "xml" in url or url.endswith(".xml"):
            if rss_items := await fetch_rss_feed(url):
                content = f"RSS Feed Items:\n{rss_items}"
                if settings.cache_enabled:
                    await set_cached(url, "fetch", content)
                return content, "mcp_server", "ok"

        # 3. Fetch HTML content
        content_html = ""
        fetch_method = "web_unlocker" # default requests/aiohttp telemetry mapping

        # Determine browser/forced browser strategy
        use_browser = force_browser or any(k in url for k in ["linkedin.com", "crunchbase.com", "twitter.com", "facebook.com"])

        if use_browser:
            log.info(f"Fetch: Launching local Playwright browser for JS-heavy target: {url}")
            fetch_method = "scraping_browser" # map to scraping_browser telemetry
            try:
                content_html = await self.browser_provider.fetch_rendered(url)
            except Exception as browser_exc:
                log.warning(f"Fetch: Playwright browser failed: {browser_exc}. Falling back to aiohttp.")
                try:
                    content_html = await self.aiohttp_fetcher.fetch(url)
                    fetch_method = "web_unlocker"
                except Exception as aio_exc:
                    log.exception("Fetch: aiohttp fallback failed after Playwright failed: %s", aio_exc)
                    content_html = await self.requests_fetcher.fetch(url)
        else:
            log.info(f"Fetch: Trying async HTTP fetch (aiohttp) for target: {url}")
            try:
                content_html = await self.aiohttp_fetcher.fetch(url)
            except Exception as fetch_exc:
                log.warning(f"Fetch: aiohttp failed: {fetch_exc}. Trying standard requests.")
                try:
                    content_html = await self.requests_fetcher.fetch(url)
                except Exception as req_exc:
                    log.warning(f"Fetch: Requests failed: {req_exc}. Falling back to Playwright.")
                    fetch_method = "scraping_browser"
                    try:
                        content_html = await self.browser_provider.fetch_rendered(url)
                    except Exception as play_exc:
                        log.exception("Fetch: Playwright fallback failed: %s", play_exc)
                        raise RuntimeError(f"All fetch providers failed for {url}") from play_exc

        # 4. Extract readable content and convert to Markdown
        clean_md = ""
        if content_html:
            # Clean HTML structure first
            cleaned_html_str = clean_html(content_html)
            # Attempt core content extraction using trafilatura
            extracted_text = extract_main_text(cleaned_html_str)
            if extracted_text:
                clean_md = extracted_text
            else:
                # Fallback to general markdownify conversion
                clean_md = to_markdown(cleaned_html_str)

        # Cache on success
        if clean_md and settings.cache_enabled:
            await set_cached(url, "fetch", clean_md)

        return clean_md, fetch_method, "ok"


# Global shared instance
provider_manager = ProviderManager()
