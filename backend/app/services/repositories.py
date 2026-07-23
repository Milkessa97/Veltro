import logging
from datetime import datetime, timedelta, UTC
from uuid import UUID
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from fastapi import HTTPException

from app.models.users import User
from app.models.repositories import Repositories
from app.models.contributors import Contributors
from app.models.pull_requests import PullRequests
from app.models.reviews import Review
from app.models.pr_labels import PrLabels
from app.models.commits import Commit
from app.models.sync_logs import SyncLog
from app.services.github import GitHubAPIClient
from app.models.pull_request_reviewers import PullRequestReviewer

logger = logging.getLogger(__name__)


def datetime_from_iso(iso_str: Optional[str]) -> Optional[datetime]:
    if not iso_str:
        return None
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))

def get_user_repositories(db: Session, user: User) -> List[Repositories]:
    """
    Retrieves all locally saved repositories for a user.
    """
    return db.query(Repositories).filter(Repositories.user_id == user.id).all()

def sync_repositories(db: Session, user: User) -> List[Repositories]:
    """
    Fetches the repositories that the GitHub App installation has access to,
    syncs them with the local database, and deletes any that are no longer accessible.
    """
    if not user.github_installation_id:
        logger.warning(f"User {user.id} has no github_installation_id set.")
        return []

    try:
        with GitHubAPIClient(user.github_installation_id) as client:
            # Fetch repositories list from GitHub.
            # GitHub returns a dict like: {"total_count": ..., "repositories": [...]}
            response = client.get("/installation/repositories")
            github_repos = response.get("repositories", [])

            # Load all existing local repos for this user in one query, keyed by github_id.
            existing_repos: Dict[int, Repositories] = {
                r.github_id: r
                for r in db.query(Repositories).filter(Repositories.user_id == user.id).all()
            }

            github_repo_ids = []

            for r in github_repos:
                github_id = int(r["id"])
                github_repo_ids.append(github_id)

                owner_login = r["owner"]["login"]
                name = r["name"]
                full_name = r["full_name"]
                is_private = r["private"]

                repo = existing_repos.get(github_id)

                if repo:
                    # Update existing repo details
                    repo.owner = owner_login
                    repo.name = name
                    repo.full_name = full_name
                    repo.is_private = is_private
                else:
                    # Create new repo record
                    repo = Repositories(
                        user_id=user.id,
                        github_id=github_id,
                        owner=owner_login,
                        name=name,
                        full_name=full_name,
                        is_private=is_private,
                        is_synced=False
                    )
                    db.add(repo)

            # Delete any local repositories that are no longer returned by GitHub
            # (e.g. user uninstalled the App from the Repo permissions or deleted it)
            if github_repo_ids:
                db.query(Repositories).filter(
                    Repositories.user_id == user.id,
                    ~Repositories.github_id.in_(github_repo_ids)
                ).delete(synchronize_session=False)
            else:
                db.query(Repositories).filter(
                    Repositories.user_id == user.id
                ).delete(synchronize_session=False)

            db.commit()

    except Exception as e:
        logger.error(f"Failed to sync repositories for user {user.id}: {str(e)}")
        db.rollback()
        raise e

    return get_user_repositories(db, user)

# --- Refactored Utility & Git Author Parsing Helpers ---

def _get_or_create_contributor(
    db: Session, 
    repo_id: UUID, 
    github_user: Dict[str, Any], 
    contributor_map: Dict[str, Any], 
    existing_contribs: Dict[int, Any]
) -> Any:
    login = github_user["login"]
    if login in contributor_map:
        return contributor_map[login]

    github_id = github_user["id"]
    avatar_url = github_user.get("avatar_url", "")
    display_name = github_user.get("name") or login

    contrib = existing_contribs.get(github_id)
    if not contrib:
        contrib = Contributors(
            repository_id=repo_id,
            github_id=github_id,
            github_login=login,
            display_name=display_name,
            avatar_url=avatar_url
        )
        db.add(contrib)
        db.flush()
        existing_contribs[github_id] = contrib

    contributor_map[login] = contrib
    return contrib


