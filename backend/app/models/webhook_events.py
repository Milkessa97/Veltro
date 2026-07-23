import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.db.session import Base


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "repositories.id",
            name="fk_webhook_events_repository_id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    event_type = Column(String, nullable=False, index=True)
    action = Column(String,nullable=True)
    github_delivery = Column(String,nullable=False,unique=True)
    payload = Column(JSONB,nullable=False,)
    processed = Column(Boolean,nullable=False,server_default="false")
    error_message = Column(Text,nullable=True)
    received_at = Column(DateTime,nullable=False)
    processed_at = Column(DateTime,nullable=True)

    __table_args__ = (
        Index(
            "ix_webhook_events_processed_false",
            "processed",
            postgresql_where=(processed == False),  # noqa: E712
        ),
    )

    def __repr__(self):
        return (
            f"<WebhookEvent "
            f"event={self.event_type} "
            f"delivery={self.github_delivery}>"
        )