import abc

class BrowserProvider(abc.ABC):
    """Abstract Base Class for browser rendering providers."""

    @abc.abstractmethod
    async def fetch_rendered(self, url: str) -> str:
        """Fetch client-rendered HTML from the specified URL using a browser."""
        pass
