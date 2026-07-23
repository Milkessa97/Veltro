from pydantic import BaseModel, ConfigDict, RootModel
from typing import List
from uuid import UUID
from datetime import datetime


class DigestResponse(BaseModel):
    """
    Pydantic response schema for a generated AI digest.
    """
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    repository_id: UUID
    content: str
    period_start: datetime
    period_end: datetime
    is_stale: bool
    generated_at: datetime
    type: str


class BottleneckExplanationResponse(BaseModel):
    """
    Pydantic response schema for a contributor bottleneck explanation.
    """
    model_config = ConfigDict(from_attributes=True)

    contributor_login: str
    explanation: str
    generated_at: datetime


class DigestHistoryResponse(RootModel[List[DigestResponse]]):
    """
    Pydantic response schema wrapping a list of DigestResponse objects.
    """
    model_config = ConfigDict(from_attributes=True)
