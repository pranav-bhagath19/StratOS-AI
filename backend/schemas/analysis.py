from enum import Enum
from uuid import UUID

from pydantic import BaseModel, Field


class AnalysisType(str, Enum):
    account_pulse = "account_pulse"
    supplier_watch = "supplier_watch"
    threat_surface = "threat_surface"


class AnalysisStatus(str, Enum):
    queued = "queued"
    running = "running"
    completed = "completed"
    failed = "failed"


class AnalysisCreate(BaseModel):
    analysis_type: AnalysisType
    target: str = Field(..., description="Company name, domain, or natural-language target")
    context: str | None = Field(None, description="Optional additional context for the agents")


class AnalysisResponse(BaseModel):
    id: UUID
    analysis_type: AnalysisType
    status: AnalysisStatus
    target: str
    context: str | None
