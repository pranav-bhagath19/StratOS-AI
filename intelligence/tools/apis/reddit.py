import httpx
import logging
import re

log = logging.getLogger(__name__)

async def fetch_reddit_posts(url: str, limit: int = 5) -> list[dict] | None:
    """Fetches posts from a subreddit using the public .json endpoint wrapper."""
    match = re.search(r"reddit\.com/r/([\w\-]+)", url)
    if not match:
        return None

    subreddit = match.group(1)
    api_url = f"https://www.reddit.com/r/{subreddit}/new.json?limit={limit}"
    headers = {"User-Agent": "Mozilla/5.0 StratOS-AI/0.1"}

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(api_url, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                posts = []
                for child in data.get("data", {}).get("children", []):
                    post_data = child.get("data", {})
                    posts.append({
                        "title": post_data.get("title"),
                        "author": post_data.get("author"),
                        "score": post_data.get("score"),
                        "url": post_data.get("url"),
                        "selftext": post_data.get("selftext", "")[:300]
                    })
                return posts
    except Exception as exc:
        log.warning(f"Reddit API fetch failed for subreddit {subreddit}: {exc}")
    return None
