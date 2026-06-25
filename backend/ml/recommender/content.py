"""Content-based recommender using TF-IDF on title + genre + description."""
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


def build_content_model(books_df: pd.DataFrame) -> dict:
    """
    Build a book-to-book similarity matrix from text features.
    Returns a dict with vectorizer, matrix, and book_id index.
    """
    books_df = books_df.copy().reset_index(drop=True)

    # Combine text fields with genre weighted 3×
    books_df["text"] = (
        books_df["title"].fillna("") + " " +
        (books_df["genre"].fillna("") + " ") * 3 +
        books_df["author"].fillna("") + " " +
        books_df["description"].fillna("")
    )

    tfidf = TfidfVectorizer(
        max_features=5000,
        stop_words="english",
        ngram_range=(1, 2),
        sublinear_tf=True,
    )
    matrix = tfidf.fit_transform(books_df["text"])
    sim_matrix = cosine_similarity(matrix, matrix)
    book_ids = books_df["id"].tolist()
    id_to_idx = {bid: i for i, bid in enumerate(book_ids)}

    return {
        "tfidf": tfidf,
        "sim_matrix": sim_matrix,
        "book_ids": book_ids,
        "id_to_idx": id_to_idx,
    }


def get_similar_books(book_id: str, model: dict, top_n: int = 10) -> list:
    """Return top_n most similar book IDs to a given book."""
    idx = model["id_to_idx"].get(book_id)
    if idx is None:
        return []
    scores = list(enumerate(model["sim_matrix"][idx]))
    scores = sorted(scores, key=lambda x: x[1], reverse=True)
    return [model["book_ids"][i] for i, _ in scores[1: top_n + 1]]


def get_content_scores_for_user(user_book_ids: list, model: dict, all_book_ids: list) -> dict:
    """
    Given books a user has interacted with, aggregate similarity scores
    for all other books. Returns {book_id: score}.
    """
    scores = np.zeros(len(model["book_ids"]))
    for bid in user_book_ids:
        idx = model["id_to_idx"].get(bid)
        if idx is not None:
            scores += model["sim_matrix"][idx]
    result = {}
    for i, bid in enumerate(model["book_ids"]):
        if bid not in user_book_ids:
            result[bid] = float(scores[i])
    return result