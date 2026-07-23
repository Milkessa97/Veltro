from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional


class RepoMetricsResponse(BaseModel):
    total_prs: int
    open_prs: int
    closed_prs: int
    merged_prs: int
    avg_cycle_time_hours: float
    avg_review_latency_hours: float
    total_additions: int
    total_deletions: int
    avg_open_pr_age_hours: float
    deploys_per_week: float
    avg_coding_time_hours: float
    avg_review_time_hours: float
    bottleneck_score: float


class ContributorMetricsResponse(BaseModel):
    id: UUID
    username: str
    display_name: str
    avatar_url: str
    prs_opened: int
    prs_reviewed: int
    avg_cycle_time_hours: float
    review_assignments: int   # formally requested (CODEOWNERS / manual assignment)
    organic_reviews: int      # reviewed without being assigned


class SyncLogResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    repository_id: UUID
    status: str            # "running" | "completed" | "failed"
    triggered_by: str      # "manual" | "webhook" | "scheduled"
    prs_fetched: int
    reviews_fetched: int
    commits_fetched: int
    error_message: Optional[str] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
