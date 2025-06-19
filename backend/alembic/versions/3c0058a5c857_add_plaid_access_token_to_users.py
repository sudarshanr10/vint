"""add plaid_access_token to users

Revision ID: 3c0058a5c857
Revises: <your_previous_revision_id>
Create Date: 2025-06-16 22:51:26.175953

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '3c0058a5c857'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # add the new nullable column to the existing users table
    op.add_column(
        'users',
        sa.Column('plaid_access_token', sa.String(length=255), nullable=True)
    )


def downgrade() -> None:
    # remove it on downgrade
    op.drop_column('users', 'plaid_access_token')
