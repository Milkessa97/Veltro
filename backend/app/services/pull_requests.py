import logging
from datetime import datetime, timedelta, UTC
from uuid import UUID
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import func, case

from app.models.pull_requests import PullRequests
from app.models.contributors import Contributors
from app.models.reviews import Review

logger = logging.getLogger(__name__)

def get_pull_requests(
    db: Session, 
    repository_id: UUID, 
    date_range_days: int = 30,
    state: Optional[str] = None
) -> List[PullRequests]:
    """
    Retrieves pull requests for a given repository filtered by date range and state.
    """
    cutoff_date = datetime.now(UTC) - timedelta(days=date_range_days)
    
    query = db.query(PullRequests).filter(
        PullRequests.repository_id == repository_id,
        PullRequests.opened_at >= cutoff_date
    )
    
    if state:
        query = query.filter(PullRequests.state == state)
        
    return query.order_by(PullRequests.opened_at.desc()).all()

def get_repo_metrics(db: Session, repository_id: UUID, date_range_days: int = 30) -> Dict[str, Any]:
    """
    Calculates key metrics (average cycle time, review latency, PR counts, additions/deletions,
    deploy frequency, open PR age, bottleneck score, and lifecycle stages)
    for a repository over a given date range.
    All aggregation is pushed to the database to avoid loading rows into Python.
    """
    cutoff_date = datetime.now(UTC) - timedelta(days=date_range_days)

    row = db.query(
        func.count(PullRequests.id).label("total_prs"),
        func.sum(
            case((PullRequests.state == "open", 1), else_=0)
        ).label("open_prs"),
        func.sum(
            case((PullRequests.state == "closed", 1), else_=0)
        ).label("closed_prs"),
        func.sum(
            case((PullRequests.state == "merged", 1), else_=0)
        ).label("merged_prs"),
        func.coalesce(func.sum(PullRequests.additions), 0).label("total_additions"),
        func.coalesce(func.sum(PullRequests.deletions), 0).label("total_deletions"),
        # avg cycle time in hours for merged PRs
        func.avg(
            case(
                (
                    (PullRequests.state == "merged") & (PullRequests.merged_at.isnot(None)),
                    func.extract("epoch", PullRequests.merged_at - PullRequests.opened_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_cycle_time_hours"),
        # avg review latency (time to first review) in hours for PRs that have a first review
        func.avg(
            case(
                (
                    PullRequests.first_review_at.isnot(None),
                    func.extract("epoch", PullRequests.first_review_at - PullRequests.opened_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_review_latency_hours"),
        # avg open PR age in hours
        func.avg(
            case(
                (
                    PullRequests.state == "open",
                    func.extract("epoch", func.now() - PullRequests.opened_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_open_pr_age_hours"),
        # avg coding time (time to first review) in hours
        func.avg(
            case(
                (
                    PullRequests.first_review_at.isnot(None),
                    func.extract("epoch", PullRequests.first_review_at - PullRequests.opened_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_coding_time_hours"),
        # avg review time (first review to merged) in hours for merged PRs
        func.avg(
            case(
                (
                    (PullRequests.state == "merged") & (PullRequests.first_review_at.isnot(None)) & (PullRequests.merged_at.isnot(None)),
                    func.extract("epoch", PullRequests.merged_at - PullRequests.first_review_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_review_time_hours"),
        # count of open unreviewed PRs for bottleneck score calculation
        func.sum(
            case(
                (
                    (PullRequests.state == "open") & (PullRequests.first_review_at.is_(None)),
                    1
                ),
                else_=0
            )
        ).label("open_unreviewed_prs"),
    ).filter(
        PullRequests.repository_id == repository_id,
        PullRequests.opened_at >= cutoff_date,
    ).one()

    open_prs = row.open_prs or 0
    open_unreviewed = row.open_unreviewed_prs or 0
    merged_prs = row.merged_prs or 0

    deploys_per_week = round(float(merged_prs) / (date_range_days / 7.0), 1)
    bottleneck_score = round((float(open_unreviewed) / open_prs) * 100.0, 1) if open_prs > 0 else 0.0

    return {
        "total_prs": row.total_prs or 0,
        "open_prs": open_prs,
        "closed_prs": row.closed_prs or 0,
        "merged_prs": merged_prs,
        "avg_cycle_time_hours": round(float(row.avg_cycle_time_hours), 1) if row.avg_cycle_time_hours else 0.0,
        "avg_review_latency_hours": round(float(row.avg_review_latency_hours), 1) if row.avg_review_latency_hours else 0.0,
        "total_additions": row.total_additions or 0,
        "total_deletions": row.total_deletions or 0,
        "avg_open_pr_age_hours": round(float(row.avg_open_pr_age_hours), 1) if row.avg_open_pr_age_hours else 0.0,
        "deploys_per_week": deploys_per_week,
        "avg_coding_time_hours": round(float(row.avg_coding_time_hours), 1) if row.avg_coding_time_hours else 0.0,
        "avg_review_time_hours": round(float(row.avg_review_time_hours), 1) if row.avg_review_time_hours else 0.0,
        "bottleneck_score": bottleneck_score,
    }

def get_contributor_metrics(db: Session, repository_id: UUID, date_range_days: int = 30) -> List[Dict[str, Any]]:
    """
    Computes performance metrics (PRs opened, PRs reviewed, avg cycle time)
    for each contributor in the repository.
    Uses two bulk aggregation queries instead of N+2 per-contributor queries.
    """
    cutoff_date = datetime.now(UTC) - timedelta(days=date_range_days)

    # --- Query 1: contributors list ---
    contributors = db.query(Contributors).filter(
        Contributors.repository_id == repository_id
    ).all()

    if not contributors:
        return []

    contributor_ids = [c.id for c in contributors]

    # --- Query 2: opened PR counts and avg cycle time per author (only needed scalar columns) ---
    opened_rows = db.query(
        PullRequests.author_id,
        func.count(PullRequests.id).label("prs_opened"),
        func.avg(
            case(
                (
                    (PullRequests.state == "merged") & (PullRequests.merged_at.isnot(None)),
                    func.extract("epoch", PullRequests.merged_at - PullRequests.opened_at) / 3600.0,
                ),
                else_=None,
            )
        ).label("avg_cycle_time_hours"),
    ).filter(
        PullRequests.repository_id == repository_id,
        PullRequests.author_id.in_(contributor_ids),
        PullRequests.opened_at >= cutoff_date,
    ).group_by(PullRequests.author_id).all()

    opened_by_contributor = {
        str(row.author_id): {
            "prs_opened": row.prs_opened,
            "avg_cycle_time_hours": round(float(row.avg_cycle_time_hours), 1) if row.avg_cycle_time_hours else 0.0,
        }
        for row in opened_rows
    }

    # --- Query 3: reviewed PR counts per contributor (distinct PRs reviewed) ---
    reviewed_rows = db.query(
        Review.reviewer_id,
        func.count(Review.pull_request_id.distinct()).label("prs_reviewed"),
    ).join(
        PullRequests, PullRequests.id == Review.pull_request_id
    ).filter(
        PullRequests.repository_id == repository_id,
        Review.reviewer_id.in_(contributor_ids),
        PullRequests.opened_at >= cutoff_date,
    ).group_by(Review.reviewer_id).all()

    reviewed_by_contributor = {
        str(row.reviewer_id): row.prs_reviewed
        for row in reviewed_rows
    }

    # --- Assemble metrics ---
    metrics = []
    for c in contributors:
        cid = str(c.id)
        opened_data = opened_by_contributor.get(cid, {"prs_opened": 0, "avg_cycle_time_hours": 0.0})
        metrics.append({
            "id": cid,
            "username": c.github_login,
            "display_name": c.display_name,
            "avatar_url": c.avatar_url,
            "prs_opened": opened_data["prs_opened"],
            "prs_reviewed": reviewed_by_contributor.get(cid, 0),
            "avg_cycle_time_hours": opened_data["avg_cycle_time_hours"],
        })

    # Sort contributors by activity level (total PRs opened + reviewed desc)
    metrics.sort(key=lambda x: (x["prs_opened"] + x["prs_reviewed"]), reverse=True)
    return metrics

def get_pull_requests_detailed(
    db: Session, 
    repository_id: UUID, 
    date_range_days: int = 30,
    state: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Retrieves pull requests with fully populated nested data (author, labels, reviewers).
    Uses selectinload to batch-load all related data in 3 fixed queries regardless of PR count.
    """
    cutoff_date = datetime.now(UTC) - timedelta(days=date_range_days)

    query = db.query(PullRequests).options(
        selectinload(PullRequests.author),
        selectinload(PullRequests.labels),
        selectinload(PullRequests.reviewers),
    ).filter(
        PullRequests.repository_id == repository_id,
        PullRequests.opened_at >= cutoff_date,
    )

    if state:
        query = query.filter(PullRequests.state == state)

    prs = query.order_by(PullRequests.opened_at.desc()).all()

    return [
        {
            "id": pr.id,
            "repository_id": pr.repository_id,
            "github_pr_number": pr.github_pr_number,
            "title": pr.title,
            "state": pr.state,
            "opened_at": pr.opened_at,
            "first_review_at": pr.first_review_at,
            "merged_at": pr.merged_at,
            "closed_at": pr.closed_at,
            "additions": pr.additions,
            "deletions": pr.deletions,
            "author": pr.author,
            "labels": pr.labels,
            "reviewers": pr.reviewers,
        }
        for pr in prs
    ]
