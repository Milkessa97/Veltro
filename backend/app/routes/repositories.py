from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.users import User
from app.services.auth import get_current_user
from app.services import repositories as service
from app.schemas.repositories import RepositoryResponse
from app.services import pull_requests as pr_service
from app.schemas.pull_requests import PullRequestDetailResponse
from app.schemas.metrics import RepoMetricsResponse, ContributorMetricsResponse
from typing import Optional

router = APIRouter(prefix="/repos", tags=["Repositories"])

@router.get("", response_model=List[RepositoryResponse])
def get_repositories(
    sync: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves all repositories associated with the logged-in user.
    If sync=True is passed, it reaches out to GitHub to refresh the available list.
    """
    if sync:
        return service.sync_repositories(db, current_user)
    return service.get_user_repositories(db, current_user)

@router.post("/{id}/sync", response_model=RepositoryResponse)
def sync_repository_data(
    id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers a full background sync of pull requests, contributors,
    reviewers, labels, and commits for the specified repository over the past N days.
    """
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be 7, 30, or 90."
        )
    try:
        return service.sync_repository_data(db, current_user, id, days=days)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while syncing repository data: {str(e)}"
        )


@router.get("/{id}/pull-requests", response_model=List[PullRequestDetailResponse])
def get_repository_pull_requests(
    id: UUID,
    days: int = 30,
    state: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches synced pull requests for the repository with details (author, reviewers, labels).
    """
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be 7, 30, or 90."
        )
    return pr_service.get_pull_requests_detailed(db, id, date_range_days=days, state=state)

@router.get("/{id}/metrics", response_model=RepoMetricsResponse)
def get_repository_metrics(
    id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns aggregated metrics (cycle time, review latency, size totals, states) for the repository.
    """
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be 7, 30, or 90."
        )
    return pr_service.get_repo_metrics(db, id, date_range_days=days)

@router.get("/{id}/contributors-metrics", response_model=List[ContributorMetricsResponse])
def get_repository_contributors_metrics(
    id: UUID,
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns contributor level metrics breakdown (avg cycle time, PRs opened, reviewed) for the repository.
    """
    if days not in (7, 30, 90):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Days parameter must be 7, 30, or 90."
        )
    return pr_service.get_contributor_metrics(db, id, date_range_days=days)
