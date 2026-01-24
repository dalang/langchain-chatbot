from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime


class SessionCreate(BaseModel):
    user_id: Optional[str] = None
    title: Optional[str] = None


class SessionUpdate(BaseModel):
    title: Optional[str] = None
    is_active: Optional[bool] = None


class SessionResponse(BaseModel):
    id: str
    user_id: Optional[str]
    title: Optional[str]
    created_at: datetime
    updated_at: datetime
    is_active: bool
    message_count: int = 0

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    role: Literal["user", "assistant", "system", "tool"]
    content: Optional[str] = None
    tool_calls: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    tokens_used: Optional[int] = None


class MessageResponse(BaseModel):
    id: int
    session_id: str
    role: str
    content: Optional[str]
    tool_calls: Optional[Dict[str, Any]]
    created_at: datetime
    model: Optional[str]
    tokens_used: Optional[int]
    tool_steps: List["ToolStepResponse"] = []

    class Config:
        from_attributes = True


class ToolStepCreate(BaseModel):
    step_number: int
    tool_name: str
    tool_input: Dict[str, Any]


class ToolStepResponse(BaseModel):
    id: int
    message_id: int
    step_number: int
    tool_name: str
    tool_input: Dict[str, Any]
    tool_output: Optional[str]
    tool_error: Optional[str]
    started_at: datetime
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    status: str

    class Config:
        from_attributes = True


class ChatResponse(BaseModel):
    """Response model for non-streaming chat endpoint."""

    output: str
    intermediate_steps: List[Dict[str, Any]] = []
    tool_steps: List[ToolStepResponse] = []
    message: MessageResponse


MessageResponse.model_rebuild()
