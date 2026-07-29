"""add auto_login to triggered_by constraint

Revision ID: c1a2b3d4e5f6
Revises: b82c66df93a2
Create Date: 2026-07-28 20:13:00.000000

"""
from alembic import op

# revision identifiers, used by Alembic.
revision = 'c1a2b3d4e5f6'
down_revision = 'b82c66df93a2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop the old constraint and recreate with 'auto_login' added
    op.drop_constraint('ck_sync_logs_triggered_by', 'sync_logs', type_='check')
    op.create_check_constraint(
        'ck_sync_logs_triggered_by',
        'sync_logs',
        "triggered_by IN ('manual', 'webhook', 'scheduled', 'auto_login')"
    )


def downgrade() -> None:
    op.drop_constraint('ck_sync_logs_triggered_by', 'sync_logs', type_='check')
    op.create_check_constraint(
        'ck_sync_logs_triggered_by',
        'sync_logs',
        "triggered_by IN ('manual', 'webhook', 'scheduled')"
    )
