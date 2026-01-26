from __future__ import annotations

import asyncio
import json
from typing import AsyncGenerator, List, Optional

from backend.agent.callback_handler import get_last_token_usage
from backend.agent.engine import chat_async, chat_async_stream
from backend.config import settings
from backend.db.repositories import (
    MessageRepository,
    SessionRepository,
    ToolStepRepository,
)
from backend.models import (
    ChatResponse,
    MessageResponse,
    ToolStepResponse,
)
from backend.utils import MessageConverter, cancel_manager
from fastapi import HTTPException, status
from langchain_core.messages import BaseMessage
from sqlalchemy.ext.asyncio import AsyncSession

__all__ = [
    "chat_stream_generator",
    "chat_generator",
]


class MemoryManager:
    """Manages conversation memory by loading history from database.

    This manager loads conversation history and converts database messages
    to LangChain Message objects for use in prompts.
    """

    @staticmethod
    def load_history(messages: List) -> List[BaseMessage]:
        """Convert database messages to LangChain Message objects.

        Args:
            messages: List of database Message objects

        Returns:
            List of LangChain BaseMessage objects (HumanMessage, AIMessage)
        """
        return MessageConverter.to_langchain_messages(messages)


async def chat_stream_generator(
    session_id: str,
    message: str,
    db: AsyncSession,
    enable_tools: bool = True,
    enable_memory: bool = False,
) -> AsyncGenerator[str, None]:
    """Stream chat responses while emitting structured SSE events."""
    stop_event = cancel_manager.get_stop_event(session_id)

    try:
        await MessageRepository.create(
            db,
            session_id=session_id,
            role="user",
            content=message,
        )

        # Load conversation history if memory is enabled
        chat_history = None
        if enable_memory:
            messages = await MessageRepository.get_by_session_id(
                db, session_id, skip=0, limit=100
            )
            # Exclude the message we just created
            if messages and messages[-1].content == message:
                messages = messages[:-1]
            chat_history = MemoryManager.load_history(messages)

        full_output = ""
        async for chunk in chat_async_stream(
            message,
            enable_tools=enable_tools,
            enable_memory=enable_memory,
            chat_history=chat_history,
        ):
            if stop_event.is_set():
                yield _format_event(
                    {"type": "cancelled", "message": "Generation cancelled by user"}
                )
                break

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

            tokens_used: Optional[dict[str, int]] = None
        if full_output:
            token_usage_data = get_last_token_usage()
            if token_usage_data:
                tokens_used = {
                    "prompt_tokens": token_usage_data.get("prompt_tokens", 0),
                    "completion_tokens": token_usage_data.get("completion_tokens", 0),
                    "total_tokens": token_usage_data.get("total_tokens", 0),
                }

            await MessageRepository.create(
                db,
                session_id=session_id,
                role="assistant",
                content=full_output,
                model=settings.MODEL_NAME,
                tokens_used=tokens_used,
            )

        yield _format_event({"type": "done", "tokens_used": tokens_used})

    except Exception as exc:
        error_event = {"type": "error", "message": str(exc)}
        yield _format_event(error_event)
    finally:
        cancel_manager.cleanup(session_id)


async def chat_generator(
    session_id: str,
    message: str,
    db: AsyncSession,
    enable_tools: bool = True,
    enable_memory: bool = False,
) -> ChatResponse:
    """Generate chat response for non-streaming endpoint.

    Follows the same pattern as chat_stream_generator but returns
    a single ChatResponse instead of streaming SSE events.
    """
    stop_event = cancel_manager.get_stop_event(session_id)

    try:
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

        # Load conversation history if memory is enabled
        chat_history = None
        if enable_memory:
            messages = await MessageRepository.get_by_session_id(
                db, session_id, skip=0, limit=100
            )
            # Exclude the message we just created
            if messages and messages[-1].content == message:
                messages = messages[:-1]
            chat_history = MemoryManager.load_history(messages)

        result = await chat_async(
            message,
            enable_tools=enable_tools,
            enable_memory=enable_memory,
            chat_history=chat_history,
            stop_event=stop_event,
        )

        # 如果 result["output"] 是 AIMessage 对象，提取其 content
        output = result["output"]
        if hasattr(output, "content"):
            output = output.content

        token_usage_data = get_last_token_usage()
        tokens_used: Optional[dict[str, int]] = None
        if token_usage_data:
            tokens_used = {
                "prompt_tokens": token_usage_data.get("prompt_tokens", 0),
                "completion_tokens": token_usage_data.get("completion_tokens", 0),
                "total_tokens": token_usage_data.get("total_tokens", 0),
            }
        else:
            if hasattr(result["output"], "response_metadata"):
                metadata = result["output"].response_metadata
                if "token_usage" in metadata:
                    token_usage_metadata = metadata["token_usage"]
                    tokens_used = {
                        "prompt_tokens": token_usage_metadata.get("prompt_tokens", 0),
                        "completion_tokens": token_usage_metadata.get(
                            "completion_tokens", 0
                        ),
                        "total_tokens": token_usage_metadata.get("total_tokens", 0),
                    }

        assistant_message = await MessageRepository.create(
            db,
            session_id=session_id,
            role="assistant",
            content=output,
            model=settings.MODEL_NAME,
            tokens_used=tokens_used,
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
            output=output,
            intermediate_steps=[],
            tool_steps=tool_steps,
            message=message_response,
        )
    except asyncio.CancelledError:
        raise HTTPException(
            status_code=499,
            detail="Request cancelled by user",
        )
    finally:
        cancel_manager.cleanup(session_id)


async def _stream_text(text: str) -> AsyncGenerator[str, None]:
    for char in text:
        yield _format_event({"type": "message", "content": char})
        await asyncio.sleep(0.01)


def _format_event(payload: dict) -> str:
    return f"data: {json.dumps(payload, ensure_ascii=False)}\n\n"
