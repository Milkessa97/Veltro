import uuid
from sqlalchemy import Column, DateTime, ForeignKey, String, Text, Boolean, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.db.session import Base


class Digest(Base):
    """
    SQLAlchemy model representing generated AI digests.
    """
    __tablename__ = "digests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    content = Column(Text, nullable=False)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    is_stale = Column(Boolean, nullable=False, default=False, server_default="false")
    generated_at = Column(
        DateTime, nullable=False, default=func.now(), server_default=func.now(), index=True
    )
    type = Column(String(50), nullable=False)

    __table_args__ = (
        CheckConstraint(
            "type IN ('weekly', 'bottleneck', 'manual')",
            name="ck_digest_type"
        ),
        Index("ix_digests_generated_at_desc", generated_at.desc()),
    )

    def __repr__(self) -> str:
        return f"<Digest type={self.type} generated_at={self.generated_at}>"
