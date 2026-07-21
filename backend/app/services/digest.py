import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.models.digest import Digest
from app.models.users import User

logger = logging.getLogger(__name__)


def get_fresh_digest(
    db: Session, user: User, repository_id: UUID, digest_type: str = "weekly"
) -> Optional[Digest]:
    """
    Checks whether a fresh non-stale digest exists for this user and repository.
    Fresh means generated_at > NOW() - 24 hours AND is_stale = False.
    Returns the digest if found, None if not.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    # Removing tzinfo to match naive datetime stored in SQLite/Postgres without timezone if standard
    cutoff_naive = cutoff.replace(tzinfo=None)

    digest = db.query(Digest).filter(
        Digest.user_id == user.id,
        Digest.repository_id == repository_id,
        Digest.type == digest_type,
        Digest.is_stale == False,
        Digest.generated_at > cutoff_naive
    ).order_by(Digest.generated_at.desc()).first()

    return digest


def build_metrics_payload(db: Session, repository_id: UUID, days: int = 7) -> Dict[str, Any]:
    """
    Queries the database using RAW SQL via db.execute() and returns a
    structured dictionary of metrics to pass to the AI service.
    All queries filter by repository_id.
    """
    period_end = datetime.now(timezone.utc)
    period_start = period_end - timedelta(days=days)

    # Naive datetimes for DB filtering
    start_date_naive = period_start.replace(tzinfo=None)

    # 1. Total PRs merged in the period
    res_merged = db.execute(
        text("""
            SELECT COUNT(*) FROM pull_requests
            WHERE repository_id = :repo_id
              AND state = 'merged'
              AND merged_at >= :start_date
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).scalar() or 0

    # 2. Total PRs opened in the period
    res_opened = db.execute(
        text("""
            SELECT COUNT(*) FROM pull_requests
            WHERE repository_id = :repo_id
              AND opened_at >= :start_date
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).scalar() or 0

    # 3. Average cycle time in hours for PRs merged in the period
    res_avg_cycle = db.execute(
        text("""
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (merged_at - opened_at)) / 3600.0), 0.0)
            FROM pull_requests
            WHERE repository_id = :repo_id
              AND state = 'merged'
              AND merged_at >= :start_date
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).scalar() or 0.0

    # 4. Average time to first review in hours for PRs opened in the period
    res_avg_review = db.execute(
        text("""
            SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (first_review_at - opened_at)) / 3600.0), 0.0)
            FROM pull_requests
            WHERE repository_id = :repo_id
              AND first_review_at IS NOT NULL
              AND opened_at >= :start_date
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).scalar() or 0.0

    # 5. Currently open PRs count
    res_open_count = db.execute(
        text("""
            SELECT COUNT(*) FROM pull_requests
            WHERE repository_id = :repo_id
              AND state = 'open'
        """),
        {"repo_id": repository_id}
    ).scalar() or 0

    # 6. Oldest open PR in days
    res_oldest = db.execute(
        text("""
            SELECT COALESCE(EXTRACT(EPOCH FROM (NOW() - MIN(opened_at))) / 86400.0, 0.0)
            FROM pull_requests
            WHERE repository_id = :repo_id
              AND state = 'open'
        """),
        {"repo_id": repository_id}
    ).scalar() or 0.0

    # 7. Top contributors: list of {login, prs_opened, reviews_given}
    opened_res = db.execute(
        text("""
            SELECT c.github_login, COUNT(p.id) AS prs_opened
            FROM contributors c
            LEFT JOIN pull_requests p ON p.author_id = c.id AND p.opened_at >= :start_date
            WHERE c.repository_id = :repo_id
            GROUP BY c.github_login
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).all()
    opened_dict = {row[0]: row[1] for row in opened_res}

    reviews_res = db.execute(
        text("""
            SELECT c.github_login, COUNT(r.id) AS reviews_given
            FROM contributors c
            LEFT JOIN reviews r ON r.reviewer_id = c.id AND r.submitted_at >= :start_date
            WHERE c.repository_id = :repo_id
            GROUP BY c.github_login
        """),
        {"repo_id": repository_id, "start_date": start_date_naive}
    ).all()
    reviews_dict = {row[0]: row[1] for row in reviews_res}

    top_contributors = []
    all_logins = set(list(opened_dict.keys()) + list(reviews_dict.keys()))
    for login in all_logins:
        top_contributors.append({
            "login": login,
            "prs_opened": opened_dict.get(login, 0),
            "reviews_given": reviews_dict.get(login, 0)
        })
    top_contributors.sort(key=lambda x: x["prs_opened"] + x["reviews_given"], reverse=True)

    # 8. Bottlenecks: list of {login, pending_reviews, avg_pending_hours}
    bottlenecks_res = db.execute(
        text("""
            SELECT c.github_login, COUNT(prr.id) AS pending_reviews,
                   COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - prr.requested_at)) / 3600.0), 0.0) AS avg_pending_hours
            FROM pull_request_reviewers prr
            JOIN contributors c ON prr.contributor_id = c.id
            JOIN pull_requests pr ON prr.pull_request_id = pr.id
            WHERE pr.repository_id = :repo_id AND prr.status = 'requested'
            GROUP BY c.github_login
        """),
        {"repo_id": repository_id}
    ).all()

    bottlenecks = [
        {
            "login": row[0],
            "pending_reviews": row[1],
            "avg_pending_hours": round(float(row[2]), 1)
        }
        for row in bottlenecks_res
    ]

    return {
        "total_prs_merged": res_merged,
        "total_prs_opened": res_opened,
        "avg_cycle_time_hours": round(float(res_avg_cycle), 1),
        "avg_time_to_first_review_hours": round(float(res_avg_review), 1),
        "open_prs_count": res_open_count,
        "oldest_open_pr_days": round(float(res_oldest), 1),
        "top_contributors": top_contributors,
        "bottlenecks": bottlenecks,
        "period_start": period_start,
        "period_end": period_end
    }


def create_digest(
    db: Session,
    user_id: UUID,
    repository_id: UUID,
    content: str,
    period_start: datetime,
    period_end: datetime,
    digest_type: str
) -> Digest:
    """
    Creates and commits a new Digest row.
    """
    # Remove tzinfo from dates to persist as naive timestamp
    p_start = period_start.replace(tzinfo=None) if period_start.tzinfo else period_start
    p_end = period_end.replace(tzinfo=None) if period_end.tzinfo else period_end

    digest = Digest(
        user_id=user_id,
        repository_id=repository_id,
        content=content,
        period_start=p_start,
        period_end=p_end,
        type=digest_type,
        is_stale=False,
    )
    db.add(digest)
    db.commit()
    db.refresh(digest)
    return digest


def get_digest_history(
    db: Session, user_id: UUID, repository_id: UUID, limit: int = 20
) -> List[Digest]:
    """
    Returns the last N digests for a user and repository, newest first.
    """
    return db.query(Digest).filter(
        Digest.user_id == user_id,
        Digest.repository_id == repository_id
    ).order_by(Digest.generated_at.desc()).limit(limit).all()
