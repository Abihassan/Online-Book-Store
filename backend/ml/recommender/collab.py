"""Collaborative filtering using surprise SVD on user-book rating matrix."""
import pandas as pd
from surprise import SVD, Dataset, Reader, accuracy
from surprise.model_selection import train_test_split


def build_collab_model(interactions_df: pd.DataFrame) -> dict:
    """
    Train surprise SVD on user × book interactions.
    interactions_df must have: user_id, book_id, score columns.
    Returns trained algorithm + raw data for predictions.
    """
    if interactions_df.empty or len(interactions_df) < 5:
        return {"algo": None, "rmse": None, "trained": False}

    reader = Reader(rating_scale=(1, 10))
    data = Dataset.load_from_df(
        interactions_df[["user_id", "book_id", "score"]], reader
    )

    trainset, testset = train_test_split(data, test_size=0.2, random_state=42)

    algo = SVD(n_factors=50, n_epochs=20, lr_all=0.005, reg_all=0.02, random_state=42)
    algo.fit(trainset)

    predictions = algo.test(testset)
    rmse = accuracy.rmse(predictions, verbose=False)

    return {"algo": algo, "trainset": trainset, "rmse": round(rmse, 4), "trained": True}


def get_collab_scores(user_id: str, all_book_ids: list, model: dict,
                      user_read_ids: set = None) -> dict:
    """
    Predict scores for all books for a given user.
    Returns {book_id: predicted_score}.
    """
    algo = model.get("algo")
    if algo is None:
        return {}

    user_read_ids = user_read_ids or set()
    scores = {}
    for book_id in all_book_ids:
        if book_id in user_read_ids:
            continue
        pred = algo.predict(user_id, book_id)
        scores[book_id] = round(pred.est, 4)
    return scores