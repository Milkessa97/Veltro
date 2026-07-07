from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db.session import get_db
from app.main import app
from app.models.token_blocklist import TokenBlocklist
from app.models.users import User
from app.services.auth import (
    create_jwt_token,
    get_current_user,
    verify_jwt_token,
)
from app.services.encryption import decrypt_token, encrypt_token

import time

settings = get_settings()


def test_fernet_encryption_decryption():
    original_token = "gho_12345abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_token(original_token)
    assert encrypted != original_token

    decrypted = decrypt_token(encrypted)
    assert decrypted == original_token


def test_fernet_empty_token():
    assert encrypt_token("") == ""
    assert decrypt_token("") == ""


def test_jwt_lifecycle():
    user_id = "550e8400-e29b-41d4-a716-446655440000"

    access_token = create_jwt_token(user_id, token_type="access")
    assert isinstance(access_token, str)

    access_payload = verify_jwt_token(access_token, expected_type="access")
    assert access_payload is not None
    assert access_payload["sub"] == user_id
    assert access_payload["type"] == "access"

    refresh_token = create_jwt_token(user_id, token_type="refresh")
    assert isinstance(refresh_token, str)

    refresh_payload = verify_jwt_token(refresh_token, expected_type="refresh")
    assert refresh_payload is not None
    assert refresh_payload["sub"] == user_id
    assert refresh_payload["type"] == "refresh"

    assert verify_jwt_token(access_token, expected_type="refresh") is None
    assert verify_jwt_token(refresh_token, expected_type="access") is None


def test_jwt_invalid_token():
    assert verify_jwt_token("invalid.token.value", expected_type="access") is None
    assert verify_jwt_token("invalid.token.value", expected_type="refresh") is None


def test_jwt_expired_token():
    user_id = "550e8400-e29b-41d4-a716-446655440000"

    # 1/60 minute = 1 second lifetime; sleep 2s so it is definitely expired
    with patch("app.services.auth.settings.ACCESS_TOKEN_EXPIRE_MINUTES", 1 / 60):
        token = create_jwt_token(user_id)

    time.sleep(2)

    assert verify_jwt_token(token, expected_type="access") is None


def test_jwt_tampered_token():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")

    parts = token.split(".")
    parts[1] = parts[1][:-4] + "xxxx"
    tampered = ".".join(parts)

    assert verify_jwt_token(tampered, expected_type="access") is None


def test_jwt_wrong_secret():
    fake_payload = {
        "sub": "550e8400-e29b-41d4-a716-446655440000",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }

    fake_token = pyjwt.encode(fake_payload, "wrong_secret_key", algorithm="HS256")

    assert verify_jwt_token(fake_token, expected_type="access") is None


def test_jwt_missing_sub():
    payload = {
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }

    token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

    assert verify_jwt_token(token, expected_type="access") is None


def test_fernet_wrong_key():
    original = "gho_12345abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_token(original)

    different_key = Fernet.generate_key()
    different_fernet = Fernet(different_key)

    with pytest.raises(InvalidToken):
        different_fernet.decrypt(encrypted.encode())


def test_get_current_user_cookie():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")

    mock_user = User(id=user_id, github_login="test_user")

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is TokenBlocklist:
            mock_q.filter.return_value.first.return_value = None
        else:
            mock_q.filter.return_value.first.return_value = mock_user
        return mock_q

    mock_db = MagicMock()
    mock_db.query.side_effect = query_side_effect

    user = get_current_user(access_token=token, credentials=None, db=mock_db)
    assert user == mock_user


def test_get_current_user_header():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")

    mock_user = User(id=user_id, github_login="test_user")

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is TokenBlocklist:
            mock_q.filter.return_value.first.return_value = None
        else:
            mock_q.filter.return_value.first.return_value = mock_user
        return mock_q

    mock_db = MagicMock()
    mock_db.query.side_effect = query_side_effect

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    user = get_current_user(access_token=None, credentials=credentials, db=mock_db)
    assert user == mock_user


