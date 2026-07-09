import uuid
from sqlalchemy import DateTime, Integer, String, Column, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base

class PrLabels(Base):
    __tablename__ = "pr_labels"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    pull_request_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("pull_requests.id", ondelete="CASCADE",name="fk_pr_labels_pull_request_id"),
        nullable=False, 
        index=True,
    )

    name = Column(String,nullable = True)
    color = Column(String,nullable =False)

    __table_args__ = (
        UniqueConstraint('name', 'pull_request_id', name='uq_name_pull_request_id'),
    )

    def __repr__(self):
        return f"<PrLabels {self.id}>"