from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import AsyncGenerator
import json
import asyncio
from datetime import datetime
from pydantic import BaseModel

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.config import settings
from backend.db.base import create_db_and_tables, dispose_db, get_db
from backend.db.repositories import (
    SessionRepository,
    MessageRepository,
    ToolStepRepository,
)
from backend.db.models import Session, Message
from backend.models import (
    SessionCreate,
    SessionUpdate,
    SessionResponse,
    MessageCreate,
    MessageResponse,
)
from backend.chatbot_engine import chat_async, chat_async_stream
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


async def chat_stream_generator(session_id: str, message: str, db: AsyncSession):
    try:
        await MessageRepository.create(
            db, session_id=session_id, role="user", content=message
        )

        result = await chat_async(message)

        assistant_message = await MessageRepository.create(
            db,
            session_id=session_id,
            role="assistant",
            content=result["output"],
            model=settings.MODEL_NAME,
        )

        if result.get("intermediate_steps"):
            for i, step in enumerate(result["intermediate_steps"]):
                if len(step) >= 2:
                    action, observation = step[0], step[1]

                    tool_start = {
                        "type": "tool_start",
                        "tool": action.tool,
                        "input": action.tool_input,
                    }
                    yield f"data: {json.dumps(tool_start)}\n\n"

                    tool_step = await ToolStepRepository.create(
                        db,
                        message_id=assistant_message.id,
                        step_number=i + 1,
                        tool_name=action.tool,
                        tool_input=action.tool_input,
                    )

                    obs_str = str(observation)
                    tool_end = {
                        "type": "tool_result",
                        "result": obs_str,
                        "duration_ms": 120,
                    }
                    yield f"data: {json.dumps(tool_end)}\n\n"

                    await ToolStepRepository.complete(
                        db, tool_step_id=tool_step.id, output=obs_str, duration_ms=120
                    )

        for char in result["output"]:
            message_event = {"type": "message", "content": char}
            yield f"data: {json.dumps(message_event)}\n\n"
            await asyncio.sleep(0.01)

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        error_event = {"type": "error", "message": str(e)}
        yield f"data: {json.dumps(error_event)}\n\n"


async def chat_stream_generator_raw(session_id: str, message: str, db: AsyncSession):
    """Real streaming generator using chat_async_stream.

    Parses and formats agent execution chunks for proper display.
    """
    try:
        await MessageRepository.create(
            db, session_id=session_id, role="user", content=message
        )

        full_output = ""
        async for chunk in chat_async_stream(message):
            # chunk is an AddableDict with keys like 'actions', 'steps', 'messages', 'output'

            # Handle actions (agent starting to use a tool)
            if "actions" in chunk and chunk["actions"]:
                for action in chunk["actions"]:
                    if hasattr(action, "tool"):
                        # Extract tool name and input
                        tool_name = action.tool
                        tool_input = action.tool_input if hasattr(action, "tool_input") else {}

                        # Send tool_start event
                        tool_start = {
                            "type": "tool_start",
                            "tool": tool_name,
                            "input": tool_input,
                        }
                        yield f"data: {json.dumps(tool_start)}\n\n"

                        # Create tool step in database
                        tool_step = await ToolStepRepository.create(
                            db,
                            message_id=0,  # Will update later
                            step_number=1,
                            tool_name=tool_name,
                            tool_input=tool_input,
                        )

            # Handle steps (tool execution completed with observation)
            if "steps" in chunk and chunk["steps"]:
                for step in chunk["steps"]:
                    if hasattr(step, "observation") and hasattr(step, "action"):
                        observation = step.observation
                        action = step.action

                        # Format observation based on type
                        if isinstance(observation, list):
                            # Search results - format nicely
                            obs_str = json.dumps(observation, ensure_ascii=False)
                        else:
                            obs_str = str(observation)

                        # Send tool_result event
                        tool_end = {
                            "type": "tool_result",
                            "result": obs_str,
                            "duration_ms": 100,
                        }
                        yield f"data: {json.dumps(tool_end)}\n\n"

            # Handle messages (agent's thought process)
            if "messages" in chunk and chunk["messages"]:
                for msg in chunk["messages"]:
                    if hasattr(msg, "content"):
                        content = msg.content
                        # Parse the content for Thought/Action/Final Answer
                        if isinstance(content, str):
                            # Extract Thought
                            if "Thought:" in content:
                                thought_match = content.split("Thought:")[1].split("\n")[0].strip()
                                thought_event = {"type": "thought", "content": thought_match}
                                yield f"data: {json.dumps(thought_event)}\n\n"

                            # Extract Final Answer
                            if "Final Answer:" in content:
                                final_answer = content.split("Final Answer:")[1].strip()
                                # Stream final answer character by character
                                for char in final_answer:
                                    message_event = {"type": "message", "content": char}
                                    yield f"data: {json.dumps(message_event)}\n\n"
                                    await asyncio.sleep(0.01)

            # Handle output (final result)
            if "output" in chunk and chunk["output"]:
                full_output = chunk["output"]
                # Stream output character by character if not already streamed via messages
                if full_output:
                    for char in full_output:
                        message_event = {"type": "message", "content": char}
                        yield f"data: {json.dumps(message_event)}\n\n"
                        await asyncio.sleep(0.01)

        # Store final message in database
        if full_output:
            await MessageRepository.create(
                db,
                session_id=session_id,
                role="assistant",
                content=full_output,
                model=settings.MODEL_NAME,
            )

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_event = {"type": "error", "message": str(e)}
        yield f"data: {json.dumps(error_event)}\n\n"


@app.post("/api/stream-chat")
async def stream_chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Real streaming chat endpoint using async_chat_stream."""
    session = await SessionRepository.get_by_id(db, request.sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    return StreamingResponse(
        chat_stream_generator_raw(request.sessionId, request.message, db),
        media_type="text/event-stream",
    )


@app.post("/api/chat")
async def chat(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    session = await SessionRepository.get_by_id(db, request.sessionId)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Session not found"
        )

    return StreamingResponse(
        chat_stream_generator(request.sessionId, request.message, db),
        media_type="text/event-stream",
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
