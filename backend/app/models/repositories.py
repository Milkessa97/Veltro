import uuid
from sqlalchemy import DateTime, Integer, String, Column, ForeignKey, Boolean, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.db.session import Base

class Repositories(Base):
    __tablename__ = "repositories"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    github_id = Column(Integer,nullable = True)
    owner = Column(String,nullable =False)
    name = Column(String,nullable =False)
    full_name = Column(String, nullable=False)
    is_private = Column(Boolean, nullable=False)
    is_synced = Column(Boolean, nullable=False, server_default="false")
    synced_at = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint('github_id','user_id',name='uq_github_id_user_id'),
    )

    def __repr__(self):
        return f"<Repositories {self.id}>"