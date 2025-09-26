"""add top_matches to algo_outputs

Revision ID: 565c4a5ba5bd
Revises: 968cadc93f13
Create Date: 2025-09-25 10:54:26.112482

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '565c4a5ba5bd'
down_revision: Union[str, Sequence[str], None] = '968cadc93f13'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('algo_outputs', sa.Column('top_matches', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('algo_outputs', 'top_matches')
