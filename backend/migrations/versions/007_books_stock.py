"""007 - Add stock column to books table

Revision ID: 007
"""
from alembic import op
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "books",
        sa.Column("stock", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade():
    op.drop_column("books", "stock")