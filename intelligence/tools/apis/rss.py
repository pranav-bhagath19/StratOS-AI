import httpx
import logging
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

async def fetch_rss_feed(url: str, limit: int = 5) -> list[dict] | None:
    """Fetches and parses a standard RSS XML feed."""
    if not ("rss" in url or "feed" in url or "xml" in url or url.endswith(".xml")):
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(url, headers={"User-Agent": "StratOS-AI"})
            if resp.status_code != 200:
                return None
            
            soup = BeautifulSoup(resp.text, "xml")
            items = []
            for entry in soup.find_all("item")[:limit]:
                items.append({
                    "title": entry.title.text.strip() if entry.title else "",
                    "link": entry.link.text.strip() if entry.link else "",
                    "description": entry.description.text.strip() if entry.description else "",
                    "pubDate": entry.pubDate.text.strip() if entry.pubDate else ""
                })
            return items if items else None
    except Exception as exc:
        log.warning(f"RSS Feed fetch failed for {url}: {exc}")
    return None