def test_get_current_user_no_credentials():
    mock_db = None

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token=None, credentials=None, db=mock_db)

    assert exc_info.value.status_code == 401


def test_login_endpoint():
    client = TestClient(app)

    response = client.get("/auth/login", follow_redirects=False)

    assert response.status_code == 307
    location = response.headers.get("location")
    assert "https://github.com/login/oauth/authorize" in location
    assert "state=" in location

    assert "oauth_state" in response.cookies
    cookie_value = response.cookies.get("oauth_state")
    assert cookie_value is not None
    assert f"state={cookie_value}" in location


def test_callback_endpoint_state_mismatch():
    client = TestClient(app)

    response = client.get("/auth/callback?code=mock_code")
    assert response.status_code == 400
    assert "state mismatch or expired" in response.json()["detail"].lower()

    client.cookies.set("oauth_state", "expected_state")
    response = client.get("/auth/callback?code=mock_code&state=different_state")

    assert response.status_code == 400
    assert "state mismatch or expired" in response.json()["detail"].lower()


@patch("app.routes.auth.exchange_github_code_for_token")
@patch("app.routes.auth.fetch_github_user_info")
def test_callback_endpoint_success(mock_fetch_info, mock_exchange):
    mock_exchange.return_value = "mock_github_token"
    mock_fetch_info.return_value = {
        "id": 12345,
        "login": "testuser",
        "name": "Test User",
        "avatar_url": "https://avatar.url"
    }

    mock_db = MagicMock()
    mock_user = User(
        id="550e8400-e29b-41d4-a716-446655440000",
        github_login="testuser",
        github_id=12345
    )

    from app.models.user_preferences import UserPreferences as UP
    mock_prefs = UP(
        user_id="550e8400-e29b-41d4-a716-446655440000",
        is_onboarded=False
    )

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is UP:
            mock_q.filter.return_value.first.return_value = mock_prefs
        else:
            mock_q.filter.return_value.first.return_value = mock_user
        return mock_q

    mock_db.query.side_effect = query_side_effect

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        client = TestClient(app)
        state_val = "secure_state_token"
        client.cookies.set("oauth_state", state_val)

        response = client.get(
            f"/auth/callback?code=mock_code&state={state_val}",
            follow_redirects=False
        )

        assert response.status_code == 307
        # is_onboarded=False → user goes to /onboarding
        assert response.headers.get("location") == f"{settings.FRONTEND_URL}/onboarding"
        assert "access_token" in response.cookies
        assert "refresh_token" in response.cookies

    finally:
        app.dependency_overrides.pop(get_db, None)


@patch("app.routes.auth.exchange_github_code_for_token")
@patch("app.routes.auth.fetch_github_user_info")
def test_callback_endpoint_redirects_to_dashboard_when_onboarded(mock_fetch_info, mock_exchange):
    """A returning user with is_onboarded=True should land on /dashboard."""
    mock_exchange.return_value = "mock_github_token"
    mock_fetch_info.return_value = {
        "id": 12345,
        "login": "testuser",
        "name": "Test User",
        "avatar_url": "https://avatar.url"
    }

    mock_db = MagicMock()
    mock_user = User(
        id="550e8400-e29b-41d4-a716-446655440000",
        github_login="testuser",
        github_id=12345
    )

    from app.models.user_preferences import UserPreferences as UP
    mock_prefs = UP(
        user_id="550e8400-e29b-41d4-a716-446655440000",
        is_onboarded=True
    )

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is UP:
            mock_q.filter.return_value.first.return_value = mock_prefs
        else:
            mock_q.filter.return_value.first.return_value = mock_user
        return mock_q

    mock_db.query.side_effect = query_side_effect

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        client = TestClient(app)
        state_val = "secure_state_token"
        client.cookies.set("oauth_state", state_val)

        response = client.get(
            f"/auth/callback?code=mock_code&state={state_val}",
            follow_redirects=False
        )

        assert response.status_code == 307
        assert response.headers.get("location") == f"{settings.FRONTEND_URL}/dashboard"

    finally:
        app.dependency_overrides.pop(get_db, None)