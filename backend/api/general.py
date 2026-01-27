"""General API routes - health check, config, and root endpoints."""

from typing import Optional

from fastapi import APIRouter, Header

from backend.agent import ToolRegistry
from backend.config import settings
from backend.db.base import async_session_maker
from backend.db.repositories import SessionRepository

router = APIRouter()


@router.get("/")
async def root():
    return {"message": "Chat Bot API", "version": "1.0.0"}


@router.get("/health")
async def health_check():
    return {"status": "healthy"}


@router.get("/api/config")
async def get_config(session_id: Optional[str] = Header(None, alias="X-Session-ID")):
    """Get public configuration information.

    This endpoint returns non-sensitive configuration settings
    that can be safely exposed to frontend.

    Optionally accepts a session_id parameter to include session metadata.
    """
    tools = ToolRegistry.get_tools()
    config = {
        "modelName": settings.MODEL_NAME,
        "temperature": settings.TEMPERATURE,
        "maxIterations": settings.MAX_ITERATIONS,
        "tools": [tool.name for tool in tools],
    }

    if session_id:
        async with async_session_maker() as db:
            session = await SessionRepository.get_by_id(db, session_id)
            if session:
                config["session"] = {
                    "id": session.id,
                    "user_id": session.user_id,
                    "title": session.title,
                    "created_at": session.created_at.isoformat()
                    if session.created_at
                    else None,
                }

    return config
