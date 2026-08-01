from enum import Enum
from uuid import UUID

from pydantic import BaseModel


class AgentName(str, Enum):
    planner = "planner"
    researcher = "researcher"
    scout = "scout"
    verifier = "verifier"
    coordinator = "coordinator"


class AgentEventType(str, Enum):
    started = "started"
    thinking = "thinking"
    tool_call = "tool_call"
    tool_result = "tool_result"
    completed = "completed"
    failed = "failed"


class AgentEvent(BaseModel):
    analysis_id: UUID
    agent: AgentName
    event_type: AgentEventType
    message: str
    payload: dict | None = None
