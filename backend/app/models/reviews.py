import uuid

from sqlalchemy import BigInteger, CheckConstraint, Column, DateTime, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Review(Base):
    __tablename__ = "reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,)

    pull_request_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "pull_requests.id",
            name="fk_reviews_pull_request_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    reviewer_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "contributors.id",
            name="fk_reviews_reviewer_id",
        ),
        nullable=False,
        index=True,
    )

    github_review_id = Column(BigInteger, nullable=False, unique=True)

    state = Column(String, nullable=False)

    submitted_at = Column(DateTime, nullable=False, index=True)

    __table_args__ = (
        CheckConstraint(
            "state IN ('approved', 'changes_requested', 'commented')",
            name="ck_reviews_state",
        ),
    )

    def __repr__(self):
        return f"<Review {self.github_review_id}>"