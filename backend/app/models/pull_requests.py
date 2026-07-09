import uuid
from sqlalchemy import DateTime, Integer, String, Column, ForeignKey, Boolean, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base

class PullRequests(Base):
    __tablename__ = "pull_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    repository_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("repositories.id", ondelete="CASCADE",name="fk_pull_requests_repository_id"),
        nullable=False,
        index=True,
    )
    author_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("contributors.id", ondelete="CASCADE",name="fk_pull_requests_author_id"),
        nullable=False,
        index=True,
    )

    github_pr_number = Column(Integer,nullable = False)
    title = Column(String,nullable =False)
    state = Column(String, nullable=False,index=True)
    opened_at = Column(DateTime, nullable=False)
    first_review_at = Column(DateTime, nullable=True)
    merged_at = Column(DateTime, nullable=True)
    closed_at = Column(DateTime, nullable=True)
    additions = Column(Integer, nullable=False,server_default="0")
    deletions = Column(Integer, nullable=False,server_default="0")
    

    __table_args__ = (
        UniqueConstraint('github_pr_number','repository_id',name='uq_github_pr_number_repository_id'),
        CheckConstraint("state IN ('open','closed','merged')",name="ck_pr_state"),
        Index(
            "ix_pull_requests_repository_opened_at",
            "repository_id",
            "opened_at",
        ),
    )

    def __repr__(self):
        return f"<PullRequests {self.id}>"