from pydantic import BaseModel, ConfigDict
from uuid import UUID
from app.schemas.contributors import ContributorResponse
from app.schemas.pr_labels import PrLabelResponse
from typing import Optional, List
from datetime import datetime

class PullRequestBase(BaseModel):
    github_pr_number: int
    title: str
    state: str
    opened_at: datetime
    first_review_at: Optional[datetime] = None
    merged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    additions: int = 0
    deletions: int = 0

class PullRequestCreate(PullRequestBase):
    repository_id: UUID
    author_id: UUID

class PullRequestUpdate(BaseModel):
    github_pr_number: Optional[int] = None
    title: Optional[str] = None
    state: Optional[str] = None
    opened_at: Optional[datetime] = None
    first_review_at: Optional[datetime] = None
    merged_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    additions: Optional[int] = None
    deletions: Optional[int] = None

class PullRequestResponse(PullRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    repository_id: UUID
    author_id: UUID


class PullRequestDetailResponse(PullRequestBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    repository_id: UUID
    author: ContributorResponse
    labels: List[PrLabelResponse]
    reviewers: List[ContributorResponse]
