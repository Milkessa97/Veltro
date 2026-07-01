import pytest
from unittest.mock import patch
from app.config import settings
from app.services.encryption import encrypt_token, decrypt_token
from app.services.auth import create_jwt_token, verify_jwt_token

from cryptography.fernet import Fernet

from datetime import datetime, timezone, timedelta
import time

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
    
    # 1. Access Token Lifecycle
    access_token = create_jwt_token(user_id, token_type="access")
    assert isinstance(access_token, str)
    access_payload = verify_jwt_token(access_token, expected_type="access")
    assert access_payload is not None
    assert access_payload["sub"] == user_id
    assert access_payload["type"] == "access"
    
    # 2. Refresh Token Lifecycle
    refresh_token = create_jwt_token(user_id, token_type="refresh")
    assert isinstance(refresh_token, str)
    refresh_payload = verify_jwt_token(refresh_token, expected_type="refresh")
    assert refresh_payload is not None
    assert refresh_payload["sub"] == user_id
    assert refresh_payload["type"] == "refresh"
    
    # 3. Cross-token type rejection
    assert verify_jwt_token(access_token, expected_type="refresh") is None
    assert verify_jwt_token(refresh_token, expected_type="access") is None

def test_jwt_invalid_token():
    assert verify_jwt_token("invalid.token.value", expected_type="access") is None
    assert verify_jwt_token("invalid.token.value", expected_type="refresh") is None

def test_jwt_expired_token():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    
    # create a token that expires in 1 second
    with patch.object(settings, "ACCESS_TOKEN_EXPIRE_MINUTES", 1/60):
        token = create_jwt_token(user_id)
    
    time.sleep(2)  # wait for it to expire
    
    assert verify_jwt_token(token, expected_type="access") is None

def test_jwt_tampered_token():
    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")
    
    # a JWT is three base64 segments separated by dots
    # tamper with the payload segment (middle part)
    parts = token.split(".")
    parts[1] = parts[1][:-4] + "xxxx"  # corrupt the payload
    tampered = ".".join(parts)
    
    assert verify_jwt_token(tampered, expected_type="access") is None

def test_jwt_wrong_secret():
    import jwt as pyjwt
    
    # manually create a token signed with a fake secret
    fake_payload = {
        "sub": "550e8400-e29b-41d4-a716-446655440000",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
    }
    fake_token = pyjwt.encode(fake_payload, "wrong_secret_key", algorithm="HS256")
    
    assert verify_jwt_token(fake_token, expected_type="access") is None

def test_jwt_missing_sub():
    import jwt as pyjwt
    from app.config import settings
    
    payload = {
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=30)
        # deliberately no "sub"
    }
    token = pyjwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
    
    assert verify_jwt_token(token, expected_type="access") is None


def test_fernet_wrong_key():
    original = "gho_12345abcdefghijklmnopqrstuvwxyz"
    encrypted = encrypt_token(original)
    
    # generate a completely different key and try to decrypt with it
    different_key = Fernet.generate_key()
    different_fernet = Fernet(different_key)
    
    with pytest.raises(Exception):  # should raise InvalidToken
        different_fernet.decrypt(encrypted.encode())


def test_get_current_user_cookie():
    from unittest.mock import MagicMock
    from fastapi import HTTPException
    from app.services.auth import get_current_user
    from app.models.users import User

    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")

    mock_db = MagicMock()
    mock_user = User(id=user_id, github_login="test_user")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    # Test cookie auth
    user = get_current_user(access_token=token, credentials=None, db=mock_db)
    assert user == mock_user
    mock_db.query.return_value.filter.assert_called_once()


def test_get_current_user_header():
    from unittest.mock import MagicMock
    from fastapi.security import HTTPAuthorizationCredentials
    from app.services.auth import get_current_user
    from app.models.users import User

    user_id = "550e8400-e29b-41d4-a716-446655440000"
    token = create_jwt_token(user_id, token_type="access")

    mock_db = MagicMock()
    mock_user = User(id=user_id, github_login="test_user")
    mock_db.query.return_value.filter.return_value.first.return_value = mock_user

    credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)

    # Test header auth fallback
    user = get_current_user(access_token=None, credentials=credentials, db=mock_db)
    assert user == mock_user


def test_get_current_user_no_credentials():
    from fastapi import HTTPException
    from app.services.auth import get_current_user
    import pytest

    mock_db = MagicMock = None

    # Test raising 401 when no token is provided
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(access_token=None, credentials=None, db=mock_db)
    assert exc_info.value.status_code == 401