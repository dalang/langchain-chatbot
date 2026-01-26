"""Chat API routes - streaming, non-streaming, and message retrieval."""

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from backend.chat_service import (
    chat_generator,
    chat_stream_generator,
)
from backend.db.base import get_db
from backend.models import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/api/stream-chat")
async def stream_chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Real streaming chat endpoint using async_chat_stream."""
    return StreamingResponse(
        chat_stream_generator(
            request.sessionId,
            request.message,
            db,
            request.options.enableToolCalls,
            request.options.enableMemory,
        ),
        media_type="text/event-stream",
    )


@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Handle non-streaming chat endpoint.

    Follows the same pattern as stream_chat but returns a single
    ChatResponse instead of streaming SSE events.
    """
    return await chat_generator(
        request.sessionId,
        request.message,
        db,
        request.options.enableToolCalls,
        request.options.enableMemory,
    )
