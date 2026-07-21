import logging
from datetime import datetime, timezone
from uuid import UUID
from typing import List, Tuple
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.models.users import User
from app.models.contributors import Contributors
from app.models.digest import Digest
from app.services.auth import get_current_user
from app.services.encryption import decrypt_token
from app.services import user_preferences as prefs_service
from app.services import digest as digest_service
from app.services import ai as ai_service
from app.config import get_settings
from app.schemas.digest import DigestResponse, BottleneckExplanationResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/digest", tags=["Digests"])
settings = get_settings()


def get_gemini_api_key(db: Session, user: User) -> Tuple[str, str]:
    """
    Retrieves the Gemini API key from the user's preferences, or falls back
    to the system environment key.
    Returns a tuple of (api_key, key_source), where key_source is either "user" or "system".
    """
    prefs = prefs_service.get_preferences(db, user)
    if prefs.gemini_api_key:
        try:
            decrypted = decrypt_token(prefs.gemini_api_key)
            if decrypted:
                return decrypted, "user"
        except Exception as e:
            logger.error(f"Failed to decrypt user Gemini API key: {str(e)}")

    # Fallback to system key
    fallback_key = settings.GEMINI_API_KEY
    if fallback_key:
        return fallback_key, "system"

    raise HTTPException(
        status_code=status.HTTP_402_PAYMENT_REQUIRED,
        detail="API key required. Add your Gemini API key in Settings.",
    )


def handle_gemini_exception(e: Exception, key_source: str):
    """
    Translates Gemini exceptions into FastAPI HTTPExceptions based on the key source.
    """
    err_str = str(e).lower()
    is_quota = "quota" in err_str or "limit" in err_str or "exhausted" in err_str or "429" in err_str

    if is_quota:
        if key_source == "system":
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="API key required. Add your Gemini API key in Settings.",
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Gemini API limit exceeded. Please check your quota or try again later.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service temporarily unavailable",
        )


@router.get("/{repository_id}/weekly", response_model=DigestResponse)
def get_weekly_digest(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Checks for a fresh cached weekly digest.
    If not found, builds the repository metrics payload, generates a digest
    via Gemini AI, caches the result in the database, and returns it.
    """
    # 1. Check for fresh cached digest
    cached = digest_service.get_fresh_digest(db, current_user, repository_id, "weekly")
    if cached:
        return cached

    # 2. Key retrieval and validation
    api_key, key_source = get_gemini_api_key(db, current_user)

    # 3. Build metrics payload
    try:
        metrics = digest_service.build_metrics_payload(db, repository_id, days=7)
    except Exception as e:
        logger.error(f"Failed to build metrics payload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compile repository metrics.",
        )

    # 4. Generate AI Digest
    try:
        content = ai_service.generate_digest(metrics, api_key)
    except Exception as e:
        handle_gemini_exception(e, key_source)

    # 5. Store and return
    digest = digest_service.create_digest(
        db,
        user_id=current_user.id,
        repository_id=repository_id,
        content=content,
        period_start=metrics["period_start"],
        period_end=metrics["period_end"],
        digest_type="weekly",
    )
    return digest


@router.post("/{repository_id}/regenerate", response_model=DigestResponse)
def regenerate_digest(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Forces a new weekly digest generation regardless of cache.
    Marks any existing fresh digests as stale first.
    """
    # 1. Retrieve key
    api_key, key_source = get_gemini_api_key(db, current_user)

    # 2. Mark existing weekly digests as stale
    db.query(Digest).filter(
        Digest.user_id == current_user.id,
        Digest.repository_id == repository_id,
        Digest.type == "weekly",
    ).update({Digest.is_stale: True})
    db.commit()

    # 3. Build metrics payload
    try:
        metrics = digest_service.build_metrics_payload(db, repository_id, days=7)
    except Exception as e:
        logger.error(f"Failed to build metrics payload: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to compile repository metrics.",
        )

    # 4. Generate AI Digest
    try:
        content = ai_service.generate_digest(metrics, api_key)
    except Exception as e:
        handle_gemini_exception(e, key_source)

    # 5. Store and return
    digest = digest_service.create_digest(
        db,
        user_id=current_user.id,
        repository_id=repository_id,
        content=content,
        period_start=metrics["period_start"],
        period_end=metrics["period_end"],
        digest_type="weekly",
    )
    return digest


@router.get("/{repository_id}/bottleneck/{github_login}", response_model=BottleneckExplanationResponse)
def get_bottleneck_explanation(
    repository_id: UUID,
    github_login: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Fetches the contributor's pending review data from the database and calls
    Gemini AI to generate a neutral context-aware bottleneck explanation.
    Does NOT cache.
    """
    # 1. Retrieve key
    api_key, key_source = get_gemini_api_key(db, current_user)

    # 2. Query contributor
    contrib = db.query(Contributors).filter(
        Contributors.repository_id == repository_id,
        Contributors.github_login == github_login,
    ).first()
    if not contrib:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contributor '{github_login}' not found in this repository.",
        )

    # 3. Fetch pending review statistics
    try:
        pending_res = db.execute(
            text("""
                SELECT COUNT(*),
                       COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - prr.requested_at)) / 86400.0), 0.0)
                FROM pull_request_reviewers prr
                JOIN pull_requests pr ON prr.pull_request_id = pr.id
                WHERE pr.repository_id = :repo_id
                  AND prr.contributor_id = :contrib_id
                  AND prr.status = 'requested'
            """),
            {"repo_id": repository_id, "contrib_id": contrib.id}
        ).first()

        pending_count = pending_res[0] if pending_res else 0
        avg_wait_days = round(float(pending_res[1]), 1) if pending_res else 0.0
    except Exception as e:
        logger.error(f"Failed to query contributor bottleneck metrics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to query contributor bottleneck metrics.",
        )

    contributor_data = {
        "login": github_login,
        "pending_reviews": pending_count,
        "avg_pending_days": avg_wait_days,
    }

    # 4. Generate bottleneck explanation
    try:
        explanation = ai_service.generate_bottleneck_explanation(contributor_data, api_key)
    except Exception as e:
        handle_gemini_exception(e, key_source)

    return BottleneckExplanationResponse(
        contributor_login=github_login,
        explanation=explanation,
        generated_at=datetime.now(timezone.utc),
    )


@router.get("/{repository_id}/history", response_model=List[DigestResponse])
def get_digest_history(
    repository_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the last 20 generated digests for this repository, newest first.
    """
    return digest_service.get_digest_history(db, current_user.id, repository_id, limit=20)
