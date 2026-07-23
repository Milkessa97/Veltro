from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class PullRequestReviewerBase(BaseModel):
    status: str
    requested_at: datetime

class PullRequestReviewerCreate(PullRequestReviewerBase):
    pull_request_id: UUID
    contributor_id: UUID

class PullRequestReviewerUpdate(BaseModel):
    status: Optional[str] = None
    requested_at: Optional[datetime] = None

class PullRequestReviewerResponse(PullRequestReviewerBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    pull_request_id: UUID
    contributor_id: UUID
