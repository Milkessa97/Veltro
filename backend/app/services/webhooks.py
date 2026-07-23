import logging
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.commits import Commit
from app.models.contributors import Contributors
from app.models.pull_requests import PullRequests
from app.models.reviews import Review
from app.models.repositories import Repositories
from app.models.pull_request_reviewers import PullRequestReviewer

logger = logging.getLogger(__name__)


# ── Dispatcher ────────────────────────────────────────────────────────────────

async def handle_event(
    db: Session,
    event_type: str,
    action: str | None,
    payload: dict,
    repository_id: UUID | None,
):
    """
    Routes an already-persisted webhook event to the appropriate handler.

    `repository_id` is the UUID resolved by the route layer from the payload's
    numeric GitHub repository ID.  Handlers receive it directly — no second
    DB lookup against repo full_name is needed.
    """
    handlers = {
        "pull_request": handle_pull_request,
        "pull_request_review": handle_pull_request_review,
        "push": handle_push,
        "installation_repositories": handle_installation_repositories,
    }

    handler = handlers.get(event_type)
    if handler:
        await handler(db=db, action=action, payload=payload, repository_id=repository_id)
    else:
        logger.debug(f"No handler registered for event type '{event_type}' — skipping.")


# ── Handlers ──────────────────────────────────────────────────────────────────

async def handle_pull_request(
    db: Session,
    action: str | None,
    payload: dict,
    repository_id: UUID | None,
):
    """
    Handles PR lifecycle events (opened, closed, merged) and real-time
    review assignment changes (review_requested, review_request_removed).
    """
    if repository_id is None:
        return  # repo not connected to Veltro

    pr_data = payload.get("pull_request", {})
    pr_number = pr_data.get("number")
    opened_at = pr_data.get("created_at")

    # ── Review assignment events ──────────────────────────────────────────────
    if action == "review_requested":
        requested_reviewer = payload.get("requested_reviewer")
        if not requested_reviewer:
            return

        pr = (
            db.query(PullRequests)
            .filter(
                PullRequests.github_pr_number == pr_number,
                PullRequests.repository_id == repository_id,
            )
            .first()
        )
        if not pr:
            logger.debug(f"PR #{pr_number} not in DB for review_requested — skipping.")
            return

        reviewer = _upsert_contributor(db, requested_reviewer, repository_id)

        # Idempotent — only create if no record exists yet
        existing = (
            db.query(PullRequestReviewer)
            .filter(
                PullRequestReviewer.pull_request_id == pr.id,
                PullRequestReviewer.contributor_id == reviewer.id,
            )
            .first()
        )
        if not existing:
            db.add(PullRequestReviewer(
                pull_request_id=pr.id,
                contributor_id=reviewer.id,
                status="requested",
                requested_at=opened_at,
            ))
        db.commit()
        return

    if action == "review_request_removed":
        requested_reviewer = payload.get("requested_reviewer")
        if not requested_reviewer:
            return

        pr = (
            db.query(PullRequests)
            .filter(
                PullRequests.github_pr_number == pr_number,
                PullRequests.repository_id == repository_id,
            )
            .first()
        )
        if not pr:
            return

        reviewer = _upsert_contributor(db, requested_reviewer, repository_id)
        db.query(PullRequestReviewer).filter(
            PullRequestReviewer.pull_request_id == pr.id,
            PullRequestReviewer.contributor_id == reviewer.id,
            PullRequestReviewer.status == "requested",
        ).delete()
        db.commit()
        return

    # ── PR lifecycle events ───────────────────────────────────────────────────
    if action not in ("opened", "reopened", "closed", "merged"):
        return

    state = "merged" if pr_data.get("merged") else pr_data.get("state", "open")
    merged_at = pr_data.get("merged_at")
    closed_at = pr_data.get("closed_at") if state == "closed" else None

    existing_pr = (
        db.query(PullRequests)
        .filter(
            PullRequests.github_pr_number == pr_number,
            PullRequests.repository_id == repository_id,
        )
        .first()
    )

    if existing_pr:
        existing_pr.state = state
        existing_pr.merged_at = merged_at
        existing_pr.closed_at = closed_at
        db.add(existing_pr)
    else:
        author_data = pr_data.get("user", {})
        contributor = _upsert_contributor(db, author_data, repository_id)

        new_pr = PullRequests(
            repository_id=repository_id,
            author_id=contributor.id,
            github_pr_number=pr_number,
            title=pr_data.get("title"),
            state=state,
            opened_at=opened_at,
            merged_at=merged_at,
            closed_at=closed_at,
            additions=pr_data.get("additions", 0),
            deletions=pr_data.get("deletions", 0),
        )
        db.add(new_pr)

    db.commit()


