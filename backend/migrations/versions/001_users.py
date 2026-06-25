"""001 - Create users table

Revision ID: 001
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id",            sa.String(36),  primary_key=True),
        sa.Column("email",         sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name",          sa.String(255), nullable=False),
        sa.Column("role",          sa.String(20),  nullable=False, server_default="customer"),
        sa.Column("is_active",     sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("avatar_url",    sa.String(500), nullable=True),
        sa.Column("created_at",    sa.DateTime(),  nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at",    sa.DateTime(),  nullable=True),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)


def downgrade():
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")