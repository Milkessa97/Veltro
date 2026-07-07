# backend/app/tests/test_preferences.py

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.users import User
from app.models.user_preferences import UserPreferences
from app.services.auth import create_jwt_token


# ── Helpers ──────────────────────────────────────────────────────

def create_test_user(db: Session) -> User:
    user = User(
        github_id=123456,
        github_login="testuser",
        display_name="Test User",
        avatar_url="https://github.com/testuser.png",
        github_token="encrypted_fake_token",
    )
    db.add(user)
    db.flush()

    prefs = UserPreferences(user_id=user.id)
    db.add(prefs)
    db.commit()
    db.refresh(user)
    return user


def auth_headers(user: User) -> dict:
    token = create_jwt_token(str(user.id), token_type="access")
    return {"Authorization": f"Bearer {token}"}


# ── GET /preferences ─────────────────────────────────────────────

def test_get_preferences_returns_defaults(client: TestClient, db: Session):
    user = create_test_user(db)

    response = client.get("/preferences", headers=auth_headers(user))

    assert response.status_code == 200
    data = response.json()
    assert data["default_date_range_days"] == 30
    assert data["digest_panel_expanded"]
    assert data["default_repository_id"] is None
    assert not data["is_onboarded"]  # new users start un-onboarded


def test_get_preferences_requires_auth(client: TestClient):
    response = client.get("/preferences")
    assert response.status_code == 401


def test_get_preferences_creates_row_if_missing(client: TestClient,db: Session):
    """
    Defensive test — if a user somehow has no preferences row,
    GET /preferences should create one rather than returning 404.
    """
    user = User(
        github_id=999999,
        github_login="noprefuser",
        display_name="No Prefs",
        avatar_url="https://github.com/noprefuser.png",
        github_token="encrypted_fake_token",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # no UserPreferences row created — deliberate

    response = client.get("/preferences", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json()["default_date_range_days"] == 30

    # confirm the row was actually created in the DB
    prefs = db.query(UserPreferences)\
        .filter(UserPreferences.user_id == user.id)\
        .first()
    assert prefs is not None


# ── PUT /preferences ─────────────────────────────────────────────

def test_update_date_range(client: TestClient, db: Session):
    user = create_test_user(db)

    response = client.put(
        "/preferences",
        json={"default_date_range_days": 7},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    assert response.json()["default_date_range_days"] == 7


def test_update_digest_panel(client: TestClient,db: Session):
    user = create_test_user(db)

    response = client.put(
        "/preferences",
        json={"digest_panel_expanded": False},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    assert not response.json()["digest_panel_expanded"]


def test_partial_update_leaves_other_fields_unchanged(client: TestClient, db: Session):
    user = create_test_user(db)

    # first set both fields
    client.put(
        "/preferences",
        json={"default_date_range_days": 90, "digest_panel_expanded": False},
        headers=auth_headers(user)
    )

    # now update only one field
    response = client.put(
        "/preferences",
        json={"default_date_range_days": 7},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["default_date_range_days"] == 7
    assert not data["digest_panel_expanded"]  # unchanged


def test_update_invalid_date_range_returns_422(client: TestClient, db: Session):
    user = create_test_user(db)

    response = client.put(
        "/preferences",
        json={"default_date_range_days": 45},
        headers=auth_headers(user)
    )

    assert response.status_code == 422


def test_update_all_valid_date_ranges(client: TestClient,db: Session):
    """Confirm all three allowed values are accepted."""
    user = create_test_user(db)

    for days in [7, 30, 90]:
        response = client.put(
            "/preferences",
            json={"default_date_range_days": days},
            headers=auth_headers(user)
        )
        assert response.status_code == 200
        assert response.json()["default_date_range_days"] == days


def test_update_preferences_requires_auth(client: TestClient):
    response = client.put(
        "/preferences",
        json={"default_date_range_days": 7}
    )
    assert response.status_code == 401


def test_update_empty_body_changes_nothing(client: TestClient, db: Session):
    """
    Sending an empty body should succeed and leave all fields unchanged.
    This confirms the partial update logic handles all-None correctly.
    """
    user = create_test_user(db)

    # set a known state first
    client.put(
        "/preferences",
        json={"default_date_range_days": 90},
        headers=auth_headers(user)
    )

    # send empty body
    response = client.put(
        "/preferences",
        json={},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    assert response.json()["default_date_range_days"] == 90


def test_users_cannot_see_each_others_preferences(client: TestClient, db: Session):
    """
    Data isolation — two users should always get their own preferences,
    never each other's.
    """
    user_a = create_test_user(db)

    user_b = User(
        github_id=654321,
        github_login="userb",
        display_name="User B",
        avatar_url="https://github.com/userb.png",
        github_token="encrypted_fake_token_b",
    )
    db.add(user_b)
    db.flush()
    db.add(UserPreferences(user_id=user_b.id))
    db.commit()
    db.refresh(user_b)

    # set user_a's date range to 7
    client.put(
        "/preferences",
        json={"default_date_range_days": 7},
        headers=auth_headers(user_a)
    )

    # user_b should still see the default 30
    response = client.get("/preferences", headers=auth_headers(user_b))
    assert response.json()["default_date_range_days"] == 30


def test_update_is_onboarded(client: TestClient, db: Session):
    """Setting is_onboarded=True should persist and be returned."""
    user = create_test_user(db)

    response = client.put(
        "/preferences",
        json={"is_onboarded": True},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    assert response.json()["is_onboarded"]


def test_partial_update_does_not_reset_is_onboarded(client: TestClient, db: Session):
    """
    A subsequent partial update that omits is_onboarded should not
    flip it back to False.
    """
    user = create_test_user(db)

    # mark onboarded
    client.put(
        "/preferences",
        json={"is_onboarded": True},
        headers=auth_headers(user)
    )

    # update a different field
    response = client.put(
        "/preferences",
        json={"default_date_range_days": 7},
        headers=auth_headers(user)
    )

    assert response.status_code == 200
    data = response.json()
    assert data["default_date_range_days"] == 7
    assert data["is_onboarded"]  # must not be reset