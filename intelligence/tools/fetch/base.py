import abc

class FetchProvider(abc.ABC):
    """Abstract Base Class for all fetching and crawling providers."""

    @abc.abstractmethod
    async def fetch(self, url: str) -> str:
        """Fetch content (raw HTML or clean Markdown/text) from the given URL."""
        pass
