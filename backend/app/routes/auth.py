from typing import Optional
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.config import get_settings, Settings
from app.db.session import get_db
from app.models.users import User
from app.models.user_preferences import UserPreferences
from app.models.token_blocklist import TokenBlocklist
from app.services.encryption import encrypt_token
from app.services.auth import (
    exchange_github_code_for_token,
    fetch_github_user_info,
    create_jwt_token,
    verify_jwt_token,
    get_current_user,
    purge_expired_blocklist
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/login")
def login(settings: Settings = Depends(get_settings)):
    """
    Redirects the user to the GitHub OAuth authorize page with a secure state parameter.
    """
    import secrets
    state = secrets.token_urlsafe(32)
    scope = "read:user"

    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&state={state}"
        f"&scope={scope}"
    )

    response = RedirectResponse(url=github_url)

    secure_cookie = settings.ENVIRONMENT != "development"

    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=300,
        path=f"{settings.COOKIE_PATH_PREFIX}/auth"
    )

    return response


@router.get("/callback")
def callback(
    code: Optional[str] = None,
    state: Optional[str] = None,
    installation_id: Optional[int] = None,
    oauth_state: Optional[str] = Cookie(None),
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """
    Handles the GitHub OAuth redirect callback. Verification of state prevents CSRF.
    Exchanges authorization code, creates/updates the user profile, and redirects
    to the frontend dashboard or installation flow.
    """
    user = None

    if not code:
        # If code is missing, we check if this is an installation redirect
        # and if the user is already authenticated via cookies.
        if installation_id and access_token:
            payload = verify_jwt_token(access_token)
            if payload:
                user_id = payload.get("sub")
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    user.github_installation_id = installation_id
                    db.commit()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Authorization code missing or session expired."
            )
    else:
        # Verification of state prevents CSRF.
        # Bypassed if redirecting from GitHub App installation, as GitHub does not pass state in that flow.
        if not installation_id:
            if not state or not oauth_state or state != oauth_state:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="OAuth state mismatch or expired. Potential CSRF attack."
                )

        access_token_github = exchange_github_code_for_token(code)
        github_user = fetch_github_user_info(access_token_github)

        github_id = github_user.get("id")
        github_login = github_user.get("login")
        display_name = github_user.get("name") or github_login
        avatar_url = github_user.get("avatar_url")

        if not github_id or not github_login:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve complete user details from GitHub"
            )

        encrypted_token = encrypt_token(access_token_github)

        user = db.query(User).filter(User.github_id == github_id).first()

        if user:
            user.github_login = github_login
            user.display_name = display_name
            user.avatar_url = avatar_url
            user.github_token = encrypted_token
            user.last_login_at = func.now()

            if installation_id is not None:
                user.github_installation_id = installation_id
        else:
            user = User(
                github_id=github_id,
                github_login=github_login,
                display_name=display_name,
                avatar_url=avatar_url,
                github_token=encrypted_token,
                github_installation_id=installation_id
            )
            db.add(user)
            db.flush()

            preferences = UserPreferences(user_id=user.id)
            db.add(preferences)

        db.commit()
        db.refresh(user)

    # Automatically sync repositories on login if the installation ID is present
    if user.github_installation_id:
        try:
            from app.services.repositories import sync_repositories
            sync_repositories(db, user)
        except Exception as e:
            logger.error(f"Failed to auto-sync repositories on login for user {user.id}: {str(e)}")

    # Determine onboarding status to route the user correctly
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == user.id).first()
    is_onboarded = preferences.is_onboarded if preferences else False

    # Route the user depending on their installation status and onboarding status
    if not user.github_installation_id:
        # Redirect to the GitHub App installation page
        redirect_url = f"https://github.com/apps/{settings.GITHUB_APP_SLUG}/installations/new"
    else:
        destination = "dashboard" if is_onboarded else "onboarding"
        redirect_url = f"{settings.FRONTEND_URL}/{destination}"

    access_token_jwt = create_jwt_token(str(user.id), token_type="access")
    refresh_token_jwt = create_jwt_token(str(user.id), token_type="refresh")

    response = RedirectResponse(url=redirect_url)

    secure_cookie = settings.ENVIRONMENT != "development"

    response.delete_cookie(
        key="oauth_state",
        path=f"{settings.COOKIE_PATH_PREFIX}/auth",
        secure=secure_cookie,
        httponly=True,
        samesite="lax"
    )

    response.set_cookie(
        key="access_token",
        value=access_token_jwt,
        httponly=True,
        secure=secure_cookie,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token_jwt,
        httponly=True,
        secure=secure_cookie,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path=f"{settings.COOKIE_PATH_PREFIX}/auth"
    )

    return response


@router.post("/refresh")
def refresh(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """
    Exchanges a valid refresh token cookie for a new short-lived access token.
    """
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing"
        )

    payload = verify_jwt_token(refresh_token, expected_type="refresh")
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    jti = payload.get("jti")
    if not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing jti claim"
        )
    
    if db.query(TokenBlocklist).filter(TokenBlocklist.jti == jti).first():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked"
        )

    user_id = payload.get("sub")
    new_access_token = create_jwt_token(user_id, token_type="access")

    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=settings.ENVIRONMENT != "development",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )

    return {"message": "Token refreshed"}


@router.post("/logout")
def logout(
    response: Response,
    access_token: Optional[str] = Cookie(None),
    refresh_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings)
):
    """
    Logs out the user by blocking tokens and deleting cookies.
    """
    secure_cookie = settings.ENVIRONMENT != "development"

    if access_token:
        payload = verify_jwt_token(access_token, expected_type="access")
        if payload and payload.get("jti"):
            db.add(TokenBlocklist(jti=payload["jti"]))

    if refresh_token:
        payload = verify_jwt_token(refresh_token, expected_type="refresh")
        if payload and payload.get("jti"):
            db.add(TokenBlocklist(jti=payload["jti"]))

    purge_expired_blocklist(db)
    db.commit()

    response.delete_cookie(
        key="refresh_token",
        path=f"{settings.COOKIE_PATH_PREFIX}/auth",
        secure=secure_cookie,
        httponly=True,
        samesite="strict"
    )

    response.delete_cookie(
        key="access_token",
        path="/",
        secure=secure_cookie,
        httponly=True,
        samesite="lax"
    )

    return {"message": "Successfully logged out"}


@router.get("/me")
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns details of the currently authenticated user, including their
    onboarding status so the frontend can redirect to the preferences page
    on first sign-up.
    """
    preferences = db.query(UserPreferences).filter(
        UserPreferences.user_id == current_user.id
    ).first()
    is_onboarded = preferences.is_onboarded if preferences else False

    return {
        "id": str(current_user.id),
        "github_id": current_user.github_id,
        "github_login": current_user.github_login,
        "display_name": current_user.display_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at,
        "is_onboarded": is_onboarded
    }