def _get_or_create_git_contributor(
    db: Session, 
    repo_id: UUID, 
    git_author: Dict[str, Any], 
    contributor_map: Dict[str, Any]
) -> Any:
    name = git_author.get("name") or "Unknown"
    email = git_author.get("email") or ""
    login = email.split("@")[0] if email else name
    
    if login in contributor_map:
        return contributor_map[login]

    contrib = db.query(Contributors).filter(
        Contributors.repository_id == repo_id,
        Contributors.github_login == login
    ).first()

    if not contrib:
        contrib = Contributors(
            repository_id=repo_id,
            github_id=None,
            github_login=login,
            display_name=name,
            avatar_url=""
        )
        db.add(contrib)
        db.flush()

    contributor_map[login] = contrib
    return contrib


# --- Distinct Synchronization Modules ---

def _sync_contributors(db: Session, client: GitHubAPIClient, repo_id: UUID) -> Dict[str, Any]:
    repo = db.query(Repositories).filter(Repositories.id == repo_id).first()
    if not repo:
        raise ValueError("Repository not found.")

    contributors_url = f"/repos/{repo.owner}/{repo.name}/contributors"
    github_contributors = client.get_all(contributors_url)

    existing_contribs = {
        c.github_id: c
        for c in db.query(Contributors).filter(Contributors.repository_id == repo_id).all()
    }

    contributor_map: Dict[str, Any] = {}
    for c in github_contributors:
        github_login = c["login"]
        github_id = c["id"]
        avatar_url = c.get("avatar_url", "")
        display_name = c.get("name") or github_login

        contrib = existing_contribs.get(github_id)
        if contrib:
            contrib.github_login = github_login
            contrib.display_name = display_name
            contrib.avatar_url = avatar_url
        else:
            contrib = Contributors(
                repository_id=repo_id,
                github_id=github_id,
                github_login=github_login,
                display_name=display_name,
                avatar_url=avatar_url
            )
            db.add(contrib)
            db.flush()
            existing_contribs[github_id] = contrib

        contributor_map[github_login] = contrib
    
    return contributor_map


