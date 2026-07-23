import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, String, UniqueConstraint

from sqlalchemy.dialects.postgresql import UUID

from app.db.session import Base


class Commit(Base):
    __tablename__ = "commits"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "repositories.id",
            name="fk_commits_repository_id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "contributors.id",
            name="fk_commits_author_id",
        ),
        nullable=False,
        index=True,
    )

    sha = Column(String(40), nullable=False)

    message = Column(String, nullable=False)

    committed_at = Column(DateTime, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "sha",
            "repository_id",
            name="uq_commits_sha_repository",
        ),
        Index(
            "ix_commits_committed_at_desc",
            committed_at.desc(),
        ),
    )

    def __repr__(self):
        return f"<Commit {self.sha[:7]}>"