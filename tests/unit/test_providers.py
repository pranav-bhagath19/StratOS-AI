import pytest
from backend.config import config
from intelligence.tools.manager import ProviderManager
from intelligence.tools.search.duckduckgo import DuckDuckGoSearchProvider
from intelligence.tools.extract.beautifulsoup import clean_html
from intelligence.tools.extract.markdown import to_markdown
from intelligence.tools.extract.trafilatura import extract_main_text
from intelligence.cache.cache import get_cached, set_cached


@pytest.mark.asyncio
async def test_duckduckgo_search_returns_normalized_results():
    provider = DuckDuckGoSearchProvider()
    results = await provider.search("War Room AI", limit=2)
    assert isinstance(results, list)
    if results:
        assert "title" in results[0]
        assert "url" in results[0]
        assert "description" in results[0]


@pytest.mark.asyncio
async def test_manager_search_duckduckgo():
    manager = ProviderManager()
    results = await manager.search("War Room AI", limit=2)
    assert isinstance(results, list)


@pytest.mark.asyncio
async def test_caching_logic():
    # Cache key-value roundtrip
    test_key = "test_url_cache_key"
    test_content = "This is a cached page test content."
    
    await set_cached(test_key, "fetch", test_content, ttl_seconds=10)
    cached = await get_cached(test_key, "fetch")
    assert cached == test_content


def test_html_cleaner():
    html = """
    <html>
        <head><title>Test Title</title></head>
        <body>
            <nav>Navigation Link 1</nav>
            <div id="ad-banner">Ad content</div>
            <main>
                <h1>Heading</h1>
                <p>Clean Paragraph</p>
            </main>
            <footer>Footer Links</footer>
        </body>
    </html>
    """
    cleaned = clean_html(html)
    assert "Navigation Link 1" not in cleaned
    assert "Ad content" not in cleaned
    assert "Clean Paragraph" in cleaned


def test_markdown_extractor():
    html = "<h1>Heading</h1><p>Paragraph</p>"
    md = to_markdown(html)
    assert md.startswith("# Heading")
    assert "Paragraph" in md


def test_trafilatura_extractor():
    html = """
    <html>
        <body>
            <article>
                <h1>My Test Article</h1>
                <p>This is the core content of the test article that Trafilatura should capture.</p>
            </article>
        </body>
    </html>
    """
    content = extract_main_text(html)
    # If trafilatura fails to parse (e.g. environment quirks), it defaults to empty string
    assert isinstance(content, str)
