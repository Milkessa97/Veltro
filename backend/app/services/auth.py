import uuid
import jwt
import httpx
from datetime import datetime, timedelta, UTC
from typing import Optional

from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import get_settings
from app.db.session import get_db
from app.models.users import User
from app.models.token_blocklist import TokenBlocklist

settings = get_settings()

JWT_ALGORITHM = settings.JWT_ALGORITHM

security = HTTPBearer(auto_error=False)


def create_jwt_token(user_id: str, token_type: str = "access") -> str:
    now = datetime.now(UTC)

    if token_type == "access":
        expiry = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    elif token_type == "refresh":
        expiry = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    else:
        raise ValueError(f"Invalid token type: {token_type}")

    payload = {
        "sub": str(user_id),
        "jti": str(uuid.uuid4()),
        "type": token_type,
        "exp": expiry,
        "iat": now
    }

    return jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)


def verify_jwt_token(token: str, expected_type: str = "access") -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[JWT_ALGORITHM])

        if payload.get("type") != expected_type:
            return None

        if not payload.get("sub"):
            return None

        return payload

    except jwt.PyJWTError:
        return None


def purge_expired_blocklist(db: Session) -> int:
    cutoff = datetime.now(UTC) - timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    deleted = (
        db.query(TokenBlocklist)
        .filter(TokenBlocklist.blocked_at < cutoff)
        .delete(synchronize_session=False)
    )

    return deleted


def exchange_github_code_for_token(code: str) -> str:
    url = "https://github.com/login/oauth/access_token"
    headers = {"Accept": "application/json"}

    data = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "client_secret": settings.GITHUB_CLIENT_SECRET,
        "code": code
    }

    with httpx.Client() as client:
        response = client.post(url, headers=headers, data=data)
        response.raise_for_status()
        res_data = response.json()

        if "access_token" not in res_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub OAuth error: {res_data.get('error_description', 'No access token returned')}"
            )

        return res_data["access_token"]


def fetch_github_user_info(github_token: str) -> dict:
    url = "https://api.github.com/user"

    headers = {
        "Authorization": f"token {github_token}",
        "Accept": "application/vnd.github.v3+json"
    }

    with httpx.Client() as client:
        response = client.get(url, headers=headers)

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to fetch user info from GitHub"
            )

        return response.json()


def get_current_user(
    access_token: Optional[str] = Cookie(None),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:

    token = access_token or (credentials.credentials if credentials else None)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_jwt_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    jti = payload.get("jti")
    if jti and db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user identification claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user