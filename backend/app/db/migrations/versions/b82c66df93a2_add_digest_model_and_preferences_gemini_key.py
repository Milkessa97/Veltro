"""add_digest_model_and_preferences_gemini_key

Revision ID: b82c66df93a2
Revises: a165e763d931
Create Date: 2026-07-18 18:15:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b82c66df93a2'
down_revision: Union[str, Sequence[str], None] = 'a165e763d931'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add gemini_api_key to user_preferences
    op.add_column('user_preferences', sa.Column('gemini_api_key', sa.String(length=500), nullable=True))

    # 2. Create digests table
    op.create_table(
        'digests',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('repository_id', sa.UUID(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('is_stale', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('generated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.CheckConstraint("type IN ('weekly', 'bottleneck', 'manual')", name='ck_digest_type'),
        sa.ForeignKeyConstraint(['repository_id'], ['repositories.id'], name='fk_digests_repository_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_digests_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    # 3. Create indices for digests
    op.create_index(op.f('ix_digests_repository_id'), 'digests', ['repository_id'], unique=False)
    op.create_index(op.f('ix_digests_user_id'), 'digests', ['user_id'], unique=False)
    op.create_index('ix_digests_generated_at_desc', 'digests', ['generated_at'], unique=False)


def downgrade() -> None:
    # 1. Drop indices
    op.drop_index('ix_digests_generated_at_desc', table_name='digests')
    op.drop_index(op.f('ix_digests_user_id'), table_name='digests')
    op.drop_index(op.f('ix_digests_repository_id'), table_name='digests')

    # 2. Drop digests table
    op.drop_table('digests')

    # 3. Drop gemini_api_key from user_preferences
    op.drop_column('user_preferences', 'gemini_api_key')
