import hmac
import hashlib
from app.config import get_settings
from app.models.webhook_events import WebhookEvent

settings = get_settings()

def test_github_webhook_invalid_signature(client):
    original_secret = settings.GITHUB_WEBHOOK_SECRET
    settings.GITHUB_WEBHOOK_SECRET = "test_secret"
    try:
        response = client.post(
            "/webhooks/github",
            json={"repository": {"id": 12345}},
            headers={
                "X-GitHub-Event": "push",
                "X-GitHub-Delivery": "delivery-id-1",
                "X-Hub-Signature-256": "sha256=invalid"
            }
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid signature"
    finally:
        settings.GITHUB_WEBHOOK_SECRET = original_secret

def test_github_webhook_success(client, db):
    original_secret = settings.GITHUB_WEBHOOK_SECRET
    settings.GITHUB_WEBHOOK_SECRET = "test_secret"
    try:
        payload = {"repository": {"id": 12345}, "action": "opened"}
        body = b'{"repository": {"id": 12345}, "action": "opened"}'
        
        # Calculate valid signature
        mac = hmac.new(b"test_secret", body, hashlib.sha256)
        signature = "sha256=" + mac.hexdigest()
        
        response = client.post(
            "/webhooks/github",
            content=body,
            headers={
                "X-GitHub-Event": "pull_request",
                "X-GitHub-Delivery": "delivery-unique-uuid",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )
        
        assert response.status_code == 202
        assert response.json()["status"] == "ok"
        
        event = db.query(WebhookEvent).filter(
            WebhookEvent.github_delivery == "delivery-unique-uuid"
        ).first()
        assert event is not None
        assert event.event_type == "pull_request"
        assert event.action == "opened"
        assert event.payload == payload
        assert event.processed is True
        
    finally:
        settings.GITHUB_WEBHOOK_SECRET = original_secret

def test_github_webhook_duplicate(client, db):
    original_secret = settings.GITHUB_WEBHOOK_SECRET
    settings.GITHUB_WEBHOOK_SECRET = "test_secret"
    try:
        body = b'{"repository": {"id": 12345}}'
        mac = hmac.new(b"test_secret", body, hashlib.sha256)
        signature = "sha256=" + mac.hexdigest()
        
        # Send first time
        response1 = client.post(
            "/webhooks/github",
            content=body,
            headers={
                "X-GitHub-Event": "push",
                "X-GitHub-Delivery": "duplicate-delivery-id",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )
        assert response1.status_code == 202
        
        # Send second time
        response2 = client.post(
            "/webhooks/github",
            content=body,
            headers={
                "X-GitHub-Event": "push",
                "X-GitHub-Delivery": "duplicate-delivery-id",
                "X-Hub-Signature-256": signature,
                "Content-Type": "application/json"
            }
        )
        assert response2.status_code == 202
        assert response2.json()["status"] == "duplicate"
        
    finally:
        settings.GITHUB_WEBHOOK_SECRET = original_secret
