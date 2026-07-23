import hmac
import hashlib
import logging
from datetime import datetime, UTC
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.session import get_db
from app.models.repositories import Repositories
from app.models.webhook_events import WebhookEvent
import app.services.webhooks as webhook_service

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter(tags=["Webhooks"])


async def verify_signature(request: Request, x_hub_signature_256: str = Header(None)):
    if not settings.GITHUB_WEBHOOK_SECRET:
        # If no secret is configured, skip validation (useful for development)
        logger.warning("GITHUB_WEBHOOK_SECRET is not set. Webhook signature validation skipped.")
        return

    if not x_hub_signature_256:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Hub-Signature-256 header"
        )

    body = await request.body()
    mac = hmac.new(
        settings.GITHUB_WEBHOOK_SECRET.encode("utf-8"),
        body,
        hashlib.sha256
    )
    expected_signature = "sha256=" + mac.hexdigest()

    if not hmac.compare_digest(expected_signature, x_hub_signature_256):
        logger.warning("Invalid webhook signature received.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature"
        )


@router.post("/webhooks/github", status_code=status.HTTP_202_ACCEPTED)
async def github_webhook(
    request: Request,
    x_github_event: str = Header(...),
    x_github_delivery: str = Header(...),
    db: Session = Depends(get_db),
    _ = Depends(verify_signature)
):
    """
    Ingests GitHub webhook events, validates their signatures, and persists them
    to the database for asynchronous processing.
    """
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid JSON payload"
        )

    # Check for duplicate delivery to ensure idempotency
    existing_event = db.query(WebhookEvent).filter(
        WebhookEvent.github_delivery == x_github_delivery
    ).first()

    if existing_event:
        logger.warning(f"Delivery {x_github_delivery} already received for webhook event {x_github_event}")
        return {"status": "duplicate", "detail": f"Delivery {x_github_delivery} already received"}

    # Resolve repository by GitHub numeric ID — single authoritative lookup
    repo_github_id = payload.get("repository", {}).get("id")
    repository_id = None

    if repo_github_id is not None:
        repo = db.query(Repositories).filter(Repositories.github_id == repo_github_id).first()
        if repo:
            repository_id = repo.id
        else:
            logger.warning(f"Repository github_id={repo_github_id} not found in DB; event will be stored unlinked.")
    else:
        # Some events (e.g. installation_repositories) carry no repository object
        logger.debug(f"No repository payload in event {x_github_event}/{x_github_delivery}")

    # Persist the raw event immediately — before processing, so we never lose it
    action = payload.get("action")
    event = WebhookEvent(
        repository_id=repository_id,
        event_type=x_github_event,
        action=action,
        github_delivery=x_github_delivery,
        payload=payload,
        processed=False,
        received_at=datetime.now(UTC),
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Dispatch to the service layer, passing the already-resolved repository_id
    try:
        await webhook_service.handle_event(
            db=db,
            event_type=x_github_event,
            action=action,
            payload=payload,
            repository_id=repository_id,
        )
        event.processed = True
        db.commit()

    except Exception as e:
        logger.exception(f"Error processing webhook event {x_github_delivery}: {e}")
        event.error_message = str(e)
        db.commit()

    return {"status": "ok"}