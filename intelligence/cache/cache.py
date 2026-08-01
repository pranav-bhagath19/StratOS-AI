import time
import logging
from database import client as db

log = logging.getLogger(__name__)

# Simple in-memory cache fallback if DB is unavailable
_in_memory_cache: dict[str, tuple[str, float]] = {}

async def get_cached(key: str, namespace: str) -> str | None:
    """Gets cached item from Firestore cache, falling back to memory."""
    try:
        cached = await db.aget_scraper_cache(key, namespace)
        if cached and "data" in cached:
            return cached["data"].get("content")
    except Exception as exc:
        log.warning(f"Cache: DB lookup failed: {exc}")
    
    # Memory fallback
    if key in _in_memory_cache:
        val, expiry = _in_memory_cache[key]
        if expiry > time.time():
            return val
    return None

async def set_cached(key: str, namespace: str, content: str, ttl_seconds: int = 86400) -> None:
    """Sets cached item in database and local memory."""
    try:
        await db.aset_scraper_cache(key, namespace, "cached_run", {"content": content})
    except Exception as exc:
        log.warning(f"Cache: DB write failed: {exc}")
        
    _in_memory_cache[key] = (content, time.time() + ttl_seconds)
