from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.config import settings
from app.db.session import get_db
from app.models.users import User
from app.models.user_preferences import UserPreferences
from app.services.encryption import encrypt_token
from app.services.auth import (
    exchange_github_code_for_token,
    fetch_github_user_info,
    create_jwt_token,
    verify_jwt_token,
    get_current_user
)

router = APIRouter()

@router.get("/login")
def login():
    """
    Redirects the user to the GitHub OAuth authorize page.
    """
    scope = "repo,read:user"
    github_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.GITHUB_CLIENT_ID}"
        f"&scope={scope}"
    )
    return RedirectResponse(url=github_url)

@router.get("/callback")
def callback(code: str, db: Session = Depends(get_db)):
    """
    Handles the GitHub OAuth redirect callback. Exchanges authorization code,
    creates/updates the user profile, and redirects to the frontend dashboard with a JWT.
    Also sets a long-lived refresh token in an HTTP-only cookie.
    """
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code missing"
        )
    
    # 1. Exchange code for GitHub access token
    access_token = exchange_github_code_for_token(code)
    
    # 2. Fetch user information from GitHub
    github_user = fetch_github_user_info(access_token)
    github_id = github_user.get("id")
    github_login = github_user.get("login")
    display_name = github_user.get("name") or github_login
    avatar_url = github_user.get("avatar_url")
    
    if not github_id or not github_login:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve complete user details from GitHub"
        )
        
    # 3. Encrypt the access token
    encrypted_token = encrypt_token(access_token)
    
    # 4. Check if user already exists
    user = db.query(User).filter(User.github_id == github_id).first()
    
    if user:
        # Update existing user info and token
        user.github_login = github_login
        user.display_name = display_name
        user.avatar_url = avatar_url
        user.github_token = encrypted_token
        user.last_login_at = func.now()
    else:
        # Create new user
        user = User(
            github_id=github_id,
            github_login=github_login,
            display_name=display_name,
            avatar_url=avatar_url,
            github_token=encrypted_token
        )
        db.add(user)
        db.flush()  # Flushes to DB to populate user.id UUID
        
        # Initialize UserPreferences
        preferences = UserPreferences(user_id=user.id)
        db.add(preferences)
        
    db.commit()
    db.refresh(user)
    
    # 5. Generate application JWT Access and Refresh tokens
    access_token_jwt = create_jwt_token(str(user.id), token_type="access")
    refresh_token_jwt = create_jwt_token(str(user.id), token_type="refresh")
    
    # 6. Redirect to Frontend Dashboard with access token in query params
    redirect_url = f"{settings.FRONTEND_URL}/dashboard?token={access_token_jwt}"
    response = RedirectResponse(url=redirect_url)
    
    # Set the refresh token as a secure, HTTP-only, SameSite=Strict cookie
    secure_cookie = settings.ENVIRONMENT != "development"
    response.set_cookie(
        key="refresh_token",
        value=refresh_token_jwt,
        httponly=True,
        secure=secure_cookie,
        samesite="strict",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        path="/auth"  # Restrict cookie transmission to auth endpoints
    )
    
    return response

@router.post("/refresh")
def refresh(refresh_token: Optional[str] = Cookie(None)):
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
    
    user_id = payload.get("sub")
    new_access_token = create_jwt_token(user_id, token_type="access")
    return {"access_token": new_access_token}

@router.post("/logout")
def logout():
    """
    Logs out the user by deleting the refresh token cookie.
    """
    response = JSONResponse(content={"message": "Successfully logged out"})
    response.delete_cookie(
        key="refresh_token",
        path="/auth",
        secure=settings.ENVIRONMENT != "development",
        httponly=True,
        samesite="strict"
    )
    return response

@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    """
    Returns details of the currently authenticated user.
    """
    return {
        "id": str(current_user.id),
        "github_id": current_user.github_id,
        "github_login": current_user.github_login,
        "display_name": current_user.display_name,
        "avatar_url": current_user.avatar_url,
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at
    }

