"""API route modules for the chatbot backend.

This package contains modularized API routes extracted from main.py:
- general: Health check, config, and root endpoints
- sessions: Session CRUD operations
- chat: Chat endpoints and message retrieval
"""

from fastapi import APIRouter

from backend.api.chat import router as chat_router
from backend.api.general import router as general_router
from backend.api.sessions import router as sessions_router

__all__ = ["chat_router", "general_router", "sessions_router"]
