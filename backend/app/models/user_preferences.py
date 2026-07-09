import uuid
from sqlalchemy import DateTime, Integer, Column, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base

class UserPreferences(Base):
    __tablename__ = "user_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False, 
        unique=True,
        index=True,
    )

    default_repository_id = Column(UUID(as_uuid = True),ForeignKey("repositories.id", ondelete="SET NULL", name="fk_user_preferences_default_repository_id"),nullable = True)
    default_date_range_days = Column(Integer,nullable =False,server_default="30")
    digest_panel_expanded = Column(Boolean,nullable =False,server_default="true")
    is_onboarded = Column(Boolean, nullable=False, server_default="false")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        CheckConstraint(
            "default_date_range_days IN (7,30,90)",
            name = "ck_user_preferences_date_range"
        ),
    )

    def __repr__(self):
        return f"<UserPreference {self.id}>"