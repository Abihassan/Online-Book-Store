"""Build user-book interaction DataFrame for the recommender system."""
import pandas as pd
from ml.data.db_connect import get_orders_df, get_sessions_df, get_reviews_df


def build_interactions() -> pd.DataFrame:
    """
    Combine orders, reading sessions, and reviews into a single
    user × book interaction DataFrame with an implicit rating.

    Implicit rating formula:
      - Purchased = +3 pts
      - Per 10 min of reading = +1 pt (capped at 5)
      - User review rating (1-5) = direct score, weight 2×
    Final score is clipped to [1, 10].
    """
    orders = get_orders_df()
    sessions = get_sessions_df()
    reviews = get_reviews_df()

    records = []

    # Purchases
    for _, row in orders.iterrows():
        records.append({"user_id": row["user_id"], "book_id": row["book_id"], "score": 3.0})

    # Reading time
    for _, row in sessions.iterrows():
        mins = (row["duration_seconds"] or 0) / 60
        score = min(5.0, mins / 10)
        if score > 0:
            records.append({"user_id": row["user_id"], "book_id": row["book_id"], "score": score})

    # Reviews
    for _, row in reviews.iterrows():
        records.append({"user_id": row["user_id"], "book_id": row["book_id"], "score": float(row["rating"]) * 2})

    if not records:
        return pd.DataFrame(columns=["user_id", "book_id", "score"])

    df = pd.DataFrame(records)
    df = df.groupby(["user_id", "book_id"], as_index=False)["score"].sum()
    df["score"] = df["score"].clip(1, 10)
    return df