async def handle_pull_request_review(
    db: Session,
    action: str | None,
    payload: dict,
    repository_id: UUID | None,
):
    """
    Handles review submitted events.
    """
    if action != "submitted" or repository_id is None:
        return

    review_data = payload.get("review", {})
    pr_data = payload.get("pull_request", {})

    pr = (
        db.query(PullRequests)
        .filter(
            PullRequests.github_pr_number == pr_data.get("number"),
            PullRequests.repository_id == repository_id,
        )
        .first()
    )

    if not pr:
        logger.debug(
            f"PR #{pr_data.get('number')} not found in repo {repository_id} — skipping review."
        )
        return

    reviewer_data = review_data.get("user", {})
    reviewer = _upsert_contributor(db, reviewer_data, repository_id)

    # Ensure a PullRequestReviewer record exists for whoever submitted this review.
    # If they were formally requested, they already have a record (status='requested'
    # or upgraded). If they reviewed organically (no assignment), create one now.
    existing_reviewer_row = (
        db.query(PullRequestReviewer)
        .filter(
            PullRequestReviewer.pull_request_id == pr.id,
            PullRequestReviewer.contributor_id == reviewer.id,
        )
        .first()
    )
    review_state = review_data.get("state", "").lower()
    submitted_at_str = review_data.get("submitted_at")

    if existing_reviewer_row:
        # Upgrade the status to the actual review outcome if a better state exists
        if existing_reviewer_row.status == "requested" and review_state in ("approved", "changes_requested", "commented"):
            existing_reviewer_row.status = review_state
    else:
        # Organic reviewer — not previously requested
        db.add(PullRequestReviewer(
            pull_request_id=pr.id,
            contributor_id=reviewer.id,
            status=f"unassigned_{review_state}" if review_state else "unassigned_commented",
            requested_at=submitted_at_str or pr_data.get("created_at"),
        ))

    # Idempotency: skip if we already have this review
    existing_review = (
        db.query(Review)
        .filter(Review.github_review_id == review_data.get("id"))
        .first()
    )

    if not existing_review:
        state = review_data.get("state", "").lower()
        # Guard against states not allowed by the DB check constraint
        if state not in ("approved", "changes_requested", "commented"):
            logger.warning(f"Unexpected review state '{state}' for review {review_data.get('id')} — skipping.")
            return

        review = Review(
            pull_request_id=pr.id,
            reviewer_id=reviewer.id,
            github_review_id=review_data.get("id"),
            state=state,
            submitted_at=review_data.get("submitted_at"),
        )
        db.add(review)

        # Set first_review_at on the PR if not already stamped
        if not pr.first_review_at:
            pr.first_review_at = review_data.get("submitted_at")

        db.commit()


async def handle_push(
    db: Session,
    action: str | None,
    payload: dict,
    repository_id: UUID | None,
):
    """
    Handles push events — extracts and persists commits.
    Only the first line of the commit message is stored.
    """
    if repository_id is None:
        return

    commits_data = payload.get("commits", [])

    for commit_data in commits_data:
        existing = (
            db.query(Commit)
            .filter(
                Commit.sha == commit_data.get("id"),
                Commit.repository_id == repository_id,
            )
            .first()
        )
        if existing:
            continue

        author_data = commit_data.get("author", {})
        contributor = _upsert_contributor(
            db,
            {
                "login": author_data.get("username") or author_data.get("name"),
                "id": None,  # push events don't include GitHub user ID
                "avatar_url": "",
            },
            repository_id,
        )

        message = commit_data.get("message", "")
        first_line = message.split("\n")[0][:500]

        commit = Commit(
            repository_id=repository_id,
            author_id=contributor.id,
            sha=commit_data.get("id"),
            message=first_line,
            committed_at=commit_data.get("timestamp"),
        )
        db.add(commit)

    db.commit()


async def handle_installation_repositories(
    db: Session,
    action: str | None,
    payload: dict,
    repository_id: UUID | None,  # not used — this event has no single repo
):
    """
    Handles repos being added to or removed from the GitHub App installation.
    This event operates on the installation level, not a single repository,
    so `repository_id` is intentionally unused here.
    """
    from app.models.users import User

    installation = payload.get("installation", {})
    installation_id = installation.get("id")

    user = (
        db.query(User)
        .filter(User.github_installation_id == installation_id)
        .first()
    )

    if not user:
        logger.warning(f"Installation {installation_id} has no matching user — skipping.")
        return

    if action == "added":
        for repo_data in payload.get("repositories_added", []):
            existing = (
                db.query(Repositories)
                .filter(
                    Repositories.github_id == repo_data.get("id"),
                    Repositories.user_id == user.id,
                )
                .first()
            )
            if not existing:
                full_name = repo_data.get("full_name", "/")
                owner, _, name = full_name.partition("/")
                repo = Repositories(
                    user_id=user.id,
                    github_id=repo_data.get("id"),
                    owner=owner,
                    name=name,
                    full_name=full_name,
                    is_private=repo_data.get("private", False),
                )
                db.add(repo)
        db.commit()

    elif action == "removed":
        for repo_data in payload.get("repositories_removed", []):
            db.query(Repositories).filter(
                Repositories.github_id == repo_data.get("id"),
                Repositories.user_id == user.id,
            ).delete()
        db.commit()


# ── Helpers ───────────────────────────────────────────────────────────────────

def _upsert_contributor(db: Session, user_data: dict, repository_id: UUID) -> Contributors:
    """
    Returns an existing contributor record or creates a new one.
    Matched first by github_id (when available), then falls back to github_login.
    """
    github_id = user_data.get("id")
    github_login = user_data.get("login") or "unknown"

    if github_id is not None:
        existing = (
            db.query(Contributors)
            .filter(
                Contributors.github_id == github_id,
                Contributors.repository_id == repository_id,
            )
            .first()
        )
    else:
        # Push events provide login but no numeric ID
        existing = (
            db.query(Contributors)
            .filter(
                Contributors.github_login == github_login,
                Contributors.repository_id == repository_id,
            )
            .first()
        )

    if existing:
        return existing

    contributor = Contributors(
        repository_id=repository_id,
        github_id=github_id,
        github_login=github_login,
        display_name=user_data.get("name") or github_login,
        avatar_url=user_data.get("avatar_url", ""),
    )
    db.add(contributor)
    db.flush()  # get .id without committing the outer transaction
    return contributor