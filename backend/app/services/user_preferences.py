from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional

from app.models.user_preferences import UserPreferences
from app.models.users import User


def get_preferences(db: Session, user: User) -> UserPreferences:
    """
    Returns the preferences row for the given user.
    Creates a default row defensively if one doesn't exist.
    """
    prefs = db.query(UserPreferences)\
        .filter(UserPreferences.user_id == user.id)\
        .first()

    if not prefs:
        prefs = UserPreferences(user_id=user.id)
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return prefs


def update_preferences(
    db: Session,
    user: User,
    default_repository_id: Optional[UUID] = None,
    default_date_range_days: Optional[int] = None,
    digest_panel_expanded: Optional[bool] = None,
) -> UserPreferences:
    """
    Partially updates user preferences.
    Only fields explicitly passed are changed — None means untouched.
    """
    prefs = get_preferences(db, user)

    if default_repository_id is not None:
        prefs.default_repository_id = default_repository_id

    if default_date_range_days is not None:
        if default_date_range_days not in (7, 30, 90):
            raise ValueError(
                f"Invalid date range: {default_date_range_days}. Must be 7, 30, or 90."
            )
        prefs.default_date_range_days = default_date_range_days

    if digest_panel_expanded is not None:
        prefs.digest_panel_expanded = digest_panel_expanded

    db.commit()
    db.refresh(prefs)
    return prefs