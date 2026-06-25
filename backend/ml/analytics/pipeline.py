"""Reading analytics pipeline — pull sessions from DB into pandas."""
from ml.data.db_connect import get_sessions_df, get_books_df
import pandas as pd


def load_sessions_enriched() -> pd.DataFrame:
    """Load reading sessions joined with book metadata."""
    sessions = get_sessions_df()
    books    = get_books_df()[["id", "genre", "title"]]
    if sessions.empty:
        return pd.DataFrame()
    df = sessions.merge(books, left_on="book_id", right_on="id", how="left")
    df["started_at"] = pd.to_datetime(df["started_at"])
    df["ended_at"]   = pd.to_datetime(df["ended_at"])
    df["hour"]       = df["started_at"].dt.hour
    df["dow"]        = df["started_at"].dt.dayofweek   # 0=Mon 6=Sun
    df["month"]      = df["started_at"].dt.to_period("M").astype(str)
    return df