"""General API routes - health check, config, and root endpoints."""

from fastapi import APIRouter

from backend.config import settings
from backend.agent import ToolRegistry

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Chat Bot API", "version": "1.0.0"}


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/api/config")
async def get_config():
    """Get public configuration information.

    This endpoint returns non-sensitive configuration settings
    that can be safely exposed to the frontend.
    """
    tools = ToolRegistry.get_tools()
    return {
        "modelName": settings.MODEL_NAME,
        "temperature": settings.TEMPERATURE,
        "maxIterations": settings.MAX_ITERATIONS,
        "tools": [tool.name for tool in tools],
    }
