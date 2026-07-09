import uuid
from sqlalchemy import DateTime, Integer, String, Column, ForeignKey, Boolean, UniqueConstraint, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base

class PullRequestReviewers(Base):
    __tablename__ = "pull_request_reviewers"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    pull_request_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("pull_requests.id", ondelete="CASCADE",name="fk_pull_request_reviewers_pull_request_id"),
        nullable=False,
        index=True,
    )
    contributor_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("contributors.id", ondelete="CASCADE",name="fk_pull_request_reviewers_contributor_id"),
        nullable=False,
        index=True,
    )

    status = Column(String,nullable = False,index=True)
    requested_at = Column(DateTime,nullable =False)
    
    

    __table_args__ = (
        UniqueConstraint('pull_request_id','contributor_id',name='uq_pull_request_id_contributor_id'),
        CheckConstraint("status IN ('approved','changes_requested')",name="ck_pull_request_reviewers_status"),
        Index(
            "ix_pull_request_reviewers_pr_contributor_id",
            "pull_request_id",
            "contributor_id",
        ),
    )

    def __repr__(self):
        return f"<PullRequestReviewers {self.id}>"