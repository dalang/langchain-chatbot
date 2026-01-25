from typing import List, Optional, Dict, Any
from sqlalchemy import select, update, delete, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from backend.db.models import Session, Message, ToolStep


class SessionRepository:
    @staticmethod
    async def create(
        session: AsyncSession,
        user_id: Optional[str] = None,
        title: Optional[str] = None,
    ) -> Session:
        db_session = Session(user_id=user_id, title=title)
        session.add(db_session)
        await session.flush()
        await session.refresh(db_session)
        return db_session

    @staticmethod
    async def get_by_id(session: AsyncSession, session_id: str) -> Optional[Session]:
        result = await session.execute(
            select(Session)
            .options(selectinload(Session.messages))
            .where(Session.id == session_id, Session.is_active == True)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def list_by_user(
        session: AsyncSession, user_id: str, skip: int = 0, limit: int = 100
    ) -> List[Session]:
        result = await session.execute(
            select(Session)
            .where(Session.user_id == user_id, Session.is_active == True)
            .order_by(Session.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def update_title(
        session: AsyncSession, session_id: str, title: str
    ) -> Optional[Session]:
        result = await session.execute(
            update(Session)
            .where(Session.id == session_id)
            .values(title=title)
            .returning(Session)
        )
        await session.flush()
        return result.scalar_one_or_none()

    @staticmethod
    async def delete(session: AsyncSession, session_id: str) -> bool:
        result = await session.execute(
            update(Session).where(Session.id == session_id).values(is_active=False)
        )
        await session.flush()
        return result.rowcount > 0

    @staticmethod
    async def delete_hard(session: AsyncSession, session_id: str) -> bool:
        result = await session.execute(delete(Session).where(Session.id == session_id))
        await session.flush()
        return result.rowcount > 0


class MessageRepository:
    @staticmethod
    async def create(
        session: AsyncSession,
        session_id: str,
        role: str,
        content: Optional[str] = None,
        tool_calls: Optional[Dict[str, Any]] = None,
        model: Optional[str] = None,
        tokens_used: Optional[dict[str, int]] = None,
    ) -> Message:
        message = Message(
            session_id=session_id,
            role=role,
            content=content,
            tool_calls=tool_calls,
            model=model,
            tokens_used=tokens_used,
        )
        session.add(message)
        await session.flush()
        await session.refresh(message)
        return message

    @staticmethod
    async def get_by_session_id(
        session: AsyncSession, session_id: str, skip: int = 0, limit: int = 100
    ) -> List[Message]:
        result = await session.execute(
            select(Message)
            .options(selectinload(Message.tool_steps))
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def delete_by_session_id(session: AsyncSession, session_id: str) -> int:
        result = await session.execute(
            delete(Message).where(Message.session_id == session_id)
        )
        await session.flush()
        return result.rowcount


class ToolStepRepository:
    @staticmethod
    async def create(
        session: AsyncSession,
        message_id: int,
        step_number: int,
        tool_name: str,
        tool_input: Dict[str, Any],
    ) -> ToolStep:
        tool_step = ToolStep(
            message_id=message_id,
            step_number=step_number,
            tool_name=tool_name,
            tool_input=tool_input,
            status="running",
        )
        session.add(tool_step)
        await session.flush()
        await session.refresh(tool_step)
        return tool_step

    @staticmethod
    async def complete(
        session: AsyncSession, tool_step_id: int, output: str, duration_ms: int
    ) -> Optional[ToolStep]:
        result = await session.execute(
            update(ToolStep)
            .where(ToolStep.id == tool_step_id)
            .values(
                tool_output=output,
                completed_at=datetime.utcnow(),
                duration_ms=duration_ms,
                status="completed",
            )
            .returning(ToolStep)
        )
        await session.flush()
        return result.scalar_one_or_none()

    @staticmethod
    async def fail(
        session: AsyncSession, tool_step_id: int, error: str, duration_ms: int
    ) -> Optional[ToolStep]:
        result = await session.execute(
            update(ToolStep)
            .where(ToolStep.id == tool_step_id)
            .values(
                tool_error=error,
                completed_at=datetime.utcnow(),
                duration_ms=duration_ms,
                status="failed",
            )
            .returning(ToolStep)
        )
        await session.flush()
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_message_id(
        session: AsyncSession, message_id: int
    ) -> List[ToolStep]:
        result = await session.execute(
            select(ToolStep)
            .where(ToolStep.message_id == message_id)
            .order_by(ToolStep.step_number)
        )
        return list(result.scalars().all())
