from markdownify import markdownify as md_convert

def to_markdown(html: str) -> str:
    """Converts HTML to clean, readable Markdown suitable for LLMs."""
    if not html:
        return ""
    
    # Strip script/style tags if bs4 cleaning was bypassed
    md = md_convert(html, heading_style="ATX", strip=["script", "style"])
    # Remove empty lines and normalize whitespace
    cleaned_lines = [line.strip() for line in md.splitlines() if line.strip()]
    return "\n".join(cleaned_lines)
