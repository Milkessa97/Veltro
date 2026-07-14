import uuid

from sqlalchemy import CheckConstraint, Column, DateTime, ForeignKey, Index, Integer, String, Text

from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    repository_id = Column(UUID(as_uuid=True),
        ForeignKey(
            "repositories.id",
            name="fk_sync_logs_repository_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    status = Column(String, nullable=False)

    triggered_by = Column(String, nullable=False)

    prs_fetched = Column(Integer, nullable=False, server_default="0")

    reviews_fetched = Column(Integer, nullable=False, server_default="0")

    commits_fetched = Column(Integer, nullable=False, server_default="0")

    error_message = Column(Text, nullable=True)

    started_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    __table_args__ = (
        CheckConstraint(
            "status IN ('running', 'completed', 'failed')",
            name="ck_sync_logs_status",
        ),
        CheckConstraint(
            "triggered_by IN ('manual', 'webhook', 'scheduled')",
            name="ck_sync_logs_triggered_by",
        ),
        Index(
            "ix_sync_logs_started_at_desc",
            started_at.desc(),
        ),
    )

    def __repr__(self):
        return (
            f"<SyncLog {self.id} "
            f"status={self.status} "
            f"repository_id={self.repository_id}>"
        )