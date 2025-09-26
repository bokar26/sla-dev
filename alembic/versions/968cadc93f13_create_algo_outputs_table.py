"""create algo_outputs table

Revision ID: 968cadc93f13
Revises: 4a1639edc432
Create Date: 2025-09-25 10:12:18.227998

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '968cadc93f13'
down_revision: Union[str, Sequence[str], None] = '4a1639edc432'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create the algo_outputs table
    op.create_table('algo_outputs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('tenant_id', sa.String(), nullable=True),
        sa.Column('request_type', sa.Enum('sourcing', 'quoting', 'shipping', name='request_type_enum'), nullable=False),
        sa.Column('request_id', sa.String(), nullable=True),
        sa.Column('model', sa.String(), nullable=True),
        sa.Column('model_version', sa.String(), nullable=True),
        sa.Column('num_matches_ge_80', sa.Integer(), nullable=False),
        sa.Column('total_matches', sa.Integer(), nullable=True),
        sa.Column('top_match_score', sa.Float(), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('input_payload', sa.JSON(), nullable=True),
        sa.Column('output_summary', sa.Text(), nullable=True),
        sa.Column('reasoning', sa.JSON(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_algo_outputs_created_at', 'algo_outputs', ['created_at'], unique=False)
    op.create_index('idx_algo_outputs_created_at_type', 'algo_outputs', ['created_at', 'request_type'], unique=False)
    op.create_index('idx_algo_outputs_request_type', 'algo_outputs', ['request_type'], unique=False)
    op.create_index('idx_algo_outputs_user_id', 'algo_outputs', ['user_id'], unique=False)


def downgrade() -> None:
    """Downgrade schema."""
    # Drop indexes
    op.drop_index('idx_algo_outputs_user_id', table_name='algo_outputs')
    op.drop_index('idx_algo_outputs_request_type', table_name='algo_outputs')
    op.drop_index('idx_algo_outputs_created_at_type', table_name='algo_outputs')
    op.drop_index('idx_algo_outputs_created_at', table_name='algo_outputs')
    
    # Drop the table
    op.drop_table('algo_outputs')