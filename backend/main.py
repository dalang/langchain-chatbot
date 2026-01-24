import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.chat_service import (
    chat_generator,
    chat_stream_generator,
)
from backend.config import settings
from backend.chatbot_engine import tools
from backend.db.base import create_db_and_tables, dispose_db, get_db
from backend.db.repositories import MessageRepository, SessionRepository
from backend.models import (
    ChatResponse,
    MessageResponse,
    SessionCreate,
    SessionResponse,
)
from sqlalchemy.ext.asyncio import AsyncSession


class ChatRequest(BaseModel):
    sessionId: str
    message: str


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await create_db_and_tables()
    print("Database initialized successfully!")
    yield
    await dispose_db()
    print("Database connections closed!")


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "Chat Bot API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/config")
async def get_config():
    """Get public configuration information.

    This endpoint returns non-sensitive configuration settings
    that can be safely exposed to the frontend.
    """
    return {
        "modelName": settings.MODEL_NAME,
        "temperature": settings.TEMPERATURE,
        "maxIterations": settings.MAX_ITERATIONS,
        "tools": [tool.name for tool in tools],
    }


@app.post(
    "/api/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_session(
    session_data: SessionCreate, db: AsyncSession = Depends(get_db)
):
    db_session = await SessionRepository.create(
        db, user_id=session_data.user_id, title=session_data.title
    )
    return db_session


@app.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    db_session = await SessionRepository.get_by_id(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    response = SessionResponse.model_validate(db_session)
    response.message_count = len(db_session.messages)
    return response


@app.get("/api/sessions", response_model=list[SessionResponse])
async def list_sessions(
    user_id: str = "default",
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    sessions = await SessionRepository.list_by_user(db, user_id, skip, limit)

    result = []
    for s in sessions:
        response = SessionResponse.model_validate(s)
        response.message_count = len(s.messages)
        result.append(response)

    return result


@app.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    success = await SessionRepository.delete(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return None


@app.get("/api/sessions/{session_id}/messages", response_model=list[MessageResponse])
async def get_messages(
    session_id: str, skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)
):
    db_session = await SessionRepository.get_by_id(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    messages = await MessageRepository.get_by_session_id(db, session_id, skip, limit)
    return messages


@app.delete("/api/sessions/{session_id}/clear")
async def clear_session(session_id: str, db: AsyncSession = Depends(get_db)):
    db_session = await SessionRepository.get_by_id(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    deleted_count = await MessageRepository.delete_by_session_id(db, session_id)
    return {"success": True, "deleted_count": deleted_count}


@app.post("/api/stream-chat")
async def stream_chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Real streaming chat endpoint using async_chat_stream."""
    return StreamingResponse(
        chat_stream_generator(
            request.sessionId, request.message, db, request.options.enableToolCalls
        ),
        media_type="text/event-stream",
    )


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Handle non-streaming chat endpoint.

    Follows the same pattern as stream_chat but returns a single
    ChatResponse instead of streaming SSE events.
    """
    return await chat_generator(
        request.sessionId, request.message, db, request.options.enableToolCalls
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
