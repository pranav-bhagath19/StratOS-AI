import logging
import trafilatura

log = logging.getLogger(__name__)

def extract_main_text(html: str) -> str:
    """Extracts core article content/main text from raw HTML using trafilatura."""
    if not html:
        return ""
    try:
        content = trafilatura.extract(html, output_format="markdown", include_links=True)
        if content:
            return content
    except Exception as exc:
        log.warning(f"Trafilatura extraction failed: {exc}")
    
    return ""
