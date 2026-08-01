from bs4 import BeautifulSoup
import re

def clean_html(html: str) -> str:
    """Strips boilerplate, navigation, styling, and advertisements from HTML using BeautifulSoup."""
    if not html:
        return ""

    soup = BeautifulSoup(html, "html.parser")

    # Remove script, style, link, meta, noscript, iframe, svg
    for element in soup(["script", "style", "link", "meta", "noscript", "iframe", "svg"]):
        element.decompose()

    # Remove typical boilerplate elements by tag
    for tag in ["nav", "footer", "header", "aside"]:
        for element in soup.find_all(tag):
            element.decompose()

    # Remove elements by class or id names matching common boilerplate patterns
    boilerplate_patterns = re.compile(
        r"cookie|banner|promo|ad-|advertisement|menu|nav|footer|sidebar|header|social|share|widget",
        re.IGNORECASE
    )
    for element in soup.find_all(attrs={"class": boilerplate_patterns}):
        element.decompose()
    for element in soup.find_all(attrs={"id": boilerplate_patterns}):
        element.decompose()

    return str(soup)
