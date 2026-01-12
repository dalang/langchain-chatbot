from langchain_community.tools.tavily_search import TavilySearchResults

from backend.config import settings


tavily_search = TavilySearchResults(
    max_results=settings.TAVILY_MAX_RESULTS,
    tavily_api_key=settings.TAVILY_API_KEY,
)

tools_list = [tavily_search]
