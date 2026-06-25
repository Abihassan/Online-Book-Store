"""Hybrid recommender: weighted blend of content + collaborative scores."""
import pandas as pd


def get_hybrid_scores(
    user_id: str,
    user_book_ids: list,
    all_book_ids: list,
    content_model: dict,
    collab_model: dict,
    books_df: pd.DataFrame,
    content_weight: float = 0.4,
    collab_weight: float = 0.6,
) -> dict:
    """
    Blend content-based and collaborative filtering scores.
    Falls back to bestseller ranking for cold-start users (< 3 interactions).
    Returns {book_id: final_score} for all books not yet read by user.
    """
    from ml.recommender.content import get_content_scores_for_user
    from ml.recommender.collab import get_collab_scores

    unread = [bid for bid in all_book_ids if bid not in user_book_ids]

    # Cold-start fallback: new user with few interactions
    if len(user_book_ids) < 3:
        return _bestseller_fallback(books_df, unread)

    content_scores = get_content_scores_for_user(user_book_ids, content_model, all_book_ids)
    collab_scores  = get_collab_scores(user_id, unread, collab_model, set(user_book_ids))

    # Normalise both score sets to [0, 1]
    def _norm(d: dict) -> dict:
        if not d: return d
        mn, mx = min(d.values()), max(d.values())
        rng = mx - mn or 1
        return {k: (v - mn) / rng for k, v in d.items()}

    c_norm = _norm(content_scores)
    f_norm = _norm(collab_scores)

    hybrid = {}
    for bid in unread:
        c = c_norm.get(bid, 0)
        f = f_norm.get(bid, 0)
        # If collab has no data for this user, lean fully on content
        w_c = content_weight if collab_scores else 1.0
        w_f = collab_weight if collab_scores else 0.0
        hybrid[bid] = round(c * w_c + f * w_f, 6)

    return hybrid


def _bestseller_fallback(books_df: pd.DataFrame, book_ids: list) -> dict:
    """Rank books by rating × log(review_count) as popularity proxy."""
    import numpy as np
    sub = books_df[books_df["id"].isin(book_ids)].copy()
    sub["score"] = sub["rating"] * np.log1p(sub.get("review_count", 1).fillna(1))
    return dict(zip(sub["id"], sub["score"]))


def top_n(scores: dict, n: int = 10) -> list:
    """Return top-N book IDs sorted by score descending."""
    return [bid for bid, _ in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:n]]