from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import asyncio
import json
from collections.abc import AsyncGenerator

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.chatbot_engine import chat_async, chat_async_stream
from backend.config import settings
from backend.db.repositories import (
    MessageRepository,
    SessionRepository,
    ToolStepRepository,
)
from backend.models import ChatResponse, MessageResponse, ToolStepResponse

__all__ = [
    "chat_stream_generator",
    "chat_generator",
]


async def chat_stream_generator(
    session_id: str,
    message: str,
    db: AsyncSession,
    enable_tools: bool = True,
) -> AsyncGenerator[str, None]:
    """Stream chat responses while emitting structured SSE events."""
    try:
        await MessageRepository.create(
            db,
            session_id=session_id,
            role="user",
            content=message,
        )

        full_output = ""
        async for chunk in chat_async_stream(message, enable_tools=enable_tools):
            if not isinstance(chunk, dict):
                continue

            for action in chunk.get("actions", []) or []:
                tool_name = getattr(action, "tool", None)
                if not tool_name:
                    continue

                tool_input = getattr(action, "tool_input", {})
                tool_input_normalized = (
                    tool_input
                    if isinstance(tool_input, dict)
                    else {"input": tool_input}
                )
                yield _format_event(
                    {
                        "type": "tool_start",
                        "tool": tool_name,
                        "input": tool_input_normalized,
                    }
                )

                await ToolStepRepository.create(
                    db,
                    message_id=0,
                    step_number=1,
                    tool_name=tool_name,
                    tool_input=tool_input_normalized,
                )

            for step in chunk.get("steps", []) or []:
                observation = getattr(step, "observation", None)
                if observation is None:
                    continue

                obs_str = (
                    json.dumps(observation, ensure_ascii=False)
                    if isinstance(observation, list)
                    else str(observation)
                )
                yield _format_event(
                    {
                        "type": "tool_result",
                        "result": obs_str,
                        "duration_ms": 100,
                    }
                )

            for msg in chunk.get("messages", []) or []:
                content = getattr(msg, "content", None)
                if not isinstance(content, str):
                    continue

                if "Thought:" in content:
                    thought = content.split("Thought:", 1)[1].split("\n", 1)[0].strip()
                    if thought:
                        yield _format_event({"type": "thought", "content": thought})

            output = chunk.get("output")
            if output:
                # 如果 output 是 AIMessage 对象，提取其 content
                if hasattr(output, "content"):
                    full_output = output.content
                else:
                    full_output = output
                async for event in _stream_text(full_output):
                    yield event

        if full_output:
            await MessageRepository.create(
                db,
                session_id=session_id,
                role="assistant",
                content=full_output,
                model=settings.MODEL_NAME,
            )

        yield _format_event({"type": "done"})

    except Exception as exc:
        error_event = {"type": "error", "message": str(exc)}
        yield _format_event(error_event)


async def chat_generator(
    session_id: str,
    message: str,
    db: AsyncSession,
    enable_tools: bool = True,
) -> ChatResponse:
    """Generate chat response for non-streaming endpoint.

    Follows the same pattern as chat_stream_generator but returns
    a single ChatResponse instead of streaming SSE events.
    """
    session = await SessionRepository.get_by_id(db, session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    await MessageRepository.create(
        db,
        session_id=session_id,
        role="user",
        content=message,
    )

    result = await chat_async(message, enable_tools=enable_tools)

    # 如果 result["output"] 是 AIMessage 对象，提取其 content
    output = result["output"]
    if hasattr(output, "content"):
        output = output.content

    assistant_message = await MessageRepository.create(
        db,
        session_id=session_id,
        role="assistant",
        content=output,
        model=settings.MODEL_NAME,
    )

    if result.get("intermediate_steps"):
        for i, step in enumerate(result["intermediate_steps"]):
            if len(step) >= 2:
                action, observation = step[0], step[1]

                tool_input = (
                    action.tool_input
                    if isinstance(action.tool_input, dict)
                    else {"input": action.tool_input}
                )

                tool_step = await ToolStepRepository.create(
                    db,
                    message_id=assistant_message.id,
                    step_number=i + 1,
                    tool_name=action.tool,
                    tool_input=tool_input,
                )

                obs_str = str(observation)
                await ToolStepRepository.complete(
                    db, tool_step_id=tool_step.id, output=obs_str, duration_ms=120
                )

    tool_steps = []
    for tool_step in await ToolStepRepository.get_by_message_id(
        db, assistant_message.id
    ):
        tool_steps.append(
            ToolStepResponse(
                id=tool_step.id,
                message_id=tool_step.message_id,
                step_number=tool_step.step_number,
                tool_name=tool_step.tool_name,
                tool_input=tool_step.tool_input,
                tool_output=tool_step.tool_output,
                tool_error=tool_step.tool_error,
                started_at=tool_step.started_at,
                completed_at=tool_step.completed_at,
                duration_ms=tool_step.duration_ms,
                status=tool_step.status,
            )
        )

    message_response = MessageResponse(
        id=assistant_message.id,
        session_id=assistant_message.session_id,
        role=assistant_message.role,
        content=assistant_message.content,
        tool_calls=assistant_message.tool_calls,
        created_at=assistant_message.created_at,
        model=assistant_message.model,
        tokens_used=assistant_message.tokens_used,
        tool_steps=[],
    )

    return ChatResponse(
        output=output,  # 使用已经提取的字符串版本
        intermediate_steps=[],
        tool_steps=tool_steps,
        message=message_response,
    )


async def _stream_text(text: str) -> AsyncGenerator[str, None]:
    for char in text:
        yield _format_event({"type": "message", "content": char})
        await asyncio.sleep(0.01)


def _format_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
