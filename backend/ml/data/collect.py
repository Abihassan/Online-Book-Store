"""
Collect and cache raw data snapshots from PostgreSQL for ML training.
Run standalone:  python -m ml.data.collect
"""
import os
import pandas as pd
from pathlib import Path
from datetime import datetime
from ml.data.db_connect import get_books_df, get_orders_df, get_sessions_df, get_reviews_df

DATA_DIR = Path(os.getenv("ML_DATA_DIR", "./ml/data/snapshots"))
DATA_DIR.mkdir(parents=True, exist_ok=True)


def collect_all(save: bool = True) -> dict:
    """Pull all tables needed for ML and optionally save as parquet snapshots."""
    print(f"[{datetime.utcnow().isoformat()}] Collecting data from DB…")

    books    = get_books_df()
    orders   = get_orders_df()
    sessions = get_sessions_df()
    reviews  = get_reviews_df()

    print(f"  books={len(books)}  orders={len(orders)}  sessions={len(sessions)}  reviews={len(reviews)}")

    if save:
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M")
        books.to_parquet(DATA_DIR / f"books_{ts}.parquet",    index=False)
        orders.to_parquet(DATA_DIR / f"orders_{ts}.parquet",  index=False)
        sessions.to_parquet(DATA_DIR / f"sessions_{ts}.parquet", index=False)
        reviews.to_parquet(DATA_DIR / f"reviews_{ts}.parquet", index=False)
        print(f"  Snapshots saved → {DATA_DIR}")

    return {
        "books": books,
        "orders": orders,
        "sessions": sessions,
        "reviews": reviews,
    }


def load_latest_snapshot(table: str) -> pd.DataFrame:
    """Load the most recent parquet snapshot for a given table name."""
    files = sorted(DATA_DIR.glob(f"{table}_*.parquet"))
    if not files:
        raise FileNotFoundError(f"No snapshot found for table '{table}' in {DATA_DIR}")
    return pd.read_parquet(files[-1])


if __name__ == "__main__":
    collect_all(save=True)