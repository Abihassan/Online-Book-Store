"""004 - Create reading_sessions table"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("reading_sessions",
        sa.Column("id",               sa.String(36), primary_key=True),
        sa.Column("user_id",          sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",          sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("started_at",       sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("ended_at",         sa.DateTime(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(),  nullable=True),
        sa.Column("pages_read",       sa.Integer(),  server_default="0"),
        sa.Column("device_type",      sa.String(50), server_default="web"),
    )
    op.create_index("ix_session_user_book", "reading_sessions", ["user_id", "book_id"])

def downgrade():
    op.drop_index("ix_session_user_book", "reading_sessions")
    op.drop_table("reading_sessions")