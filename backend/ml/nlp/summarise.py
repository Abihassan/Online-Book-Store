"""
Extractive book summariser.
Ranks sentences by TF-IDF importance and returns the top-N.
"""
import re
from typing import List
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np


def _split_sentences(text: str) -> List[str]:
    """Simple sentence splitter — handles ., !, ? boundaries."""
    text = re.sub(r"\s+", " ", text).strip()
    sentences = re.split(r"(?<=[.!?])\s+", text)
    return [s.strip() for s in sentences if len(s.strip()) > 20]


def summarise(text: str, n_sentences: int = 3) -> str:
    """
    Extractive summary: pick the top-N most important sentences.
    Falls back to first N sentences if TF-IDF fails (too little text).
    """
    if not text or not text.strip():
        return ""

    sentences = _split_sentences(text)
    if len(sentences) <= n_sentences:
        return " ".join(sentences)

    try:
        tfidf = TfidfVectorizer(stop_words="english", max_features=500)
        matrix = tfidf.fit_transform(sentences)
        scores = np.asarray(matrix.sum(axis=1)).flatten()
        top_indices = sorted(
            np.argsort(scores)[-n_sentences:].tolist()
        )  # preserve original order
        return " ".join(sentences[i] for i in top_indices)
    except Exception:
        return " ".join(sentences[:n_sentences])


def summarise_book(book: dict, n_sentences: int = 3) -> str:
    """Summarise a book dict with 'description' field."""
    description = book.get("description") or book.get("title", "")
    return summarise(description, n_sentences)


def batch_summarise(books: list, n_sentences: int = 3) -> list:
    """Summarise a list of book dicts. Returns list with added 'summary' field."""
    return [
        {**book, "summary": summarise_book(book, n_sentences)}
        for book in books
    ]