def _sync_pull_requests(
    db: Session,
    client: GitHubAPIClient,
    repo_id: UUID,
    contributor_map: Dict[str, Any],
    cutoff_date: datetime
) -> tuple[int, int]:
    repo = db.query(Repositories).filter(Repositories.id == repo_id).first()
    pulls_url = f"/repos/{repo.owner}/{repo.name}/pulls"
    github_pulls = client.get_all(pulls_url, params={"state": "all"})

    prs_count = 0
    reviews_count = 0

    existing_prs = {
        pr.github_pr_number: pr
        for pr in db.query(PullRequests).filter(PullRequests.repository_id == repo_id).all()
    }

    existing_contribs = {
        c.github_id: c
        for c in db.query(Contributors).filter(Contributors.repository_id == repo_id).all()
    }

    if existing_prs:
        existing_pr_ids = [pr.id for pr in existing_prs.values()]
        db.query(PrLabels).filter(PrLabels.pull_request_id.in_(existing_pr_ids)).delete(synchronize_session=False)
        db.query(Review).filter(Review.pull_request_id.in_(existing_pr_ids)).delete(synchronize_session=False)
        db.query(PullRequestReviewer).filter(PullRequestReviewer.pull_request_id.in_(existing_pr_ids)).delete(synchronize_session=False)

    for p in github_pulls:
        opened_at = datetime_from_iso(p["created_at"])
        if opened_at and opened_at < cutoff_date:
            continue

        pr_number = p["number"]
        title = p["title"]
        state = "merged" if p["state"] == "closed" and p.get("merged_at") else p["state"]
        closed_at = datetime_from_iso(p.get("closed_at"))
        merged_at = datetime_from_iso(p.get("merged_at"))

        existing_pr = existing_prs.get(pr_number)
        if existing_pr and existing_pr.state == state and state in ("closed", "merged"):
            additions = existing_pr.additions or 0
            deletions = existing_pr.deletions or 0
        else:
            detail_url = f"/repos/{repo.owner}/{repo.name}/pulls/{pr_number}"
            pr_details = client.get(detail_url)
            additions = pr_details.get("additions", 0)
            deletions = pr_details.get("deletions", 0)

        author_contrib = _get_or_create_contributor(db, repo_id, p["user"], contributor_map, existing_contribs)

        if existing_pr:
            existing_pr.title = title
            existing_pr.state = state
            existing_pr.opened_at = opened_at
            existing_pr.closed_at = closed_at
            existing_pr.merged_at = merged_at
            existing_pr.additions = additions
            existing_pr.deletions = deletions
            pr = existing_pr
        else:
            pr = PullRequests(
                repository_id=repo_id,
                author_id=author_contrib.id,
                github_pr_number=pr_number,
                title=title,
                state=state,
                opened_at=opened_at,
                closed_at=closed_at,
                merged_at=merged_at,
                additions=additions,
                deletions=deletions
            )
            db.add(pr)
            db.flush()
            existing_prs[pr_number] = pr

        prs_count += 1

        # Sync Labels
        for label_data in p.get("labels", []):
            db.add(PrLabels(pull_request_id=pr.id, name=label_data["name"], color=label_data["color"]))

        # Sync Assigned Review Requests
        assigned_reviewer_map = {}
        for rr_user in p.get("requested_reviewers", []):
            rr_contrib = _get_or_create_contributor(db, repo_id, rr_user, contributor_map, existing_contribs)
            rr_record = PullRequestReviewer(
                pull_request_id=pr.id,
                contributor_id=rr_contrib.id,
                status="requested",
                requested_at=opened_at,
            )
            db.add(rr_record)
            assigned_reviewer_map[rr_contrib.id] = rr_record

        # Sync Review Submissions
        reviews_url = f"/repos/{repo.owner}/{repo.name}/pulls/{pr_number}/reviews"
        first_review_at = None

        for r in client.get_all(reviews_url):
            review_state = r["state"].lower()
            submitted_at = datetime_from_iso(r.get("submitted_at"))

            if submitted_at and (first_review_at is None or submitted_at < first_review_at):
                first_review_at = submitted_at

            if review_state in ("approved", "changes_requested", "commented"):
                if not r["user"]:
                    continue
                reviewer_contrib = _get_or_create_contributor(db, repo_id, r["user"], contributor_map, existing_contribs)

                db.add(Review(
                    pull_request_id=pr.id,
                    reviewer_id=reviewer_contrib.id,
                    github_review_id=r["id"],
                    state=review_state,
                    submitted_at=submitted_at or opened_at
                ))
                reviews_count += 1

                if reviewer_contrib.id in assigned_reviewer_map:
                    assigned_reviewer_map[reviewer_contrib.id].status = review_state
                else:
                    db.add(PullRequestReviewer(
                        pull_request_id=pr.id,
                        contributor_id=reviewer_contrib.id,
                        status=f"unassigned_{review_state}",
                        requested_at=submitted_at or opened_at,
                    ))

        pr.first_review_at = first_review_at

    return prs_count, reviews_count


