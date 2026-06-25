"""003 - Create orders and order_items tables"""
from alembic import op
import sqlalchemy as sa

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("orders",
        sa.Column("id",               sa.String(36), primary_key=True),
        sa.Column("user_id",          sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("total",            sa.Float(),    nullable=False),
        sa.Column("status",           sa.String(50), server_default="pending"),
        sa.Column("shipping_address", sa.JSON(),     nullable=True),
        sa.Column("payment_method",   sa.String(100), nullable=True),
        sa.Column("created_at",       sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table("order_items",
        sa.Column("id",       sa.String(36), primary_key=True),
        sa.Column("order_id", sa.String(36), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",  sa.String(36), sa.ForeignKey("books.id"),  nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("price",    sa.Float(),   nullable=False),
    )
    op.create_index("ix_orders_user_id", "orders", ["user_id"])

def downgrade():
    op.drop_table("order_items")
    op.drop_table("orders")