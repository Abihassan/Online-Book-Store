"""006 - Create downloads, bookmarks, cart_items, wishlist_items, chat_logs tables"""
from alembic import op
import sqlalchemy as sa

revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("downloads",
        sa.Column("id",            sa.String(36), primary_key=True),
        sa.Column("user_id",       sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",       sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("downloaded_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table("bookmarks",
        sa.Column("id",          sa.String(36), primary_key=True),
        sa.Column("user_id",     sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",     sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_number", sa.Integer(),  nullable=True),
        sa.Column("note",        sa.Text(),     nullable=True),
        sa.Column("created_at",  sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table("cart_items",
        sa.Column("id",       sa.String(36), primary_key=True),
        sa.Column("user_id",  sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",  sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("quantity", sa.Integer(),  nullable=False, server_default="1"),
        sa.Column("added_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table("wishlist_items",
        sa.Column("id",       sa.String(36), primary_key=True),
        sa.Column("user_id",  sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",  sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("added_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table("chat_logs",
        sa.Column("id",        sa.String(36), primary_key=True),
        sa.Column("user_id",   sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("role",      sa.String(10), nullable=False),
        sa.Column("message",   sa.Text(),     nullable=False),
        sa.Column("timestamp", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index("ix_chat_logs_user_id", "chat_logs", ["user_id"])

def downgrade():
    op.drop_table("chat_logs")
    op.drop_table("wishlist_items")
    op.drop_table("cart_items")
    op.drop_table("bookmarks")
    op.drop_table("downloads")