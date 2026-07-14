import logging
from datetime import datetime, timedelta, UTC
from uuid import UUID
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.users import User
from app.models.repositories import Repositories
from app.models.contributors import Contributors
from app.models.pull_requests import PullRequests
from app.models.reviews import Review
from app.models.pr_labels import PrLabels
from app.models.commits import Commit
from app.models.sync_logs import SyncLog
from app.services.github import GitHubAPIClient

logger = logging.getLogger(__name__)

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

def sync_repository_data(
    db: Session,
    user: User,
    repository_id: UUID,
    days: int = 30,
    triggered_by: str = "manual"
) -> Repositories:
    """
    Syncs contributors, pull requests, reviewers, labels, and commits for a single repository.
    """
    repo = db.query(Repositories).filter(
        Repositories.id == repository_id,
        Repositories.user_id == user.id
    ).first()

    if not repo:
        raise ValueError("Repository not found or access denied.")

    if not user.github_installation_id:
        raise ValueError("User has no GitHub installation ID.")

    # Initialize SyncLog
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
    prs_count = 0
    reviews_count = 0
    commits_count = 0

    try:
        with GitHubAPIClient(user.github_installation_id) as client:
            # 1. Sync Contributors
            contributors_url = f"/repos/{repo.owner}/{repo.name}/contributors"
            github_contributors = client.get_all(contributors_url)

            existing_contribs: Dict[int, Contributors] = {
                c.github_id: c
                for c in db.query(Contributors).filter(
                    Contributors.repository_id == repo.id
                ).all()
            }

            contributor_map: Dict[str, Contributors] = {}

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
                        repository_id=repo.id,
                        github_id=github_id,
                        github_login=github_login,
                        display_name=display_name,
                        avatar_url=avatar_url
                    )
                    db.add(contrib)
                    db.flush()
                    existing_contribs[github_id] = contrib

                contributor_map[github_login] = contrib

            def get_or_create_contributor(github_user: Dict[str, Any]) -> Contributors:
                login = github_user["login"]
                if login in contributor_map:
                    return contributor_map[login]

                github_id = github_user["id"]
                avatar_url = github_user.get("avatar_url", "")
                display_name = github_user.get("name") or login

                contrib = existing_contribs.get(github_id)

                if not contrib:
                    contrib = Contributors(
                        repository_id=repo.id,
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

            def get_or_create_git_contributor(git_author: Dict[str, Any]) -> Contributors:
                name = git_author.get("name") or "Unknown"
                email = git_author.get("email") or ""
                login = email.split("@")[0] if email else name
                if login in contributor_map:
                    return contributor_map[login]

                contrib = db.query(Contributors).filter(
                    Contributors.repository_id == repo.id,
                    Contributors.github_login == login
                ).first()

                if not contrib:
                    contrib = Contributors(
                        repository_id=repo.id,
                        github_id=None,
                        github_login=login,
                        display_name=name,
                        avatar_url=""
                    )
                    db.add(contrib)
                    db.flush()

                contributor_map[login] = contrib
                return contrib

            # 2. Sync Pull Requests
            pulls_url = f"/repos/{repo.owner}/{repo.name}/pulls"
            github_pulls = client.get_all(pulls_url, params={"state": "all"})

            existing_prs: Dict[int, PullRequests] = {
                pr.github_pr_number: pr
                for pr in db.query(PullRequests).filter(
                    PullRequests.repository_id == repo.id
                ).all()
            }

            if existing_prs:
                existing_pr_ids = [pr.id for pr in existing_prs.values()]
                db.query(PrLabels).filter(
                    PrLabels.pull_request_id.in_(existing_pr_ids)
                ).delete(synchronize_session=False)
                db.query(Review).filter(
                    Review.pull_request_id.in_(existing_pr_ids)
                ).delete(synchronize_session=False)

            for p in github_pulls:
                opened_at = datetime_from_iso(p["created_at"])
                if opened_at and opened_at < cutoff_date:
                    continue  # filter by date range

                pr_number = p["number"]
                title = p["title"]

                state = p["state"]
                merged_at_str = p.get("merged_at")
                if state == "closed" and merged_at_str:
                    state = "merged"

                closed_at = datetime_from_iso(p.get("closed_at"))
                merged_at = datetime_from_iso(merged_at_str)

                existing_pr = existing_prs.get(pr_number)
                terminal_states = ("closed", "merged")
                already_synced_terminal = (
                    existing_pr is not None
                    and existing_pr.state == state
                    and state in terminal_states
                )

                if already_synced_terminal:
                    additions = existing_pr.additions or 0
                    deletions = existing_pr.deletions or 0
                else:
                    detail_url = f"/repos/{repo.owner}/{repo.name}/pulls/{pr_number}"
                    pr_details = client.get(detail_url)
                    additions = pr_details.get("additions", 0)
                    deletions = pr_details.get("deletions", 0)

                author_contrib = get_or_create_contributor(p["user"])

                pr = existing_prs.get(pr_number)

                if pr:
                    pr.title = title
                    pr.state = state
                    pr.opened_at = opened_at
                    pr.closed_at = closed_at
                    pr.merged_at = merged_at
                    pr.additions = additions
                    pr.deletions = deletions
                else:
                    pr = PullRequests(
                        repository_id=repo.id,
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

                # 3. Add current labels for this PR
                labels = p.get("labels", [])
                for label in labels:
                    label = PrLabels(
                        pull_request_id=pr.id,
                        name=label["name"],
                        color=label["color"]
                    )
                    db.add(label)

                # 4. Sync Pull Request Reviewers & Reviews
                reviews_url = f"/repos/{repo.owner}/{repo.name}/pulls/{pr_number}/reviews"
                github_reviews = client.get_all(reviews_url)

                first_review_at = None

                for r in github_reviews:
                    review_state = r["state"].lower()
                    submitted_at = datetime_from_iso(r.get("submitted_at"))

                    if submitted_at:
                        if first_review_at is None or submitted_at < first_review_at:
                            first_review_at = submitted_at

                    if review_state in ("approved", "changes_requested", "commented"):
                        reviewer_user = r["user"]
                        if not reviewer_user:
                            continue

                        reviewer_contrib = get_or_create_contributor(reviewer_user)

                        reviewer_record = Review(
                            pull_request_id=pr.id,
                            reviewer_id=reviewer_contrib.id,
                            github_review_id=r["id"],
                            state=review_state,
                            submitted_at=submitted_at or opened_at
                        )
                        db.add(reviewer_record)
                        reviews_count += 1

                pr.first_review_at = first_review_at

            # 5. Sync Commits
            commits_url = f"/repos/{repo.owner}/{repo.name}/commits"
            github_commits = client.get_all(
                commits_url,
                params={"since": cutoff_date.strftime("%Y-%m-%dT%H:%M:%SZ")}
            )

            existing_commits: Dict[str, Commit] = {
                c.sha: c
                for c in db.query(Commit).filter(
                    Commit.repository_id == repo.id
                ).all()
            }

            for c_data in github_commits:
                sha = c_data["sha"]
                commit_info = c_data["commit"]
                committed_at = datetime_from_iso(commit_info["author"]["date"])
                message = commit_info["message"]

                author_data = c_data.get("author")
                if author_data:
                    author_contrib = get_or_create_contributor(author_data)
                else:
                    author_contrib = get_or_create_git_contributor(commit_info["author"])

                commit_record = existing_commits.get(sha)
                if commit_record:
                    commit_record.message = message
                    commit_record.committed_at = committed_at
                    commit_record.author_id = author_contrib.id
                else:
                    commit_record = Commit(
                        repository_id=repo.id,
                        author_id=author_contrib.id,
                        sha=sha,
                        message=message,
                        committed_at=committed_at
                    )
                    db.add(commit_record)
                    commits_count += 1

            # Update repository sync metadata and sync log
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
        db.rollback()
        try:
            sync_log.status = "failed"
            sync_log.error_message = str(e)
            sync_log.completed_at = datetime.now(UTC)
            db.commit()
        except Exception as log_err:
            logger.error(f"Failed to save failed status to sync log: {str(log_err)}")
        raise e

    return repo

def datetime_from_iso(iso_str: Optional[str]) -> Optional[datetime]:
    if not iso_str:
        return None
    return datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
