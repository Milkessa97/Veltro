from pydantic import BaseModel
from uuid import UUID


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
