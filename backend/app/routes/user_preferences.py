from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.users import User
from app.services.auth import get_current_user
from app.services import user_preferences as service
from app.schemas.user_preferences import UserPreferencesResponse, UpdatePreferencesRequest

router = APIRouter(prefix="/preferences", tags=["User Preferences"])

@router.get("", response_model=UserPreferencesResponse)
def get_preferences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns the authenticated user's current preferences.
    """
    return service.get_preferences(db, current_user)


@router.put("", response_model=UserPreferencesResponse)
def update_preferences(
    body: UpdatePreferencesRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Partially updates preferences. Only fields included in the
    request body are changed — omitted fields are left untouched.
    """
    try:
        return service.update_preferences(
            db,
            current_user,
            default_repository_id=body.default_repository_id,
            default_date_range_days=body.default_date_range_days,
            digest_panel_expanded=body.digest_panel_expanded,
            is_onboarded=body.is_onboarded,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )