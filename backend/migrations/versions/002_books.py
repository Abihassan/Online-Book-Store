"""002 - Create books table

Revision ID: 002
"""
from alembic import op
import sqlalchemy as sa

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "books",
        sa.Column("id",             sa.String(36),  primary_key=True),
        sa.Column("title",          sa.String(500), nullable=False),
        sa.Column("author",         sa.String(255), nullable=False),
        sa.Column("genre",          sa.String(100), nullable=True),
        sa.Column("isbn",           sa.String(20),  nullable=True),
        sa.Column("price",          sa.Float(),     nullable=False),
        sa.Column("original_price", sa.Float(),     nullable=True),
        sa.Column("is_free",        sa.Boolean(),   server_default="false"),
        sa.Column("file_url",       sa.String(500), nullable=True),
        sa.Column("cover_url",      sa.String(500), nullable=True),
        sa.Column("description",    sa.Text(),      nullable=True),
        sa.Column("pages",          sa.Integer(),   nullable=True),
        sa.Column("language",       sa.String(50),  server_default="English"),
        sa.Column("rating",         sa.Float(),     server_default="0"),
        sa.Column("review_count",   sa.Integer(),   server_default="0"),
        sa.Column("badge",          sa.String(50),  nullable=True),
        sa.Column("published_date", sa.String(20),  nullable=True),
        sa.Column("is_active",      sa.Boolean(),   server_default="true"),
        sa.Column("created_at",     sa.DateTime(),  server_default=sa.func.now()),
        sa.Column("updated_at",     sa.DateTime(),  nullable=True),
    )
    op.create_index("ix_books_genre",  "books", ["genre"])
    op.create_index("ix_books_author", "books", ["author"])


def downgrade():
    op.drop_index("ix_books_author", "books")
    op.drop_index("ix_books_genre",  "books")
    op.drop_table("books")