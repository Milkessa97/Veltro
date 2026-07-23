"""remove_pull_request_reviewers_status_constraint

Revision ID: a165e763d931
Revises: 7d94bc0cba13
Create Date: 2026-07-16 19:03:04.577288

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a165e763d931'
down_revision: Union[str, Sequence[str], None] = '7d94bc0cba13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint('ck_pull_request_reviewers_status', 'pull_request_reviewers', type_='check')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_check_constraint(
        'ck_pull_request_reviewers_status',
        'pull_request_reviewers',
        "status IN ('approved','changes_requested')"
    )
