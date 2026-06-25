"""Base database connection for ML pipeline using SQLAlchemy + pandas."""
import os
import pandas as pd
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:abi123@localhost:5432/online_book_store")
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    return _engine


def query_df(sql: str, params: dict = None) -> pd.DataFrame:
    """Execute a SQL query and return a pandas DataFrame."""
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(text(sql), conn, params=params)


def get_books_df() -> pd.DataFrame:
    return query_df(
        "SELECT id, title, author, genre, description, price, rating, review_count "
        "FROM books WHERE is_active = TRUE"
    )


def get_orders_df() -> pd.DataFrame:
    return query_df(
        "SELECT o.user_id, oi.book_id, oi.quantity, oi.price, o.created_at "
        "FROM orders o JOIN order_items oi ON oi.order_id = o.id"
    )


def get_sessions_df() -> pd.DataFrame:
    return query_df(
        "SELECT user_id, book_id, started_at, ended_at, duration_seconds, "
        "pages_read, device_type FROM reading_sessions WHERE ended_at IS NOT NULL"
    )


def get_reviews_df() -> pd.DataFrame:
    return query_df(
        "SELECT id, user_id, book_id, rating, comment, created_at FROM reviews"
    )