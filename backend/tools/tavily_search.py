from backend.config import settings
from langchain_community.tools.tavily_search import TavilySearchResults

tavily_search = TavilySearchResults(
    max_results=settings.TAVILY_MAX_RESULTS,
)
