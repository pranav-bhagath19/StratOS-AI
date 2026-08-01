import abc
from typing import TypedDict

class SearchResult(TypedDict):
    title: str
    url: str
    description: str


class SearchProvider(abc.ABC):
    """Abstract Base Class for all search and discovery providers."""

    @abc.abstractmethod
    async def search(self, query: str, limit: int = 10) -> list[SearchResult]:
        """Perform a standard web search and return normalized results."""
        pass

    @abc.abstractmethod
    async def search_news(self, query: str, limit: int = 10) -> list[SearchResult]:
        """Perform a web news search and return normalized results."""
        pass
