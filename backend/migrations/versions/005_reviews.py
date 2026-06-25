"""005 - Create reviews table"""
from alembic import op
import sqlalchemy as sa

revision = "005"
down_revision = "004"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("reviews",
        sa.Column("id",              sa.String(36), primary_key=True),
        sa.Column("user_id",         sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("book_id",         sa.String(36), sa.ForeignKey("books.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating",          sa.Integer(),  nullable=False),
        sa.Column("comment",         sa.Text(),     nullable=True),
        sa.Column("sentiment_score", sa.Float(),    nullable=True),
        sa.Column("created_at",      sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "book_id", name="uq_user_book_review"),
    )
    op.create_index("ix_reviews_book_id", "reviews", ["book_id"])

def downgrade():
    op.drop_index("ix_reviews_book_id", "reviews")
    op.drop_table("reviews")