import httpx
import logging
import re

log = logging.getLogger(__name__)

async def fetch_github_repo(url: str) -> dict | None:
    """Fetches details from the official GitHub REST API if URL matches."""
    match = re.search(r"github\.com/([\w\-]+)/([\w\-]+)", url)
    if not match:
        return None

    owner, repo = match.groups()
    api_url = f"https://api.github.com/repos/{owner}/{repo}"
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(api_url, headers={"User-Agent": "StratOS-AI"})
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "name": data.get("full_name"),
                    "description": data.get("description"),
                    "stars": data.get("stargazers_count"),
                    "forks": data.get("forks_count"),
                    "open_issues": data.get("open_issues_count"),
                    "language": data.get("language"),
                    "homepage": data.get("homepage")
                }
    except Exception as exc:
        log.warning(f"GitHub API fetch failed for {url}: {exc}")
    return None
