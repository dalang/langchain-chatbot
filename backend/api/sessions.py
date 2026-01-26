"""Session CRUD API routes."""

from backend.db.base import get_db
from backend.db.repositories import MessageRepository, SessionRepository
from backend.models import MessageResponse, SessionCreate, SessionResponse
from backend.utils import cancel_manager
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


@router.post(
    "/api/sessions", response_model=SessionResponse, status_code=status.HTTP_201_CREATED
)
async def create_session(
    session_data: SessionCreate, db: AsyncSession = Depends(get_db)
):
    db_session = await SessionRepository.create(
        db, user_id=session_data.user_id, title=session_data.title
    )
    return db_session


@router.get("/api/sessions/{session_id}", response_model=SessionResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    db_session = await SessionRepository.get_by_id(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    response = SessionResponse.model_validate(db_session)
    response.message_count = len(db_session.messages)
    return response


@router.get("/api/sessions", response_model=list[SessionResponse])
async def list_sessions(
    user_id: str = "default",
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
):
    sessions = await SessionRepository.list_by_user(db, user_id, skip, limit)

    result = []
    for s in sessions:
        messages = await MessageRepository.get_by_session_id(db, s.id)
        response = SessionResponse.model_validate(s)
        response.message_count = len(messages)
        result.append(response)

    return result


@router.delete("/api/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(session_id: str, db: AsyncSession = Depends(get_db)):
    success = await SessionRepository.delete(db, session_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )
    return None


@router.get("/api/sessions/{session_id}/messages", response_model=list[MessageResponse])
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


@router.delete("/api/sessions/{session_id}/clear")
async def clear_session(session_id: str, db: AsyncSession = Depends(get_db)):
    db_session = await SessionRepository.get_by_id(db, session_id)
    if not db_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    deleted_count = await MessageRepository.delete_by_session_id(db, session_id)
    return {"success": True, "deleted_count": deleted_count}


@router.post("/api/sessions/{session_id}/cancel")
async def cancel_session(session_id: str):
    """Cancel an ongoing AI generation task for the specified session."""
    success = cancel_manager.stop_session(session_id)
    if success:
        return {"success": True, "message": "Session cancelled"}
    else:
        return {"success": False, "message": "Session not found or not running"}
