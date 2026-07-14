import uuid
from sqlalchemy import Integer, String, Column, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base

class Contributors(Base):
    __tablename__ = "contributors"

    id = Column(UUID(as_uuid=True), primary_key=True, default = uuid.uuid4)
    repository_id = Column(
        UUID(as_uuid=True), 
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False, 
        index=True,
    )

    github_id = Column(Integer,nullable = True)
    github_login = Column(String,nullable =False)
    display_name = Column(String,nullable =False)
    avatar_url = Column(String, nullable=False)

    __table_args__ = (
        UniqueConstraint('github_id', 'repository_id', name='uq_github_id_repository_id'),
    )

    def __repr__(self):
        return f"<Contributors {self.id}>"