def _sync_commits(
    db: Session,
    client: GitHubAPIClient,
    repo_id: UUID,
    contributor_map: Dict[str, Any],
    cutoff_date: datetime
) -> int:
    repo = db.query(Repositories).filter(Repositories.id == repo_id).first()
    commits_url = f"/repos/{repo.owner}/{repo.name}/commits"
    github_commits = client.get_all(
        commits_url,
        params={"since": cutoff_date.strftime("%Y-%m-%dT%H:%M:%SZ")}
    )

    commits_count = 0
    existing_commits = {
        c.sha: c for c in db.query(Commit).filter(Commit.repository_id == repo_id).all()
    }

    for c_data in github_commits:
        sha = c_data["sha"]
        commit_info = c_data["commit"]
        committed_at = datetime_from_iso(commit_info["author"]["date"])
        message = commit_info["message"]

        if c_data.get("author"):
            existing_contribs = {
                c.github_id: c for c in db.query(Contributors).filter(Contributors.repository_id == repo_id).all()
            }
            author_contrib = _get_or_create_contributor(db, repo_id, c_data["author"], contributor_map, existing_contribs)
        else:
            author_contrib = _get_or_create_git_contributor(db, repo_id, commit_info["author"], contributor_map)

        commit_record = existing_commits.get(sha)
        if commit_record:
            commit_record.message = message
            commit_record.committed_at = committed_at
            commit_record.author_id = author_contrib.id
        else:
            db.add(Commit(
                repository_id=repo_id,
                author_id=author_contrib.id,
                sha=sha,
                message=message,
                committed_at=committed_at
            ))
            commits_count += 1

    return commits_count


# --- Clean Orchestration Layer ---

def sync_repository_data(
    db: Session,
    repository_id: UUID,
    days: int = 30,
    triggered_by: str = "manual",
    user: User = None
) -> Repositories:
    repo = db.query(Repositories).filter(
        Repositories.id == repository_id,
        Repositories.user_id == user.id
    ).first()

    if not repo or not user.github_installation_id:
        raise ValueError("Repository not found or access credentials missing.")
    logger.info(f"Syncing repository data for repository {repo.id}")
    # Transaction Isolation: Commit the running log status immediately
    sync_log = SyncLog(
        repository_id=repo.id,
        status="running",
        triggered_by=triggered_by,
        prs_fetched=0,
        reviews_fetched=0,
        commits_fetched=0,
        started_at=datetime.now(UTC)
    )
    db.add(sync_log)
    db.commit() 

    cutoff_date = datetime.now(UTC) - timedelta(days=days)

    try:
        with GitHubAPIClient(user.github_installation_id) as client:
            # Execute sub-modules safely within their own context
            logger.info(f"Syncing contributors for repository {repo.id}")
            contributor_map = _sync_contributors(db, client, repo.id)
            logger.info(f"Contributors synced for repository {repo.id}")
            prs_count, reviews_count = _sync_pull_requests(db, client, repo.id, contributor_map, cutoff_date)
            logger.info(f"Pull requests synced for repository {repo.id}")
            logger.info(f"Reviews synced for repository {repo.id}")
            commits_count = _sync_commits(db, client, repo.id, contributor_map, cutoff_date)
            logger.info(f"Commits synced for repository {repo.id}")

            # Update business metadata info on successful run
            repo.is_synced = True
            repo.synced_at = func.now()

            sync_log.status = "completed"
            sync_log.prs_fetched = prs_count
            sync_log.reviews_fetched = reviews_count
            sync_log.commits_fetched = commits_count
            sync_log.completed_at = datetime.now(UTC)

            db.commit()
            db.refresh(repo)

    except Exception as e:
        logger.error(f"Failed to sync repository data for {repository_id}: {str(e)}")
        db.rollback()  # Rolls back failed sync operations safely

        # Re-verify SyncLog status update under an independent frame
        try:
            sync_log.status = "failed"
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now(UTC)
            db.commit()
        except Exception as log_err:
            logger.error(f"Failed to save failed status to sync log: {str(log_err)}")
        raise e

    return repo

def get_sync_logs(
    db: Session, 
    repository_id: UUID, 
    user: User,
    limit: int = 20
) -> List[SyncLog]:
    """
    Retrieves the most recent sync logs for a given repository.
    """
    # First, ensure the repository exists and belongs to the user
    repo = db.query(Repositories).filter(
        Repositories.id == repository_id,
        Repositories.user_id == user.id
    ).first()
    
    if not repo:
        raise HTTPException(status_code=404, detail="Repository not found or access denied")
        
    return db.query(SyncLog).filter(
        SyncLog.repository_id == repository_id
    ).order_by(SyncLog.started_at.desc()).limit(limit).all()